/**
 * Conversational Entity & Reference Resolution Engine (ENG-001 / AI-002)
 *
 * Implements robust conversational product context, reference resolution, pronoun mapping,
 * group references, ordinal/superlative selection, and deterministic local-first execution.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number; // in paise
  currency?: string;
  category: string;
  inventory?: number;
  specs?: string;
  badge?: string;
  rating?: number;
  image?: string;
  [key: string]: any;
}

export interface ProductReference {
  productId: string;
  name: string;
  category: string;
  price: number;
  turnIndex: number;
  role: "assistant" | "user";
  contextRole?: "recommended" | "selected" | "compared" | "in_cart";
}

export interface ConversationTurn {
  role: "user" | "agent";
  content: string;
  productsMentioned?: string[];
  recommendedProductIds?: string[];
  action?: string;
}

export interface ConversationalProductContext {
  lastProductSet: string[]; // Ordered list of product IDs from the most recent recommendation/search
  lastRecommendedProductIds: string[];
  lastSelectedProductId: string | null;
  lastMentionedProductIds: string[];
  lastComparedProductIds: string[];
  productRegistry: Record<string, ProductReference>; // All products referenced in conversation
  turnHistory: ConversationTurn[];
}

export interface CartItemContext {
  productId: string;
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}

export interface ResolutionResult {
  intent: "ADD_TO_CART" | "REMOVE_FROM_CART" | "VIEW_PRODUCT" | "COMPARE" | "CLARIFY" | "RECOMMEND" | "INFO";
  resolvedProducts: CatalogProduct[];
  quantities: Record<string, number>;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "AMBIGUOUS";
  referenceType?: "PRONOUN_PLURAL" | "PRONOUN_SINGULAR" | "ORDINAL" | "SUPERLATIVE" | "CATEGORY" | "EXPLICIT_NAME" | "CART_REFERENCE" | "NONE";
  referenceText?: string;
  clarificationPrompt?: string;
  reason: string;
  companionProducts?: CatalogProduct[];
  updatedContext: ConversationalProductContext;
}

// Category keyword mappings for semantic resolution
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  GPUs: ["gpu", "gpus", "graphics card", "graphics cards", "graphics", "video card", "rtx", "geforce", "radeon"],
  CPUs: ["cpu", "cpus", "processor", "processors", "chip", "ryzen", "intel", "core i9", "7800x3d"],
  Monitors: ["monitor", "monitors", "display", "displays", "screen", "screens", "oled", "4k monitor", "gaming monitor"],
  Keyboards: ["keyboard", "keyboards", "mechanical keyboard", "typing board", "switches"],
  Mice: ["mouse", "mice", "gaming mouse", "wireless mouse", "trackpad"],
  Storage: ["ssd", "ssds", "storage", "nvme", "m.2", "solid state", "hard drive", "drive"],
  RAM: ["ram", "memory", "ddr5", "ddr4", "dimm"],
  Audio: ["audio", "headphone", "headphones", "headset", "earbuds", "earbud", "airbuds", "tws", "anc"],
  Wearables: ["smartwatch", "watch", "wearable", "wearables", "timepiece"],
  Accessories: ["accessory", "accessories", "charger", "fast charger", "gan", "adapter", "desk mat", "mouse pad", "mat"],
};

/**
 * Creates a fresh empty conversational product context.
 */
export function createInitialContext(): ConversationalProductContext {
  return {
    lastProductSet: [],
    lastRecommendedProductIds: [],
    lastSelectedProductId: null,
    lastMentionedProductIds: [],
    lastComparedProductIds: [],
    productRegistry: {},
    turnHistory: [],
  };
}

/**
 * Finds matching catalog products by explicit keywords or tokens.
 */
export function findExplicitProductsInText(text: string, catalog: CatalogProduct[]): CatalogProduct[] {
  const lower = text.toLowerCase();
  const matched: CatalogProduct[] = [];

  for (const product of catalog) {
    const nameLower = product.name.toLowerCase();
    
    // Direct substring or specific product identifier matching
    if (lower.includes(nameLower)) {
      matched.push(product);
      continue;
    }

    // Key token matching (e.g. "5090", "5080", "5070 ti", "rtx 4080", "7800x3d", "14900k", "merino wool", "gan dual", "airbuds ultra")
    const specificTerms: string[] = [];
    if (nameLower.includes("5090")) specificTerms.push("5090", "rtx 5090", "5090 32gb", "5090 super", "50 series flagship");
    if (nameLower.includes("5080")) specificTerms.push("5080", "rtx 5080", "5080 16gb", "5080 super");
    if (nameLower.includes("5070")) specificTerms.push("5070", "rtx 5070", "5070 ti", "rtx 5070 ti");
    if (nameLower.includes("4080")) specificTerms.push("4080", "rtx 4080", "4080 super");
    if (nameLower.includes("7800 xt")) specificTerms.push("7800 xt", "rx 7800");
    if (nameLower.includes("7800x3d")) specificTerms.push("7800x3d", "7800x", "ryzen 7800");
    if (nameLower.includes("14900k")) specificTerms.push("14900k", "i9-14900", "14900");
    if (nameLower.includes("oled")) specificTerms.push("oled", "vision ultra", "curved qd-oled");
    if (nameLower.includes("creator monitor")) specificTerms.push("creator monitor", "horizon 27", "4k monitor");
    if (nameLower.includes("canvas 24")) specificTerms.push("canvas 24", "180hz display", "1080p 180hz");
    if (nameLower.includes("velocity 2tb")) specificTerms.push("velocity", "2tb ssd", "gen4 nvme", "gen4 ssd");
    if (nameLower.includes("dominator 32gb")) specificTerms.push("dominator", "32gb ddr5", "ddr5-6000", "ddr5 ram");
    if (nameLower.includes("tactile wireless")) specificTerms.push("tactile wireless", "tactile keyboard", "gateron brown");
    if (nameLower.includes("apex 75%")) specificTerms.push("apex 75", "magnetic keyboard", "rapid trigger");
    if (nameLower.includes("carbon ultralight")) specificTerms.push("carbon ultralight", "38g mouse", "carbon mouse");
    if (nameLower.includes("precision ergonomic")) specificTerms.push("precision ergonomic", "49g mouse", "ergonomic mouse");
    if (nameLower.includes("studio pro")) specificTerms.push("studio pro", "studio pro wireless", "anc headphones");
    if (nameLower.includes("airbuds ultra")) specificTerms.push("airbuds", "airbuds ultra", "spatial tws");
    if (nameLower.includes("titanium smartwatch")) specificTerms.push("timepiece", "titanium smartwatch", "titanium watch");
    if (nameLower.includes("merino wool")) specificTerms.push("merino wool", "desk mat", "felt desk pad", "wool mat");
    if (nameLower.includes("65w gan")) specificTerms.push("65w gan", "gan charger", "dual fast charger", "gan dual");

    // Match generic 50-series query to all 50-series cards
    if (lower.includes("50 series") || lower.includes("rtx 50") || lower.includes("geforce 50") || lower.includes("50-series")) {
      if (nameLower.includes("5090") || nameLower.includes("5080") || nameLower.includes("5070")) {
        if (!matched.some((m) => m.id === product.id)) {
          matched.push(product);
        }
        continue;
      }
    }

    for (const term of specificTerms) {
      if (lower.includes(term)) {
        if (!matched.some((m) => m.id === product.id)) {
          matched.push(product);
        }
        break;
      }
    }
  }

  return matched;
}

/**
 * Detects if the prompt contains meaningless random characters or gibberish.
 */
export function isGibberishText(text: string): boolean {
  const clean = text.trim().toLowerCase();
  if (clean.length < 2) return true;
  
  // Known short keywords, greetings, and commands
  const knownKeywords = [
    "hi", "hey", "hello", "yo", "sup", "help", "pc", "gpu", "cpu", "ram", "ssd", "4k", "oled",
    "setup", "build", "desk", "gear", "cart", "buy", "add", "take", "drop", "item", "all",
    "them", "those", "both", "this", "that", "first", "second", "third", "last", "cheap",
    "cheaper", "cheapest", "best", "top", "more", "view", "show", "find", "search", "what",
    "where", "how", "specs", "price", "cost", "lakh", "under", "budget", "order", "keyboard",
    "mouse", "monitor", "display", "screen", "headphones", "earbuds", "watch", "charger", "mat",
    "rtx", "geforce", "radeon", "ryzen", "intel", "corsair", "gateron", "gaming", "creator",
    "remove", "clear", "cancel", "checkout", "pay", "yes", "no", "ok", "okay", "sure", "thanks",
    "thank", "thank you", "series", "50", "40", "30", "70", "80", "90", "5090", "5080", "5070"
  ];

  // If text contains any known keyword or product substring, it's valid
  const words = clean.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some((w) => knownKeywords.includes(w) || knownKeywords.some((k) => w.includes(k)))) {
    return false;
  }

  // Check character repetition or lack of vowels
  const hasVowels = /[aeiouy]/.test(clean);
  if (!hasVowels && clean.length > 3) return true;

  // If all words are completely unrecognized and non-dictionary
  return words.length > 0 && !words.some((w) => w.length >= 3 && knownKeywords.some((k) => k.startsWith(w.slice(0, 3))));
}

/**
 * Detects inquiries for out-of-catalog products (e.g. Ryzen 9950X3D, iPhone, etc.)
 */
export function detectOutOfCatalogInquiry(prompt: string, catalog: CatalogProduct[]): {
  isOutOfCatalog: boolean;
  requestedDescription?: string;
  recommendedAlternatives: CatalogProduct[];
  reason: string;
} | null {
  const lower = prompt.toLowerCase();
  const ryzen7800 = catalog.find((p) => p.name.includes("7800X3D"));
  const i9 = catalog.find((p) => p.name.includes("14900K"));

  const isRyzen9000 = /\b(9950x|9950x3d|9900x|ryzen\s*9|7950x|7950x3d)\b/i.test(lower);

  if (isRyzen9000) {
    const alts = [ryzen7800, i9].filter(Boolean) as CatalogProduct[];
    return {
      isOutOfCatalog: true,
      requestedDescription: "AMD Ryzen 9 9950X / 9000-series CPU",
      recommendedAlternatives: alts,
      reason: `We do not currently carry the Ryzen 9 9950X3D in the AURA catalog. Our top available gaming processors are the AURA Ryzen 7 7800X3D 8-Core Processor (₹15,999) and the AURA Core i9-14900K 24-Core CPU (₹18,499).`,
    };
  }

  // Non-catalog devices: iPhone, MacBook, PS5, Xbox
  if (/\b(iphone|macbook|ipad|playstation|ps5|xbox|nintendo)\b/i.test(lower)) {
    return {
      isOutOfCatalog: true,
      requestedDescription: "Consumer smartphone/laptop/console",
      recommendedAlternatives: [],
      reason: `We specialize exclusively in high-performance custom PC hardware, desktop peripherals, and audiophile gear. We do not carry smartphones, laptops, or gaming consoles.`,
    };
  }

  return null;
}

/**
 * Extracts category from query string.
 */
function extractCategoryFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [category, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const syn of synonyms) {
      // Use regex word boundary
      const regex = new RegExp(`\\b${syn}\\b`, "i");
      if (regex.test(lower)) {
        return category;
      }
    }
  }
  return null;
}

/**
 * Extracts quantity from text (e.g. "2 of them", "3 keyboards", "qty 2").
 */
function extractQuantityFromText(text: string): number {
  const match = text.match(/\b(\d+)\s*(x|qty|pieces|units|items)?\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 50) return val;
  }
  return 1;
}

/**
 * Core Deterministic Conversational Entity & Reference Resolution Pipeline.
 */
export function resolveConversationalReferences(
  prompt: string,
  catalog: CatalogProduct[],
  context: ConversationalProductContext,
  cartItems: CartItemContext[] = []
): ResolutionResult {
  const lower = prompt.toLowerCase().trim();
  const catalogMap = new Map<string, CatalogProduct>(catalog.map((p) => [p.id, p]));
  const currentTurn = context.turnHistory.length + 1;
  const quantity = extractQuantityFromText(lower);

  // Initialize working context copy
  const updatedContext: ConversationalProductContext = {
    lastProductSet: [...context.lastProductSet],
    lastRecommendedProductIds: [...context.lastRecommendedProductIds],
    lastSelectedProductId: context.lastSelectedProductId,
    lastMentionedProductIds: [...context.lastMentionedProductIds],
    lastComparedProductIds: [...context.lastComparedProductIds],
    productRegistry: { ...context.productRegistry },
    turnHistory: [...context.turnHistory],
  };

  // Helper to resolve product IDs to CatalogProduct objects
  const getProductsByIds = (ids: string[]): CatalogProduct[] => {
    return ids.map((id) => catalogMap.get(id)).filter(Boolean) as CatalogProduct[];
  };

  // ─── INTENT IDENTIFICATION ───────────────────────────────────────────────
  const isRemoveIntent = /\b(remove|delete|take out|clear|drop)\b/i.test(lower);
  const isAddIntent = /\b(add|put|buy|order|purchase|checkout|take|get|include|bag|cart|give|want|need|select|have|choose)\b/i.test(lower) && !isRemoveIntent;
  const isCompareIntent = /\b(compare|versus|vs|difference|differences|which is better|comparison)\b/i.test(lower);
  const isSuperlativeQuery = /\b(cheaper|cheapest|lowest price|budget|expensive|priciest|highest price|best rated|highest rated|top rated)\b/i.test(lower);

  // ─── 1. EXPLICIT PRODUCT NAME MATCHING ───────────────────────────────────
  const explicitMatches = findExplicitProductsInText(prompt, catalog);

  // ─── 2. REFERENCE PATTERN MATCHING ───────────────────────────────────────
  
  // Plural group pronouns: "them", "those", "both", "all of those", "all of them", "all of these", "both items"
  const isPluralGroupRef = /\b(them|those|both|all of those|all of them|all of these|these|all items|all|everything|separate items)\b/i.test(lower);

  // Singular pronouns: "it", "that", "this", "the recommended one", "that one", "this one", "the one you recommended"
  const isSingularRef = /\b(it|that|this|that one|this one|the one you recommended|the recommended one|the one)\b/i.test(lower) && !isPluralGroupRef;

  // Ordinal position references: "first", "second", "third", "1st", "2nd", "3rd", "last"
  let ordinalIndex: number | null = null;
  if (/\b(first|1st|the first one|first one)\b/i.test(lower)) ordinalIndex = 0;
  else if (/\b(second|2nd|the second one|second one)\b/i.test(lower)) ordinalIndex = 1;
  else if (/\b(third|3rd|the third one|third one)\b/i.test(lower)) ordinalIndex = 2;
  else if (/\b(fourth|4th|the fourth one|fourth one)\b/i.test(lower)) ordinalIndex = 3;
  else if (/\b(last|the last one|last one)\b/i.test(lower)) {
    ordinalIndex = updatedContext.lastProductSet.length > 0 ? updatedContext.lastProductSet.length - 1 : 0;
  }

  // Category-specific reference in prompt (e.g. "the GPU", "the CPU", "the monitor", "the keyboard")
  const referencedCategory = extractCategoryFromText(prompt);

  // Candidate pool from previous context
  const previousSetProducts = getProductsByIds(updatedContext.lastProductSet);
  const previousRecommendedProducts = getProductsByIds(updatedContext.lastRecommendedProductIds);
  const candidatePool = previousSetProducts.length > 0 ? previousSetProducts : previousRecommendedProducts;

  // ─── RESOLUTION DISPATCHER ───────────────────────────────────────────────

  // Case 0: Gibberish or Meaningless Input
  if (isGibberishText(prompt)) {
    return {
      intent: "INFO",
      resolvedProducts: [],
      quantities: {},
      confidence: "LOW",
      referenceType: "NONE",
      reason: "I didn't recognize any specific hardware or gear in that message. Please let me know what components or electronics setup you're searching for (e.g., 'RTX 4080 Super build', '4K creator display', 'magnetic gaming keyboard').",
      updatedContext,
    };
  }

  // Case 0.5: Explicit Out-of-Catalog Product Inquiries (e.g. 50-series, RTX 5090, Ryzen 9950X3D, iPhone)
  const outOfCatalog = detectOutOfCatalogInquiry(prompt, catalog);
  if (outOfCatalog && outOfCatalog.isOutOfCatalog) {
    if (outOfCatalog.recommendedAlternatives.length > 0) {
      updatedContext.lastProductSet = outOfCatalog.recommendedAlternatives.map((p) => p.id);
      updatedContext.lastRecommendedProductIds = outOfCatalog.recommendedAlternatives.map((p) => p.id);
    }
    const quantities: Record<string, number> = {};
    outOfCatalog.recommendedAlternatives.forEach((p) => { quantities[p.id] = 1; });

    return {
      intent: outOfCatalog.recommendedAlternatives.length > 0 ? "RECOMMEND" : "INFO",
      resolvedProducts: outOfCatalog.recommendedAlternatives,
      quantities,
      confidence: "HIGH",
      referenceType: "NONE",
      reason: outOfCatalog.reason,
      updatedContext,
    };
  }

  // Case A: Cart Removal Request (e.g. "remove the GPU", "remove it", "remove the RTX 4080")
  if (isRemoveIntent) {
    let toRemove: CatalogProduct[] = [];

    if (explicitMatches.length > 0) {
      toRemove = explicitMatches;
    } else if (referencedCategory) {
      const inCartCat = cartItems.filter((c) => {
        const prod = catalogMap.get(c.productId);
        return prod && prod.category.toLowerCase() === referencedCategory.toLowerCase();
      });
      toRemove = inCartCat.map((c) => catalogMap.get(c.productId)!).filter(Boolean);
    } else if (isSingularRef || isPluralGroupRef) {
      if (cartItems.length > 0) {
        const lastCartItem = catalogMap.get(cartItems[cartItems.length - 1].productId);
        if (lastCartItem) toRemove = [lastCartItem];
      }
    }

    if (toRemove.length > 0) {
      const quantities: Record<string, number> = {};
      toRemove.forEach((p) => { quantities[p.id] = 1; });

      return {
        intent: "REMOVE_FROM_CART",
        resolvedProducts: toRemove,
        quantities,
        confidence: "HIGH",
        referenceType: "CART_REFERENCE",
        reason: `Identified ${toRemove.map((p) => `"${p.name}"`).join(", ")} for removal from your cart.`,
        updatedContext,
      };
    }
  }

  // Case B: Plural Group References (e.g. "add them", "add those", "add both", "add all of those", "add them to my cart as separate items")
  if (isPluralGroupRef && candidatePool.length > 0) {
    const resolved = candidatePool;
    const quantities: Record<string, number> = {};
    resolved.forEach((p) => { quantities[p.id] = quantity; });

    // Register all resolved products in product registry
    resolved.forEach((p) => {
      updatedContext.productRegistry[p.id] = {
        productId: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        turnIndex: currentTurn,
        role: "user",
        contextRole: "selected",
      };
    });
    updatedContext.lastProductSet = resolved.map((p) => p.id);

    return {
      intent: isAddIntent ? "ADD_TO_CART" : "RECOMMEND",
      resolvedProducts: resolved,
      quantities,
      confidence: "HIGH",
      referenceType: "PRONOUN_PLURAL",
      referenceText: prompt,
      reason: `Resolved reference to the previously identified ${resolved.length} products: ${resolved.map((p) => `"${p.name}"`).join(", ")}.`,
      updatedContext,
    };
  }

  // Case C: Ordinal Position References (e.g. "the first one", "I'll take the second one", "add 1st")
  if (ordinalIndex !== null && candidatePool.length > ordinalIndex) {
    const selected = candidatePool[ordinalIndex];
    const quantities: Record<string, number> = { [selected.id]: quantity };

    updatedContext.lastSelectedProductId = selected.id;
    updatedContext.productRegistry[selected.id] = {
      productId: selected.id,
      name: selected.name,
      category: selected.category,
      price: selected.price,
      turnIndex: currentTurn,
      role: "user",
      contextRole: "selected",
    };

    return {
      intent: isAddIntent ? "ADD_TO_CART" : "VIEW_PRODUCT",
      resolvedProducts: [selected],
      quantities,
      confidence: "HIGH",
      referenceType: "ORDINAL",
      referenceText: `item #${ordinalIndex + 1}`,
      reason: `Resolved item #${ordinalIndex + 1} from your previous list: "${selected.name}" (${selected.category}, ₹${(selected.price / 100).toLocaleString("en-IN")}).`,
      updatedContext,
    };
  }

  // Case D: Superlative Selection (e.g. "which is the cheapest?", "add the cheaper one", "add the highest rated")
  if (isSuperlativeQuery && candidatePool.length > 0) {
    const isCheaper = /\b(cheaper|cheapest|lowest price|budget)\b/i.test(lower);
    const isExpensive = /\b(expensive|priciest|highest price)\b/i.test(lower);

    let sorted = [...candidatePool];
    if (isCheaper) {
      sorted.sort((a, b) => a.price - b.price);
    } else if (isExpensive) {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const selected = sorted[0];
    const quantities: Record<string, number> = { [selected.id]: quantity };
    updatedContext.lastSelectedProductId = selected.id;

    return {
      intent: isAddIntent ? "ADD_TO_CART" : "INFO",
      resolvedProducts: [selected],
      quantities,
      confidence: "HIGH",
      referenceType: "SUPERLATIVE",
      referenceText: isCheaper ? "cheapest option" : "highest tier option",
      reason: isCheaper
        ? `The most affordable option among the items discussed is "${selected.name}" at ₹${(selected.price / 100).toLocaleString("en-IN")}.`
        : `The highest specification option is "${selected.name}" at ₹${(selected.price / 100).toLocaleString("en-IN")}.`,
      updatedContext,
    };
  }

  // Case E: Category Reference (e.g. "add the GPU", "add the processor", "what about the keyboard?")
  if (referencedCategory && explicitMatches.length === 0) {
    // Look for matching category in candidate pool first
    const categoryMatchesInPool = candidatePool.filter(
      (p) => p.category.toLowerCase() === referencedCategory.toLowerCase()
    );

    if (categoryMatchesInPool.length === 1) {
      const selected = categoryMatchesInPool[0];
      const quantities: Record<string, number> = { [selected.id]: quantity };
      updatedContext.lastSelectedProductId = selected.id;

      return {
        intent: isAddIntent ? "ADD_TO_CART" : "RECOMMEND",
        resolvedProducts: [selected],
        quantities,
        confidence: "HIGH",
        referenceType: "CATEGORY",
        referenceText: referencedCategory,
        reason: `Resolved the ${referencedCategory} from your previous discussion: "${selected.name}".`,
        updatedContext,
      };
    } else if (categoryMatchesInPool.length > 1) {
      // Ambiguity: Multiple products in this category exist in candidate pool
      const options = categoryMatchesInPool.map((p) => `"${p.name}" (₹${(p.price / 100).toLocaleString("en-IN")})`).join(" or ");
      return {
        intent: "CLARIFY",
        resolvedProducts: categoryMatchesInPool,
        quantities: {},
        confidence: "AMBIGUOUS",
        referenceType: "CATEGORY",
        clarificationPrompt: `Which ${referencedCategory} would you like me to select — ${options}?`,
        reason: `Multiple ${referencedCategory} options were previously discussed. Please clarify which model you prefer.`,
        updatedContext,
      };
    }

    // Look in full catalog for that category if not in pool
    const catalogCategoryMatches = catalog.filter(
      (p) => p.category.toLowerCase() === referencedCategory.toLowerCase()
    );

    if (catalogCategoryMatches.length > 0) {
      const selectedList = catalogCategoryMatches.slice(0, 3);
      updatedContext.lastProductSet = selectedList.map((p) => p.id);
      updatedContext.lastRecommendedProductIds = selectedList.map((p) => p.id);

      return {
        intent: "RECOMMEND",
        resolvedProducts: selectedList,
        quantities: { [selectedList[0].id]: quantity },
        confidence: "HIGH",
        referenceType: "CATEGORY",
        reason: `Found top ${referencedCategory} options in the AURA catalog: ${selectedList.map((p) => `"${p.name}"`).join(", ")}.`,
        updatedContext,
      };
    }
  }

  // Case F: Singular Pronoun Reference (e.g. "add it", "add that", "add the one you recommended")
  if (isSingularRef) {
    let selected: CatalogProduct | undefined;

    if (updatedContext.lastSelectedProductId && catalogMap.has(updatedContext.lastSelectedProductId)) {
      selected = catalogMap.get(updatedContext.lastSelectedProductId);
    } else if (candidatePool.length === 1) {
      selected = candidatePool[0];
    } else if (candidatePool.length > 1) {
      selected = candidatePool[0]; // Most recent primary
    }

    if (selected) {
      const quantities: Record<string, number> = { [selected.id]: quantity };
      updatedContext.lastSelectedProductId = selected.id;

      return {
        intent: isAddIntent ? "ADD_TO_CART" : "VIEW_PRODUCT",
        resolvedProducts: [selected],
        quantities,
        confidence: "HIGH",
        referenceType: "PRONOUN_SINGULAR",
        referenceText: prompt,
        reason: `Resolved reference to the recommended item "${selected.name}".`,
        updatedContext,
      };
    }
  }

  // Case G: Explicit Name Matches (e.g. "RTX 4080 Super and Ryzen 7800X3D", "add 4080 super")
  if (explicitMatches.length > 0) {
    const quantities: Record<string, number> = {};
    explicitMatches.forEach((p) => {
      quantities[p.id] = quantity;
      updatedContext.productRegistry[p.id] = {
        productId: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        turnIndex: currentTurn,
        role: "assistant",
        contextRole: "recommended",
      };
    });

    updatedContext.lastProductSet = explicitMatches.map((p) => p.id);
    updatedContext.lastRecommendedProductIds = explicitMatches.map((p) => p.id);
    if (explicitMatches.length === 1) {
      updatedContext.lastSelectedProductId = explicitMatches[0].id;
    }

    return {
      intent: isAddIntent ? "ADD_TO_CART" : "RECOMMEND",
      resolvedProducts: explicitMatches,
      quantities,
      confidence: "HIGH",
      referenceType: "EXPLICIT_NAME",
      reason: `Found matching catalog products: ${explicitMatches.map((p) => `"${p.name}" (₹${(p.price / 100).toLocaleString("en-IN")})`).join(", ")}.`,
      updatedContext,
    };
  }

  // Case H: General Inquiry / Curated Setup / Catalog Discovery Fallback
  const isFullSetupQuery = /\b(setup|build|desk equipment|pc setup|gaming pc|desk setup|workstation|complete build|configure)\b/i.test(lower);
  if (isFullSetupQuery) {
    const gpu = catalog.find((p) => p.name.includes("4080"));
    const cpu = catalog.find((p) => p.name.includes("7800X3D"));
    const monitor = catalog.find((p) => p.name.includes("Horizon 27") || p.name.includes("Vision Ultra"));
    const keyboard = catalog.find((p) => p.name.includes("Apex 75") || p.name.includes("Tactile"));
    const setupProducts = [gpu, cpu, monitor, keyboard].filter(Boolean) as CatalogProduct[];

    if (setupProducts.length > 0) {
      updatedContext.lastProductSet = setupProducts.map((p) => p.id);
      updatedContext.lastRecommendedProductIds = setupProducts.map((p) => p.id);

      const quantities: Record<string, number> = {};
      setupProducts.forEach((p) => { quantities[p.id] = 1; });

      return {
        intent: "RECOMMEND",
        resolvedProducts: setupProducts,
        quantities,
        confidence: "HIGH",
        referenceType: "NONE",
        reason: `Here is a curated high-performance PC and desk equipment setup from the AURA catalog, featuring our flagship GPU, gaming processor, high-refresh display, and rapid-trigger keyboard:`,
        updatedContext,
      };
    }
  }

  // Greetings handling
  if (/\b(hi|hello|hey|greetings|morning|afternoon|evening)\b/i.test(lower)) {
    return {
      intent: "INFO",
      resolvedProducts: [],
      quantities: {},
      confidence: "HIGH",
      referenceType: "NONE",
      reason: `Hello! I'm your AURA Autonomous Shopping Copilot. Tell me what gear or PC hardware you're searching for, and I'll match components, remember your preferences, and resolve multi-item follow-ups.`,
      updatedContext,
    };
  }

  const generalMatches = catalog.slice(0, 2);
  updatedContext.lastProductSet = generalMatches.map((p) => p.id);
  updatedContext.lastRecommendedProductIds = generalMatches.map((p) => p.id);

  return {
    intent: "RECOMMEND",
    resolvedProducts: generalMatches,
    quantities: { [generalMatches[0].id]: quantity },
    confidence: "MEDIUM",
    referenceType: "NONE",
    reason: `Here are popular featured recommendations from the AURA catalog:`,
    updatedContext,
  };
}
