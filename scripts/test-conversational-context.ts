/**
 * Conversational Context & Entity Resolution Test Suite
 *
 * Verifies all multi-turn conversational reference resolution requirements:
 * Pronouns (them/those/both/it), Ordinals (first/second), Superlatives (cheaper/expensive),
 * Categories (GPU/CPU/Monitor), Ambiguity Handling, and Multi-Item Cart Actions.
 */

import {
  CatalogProduct,
  ConversationalProductContext,
  createInitialContext,
  resolveConversationalReferences,
} from "../src/lib/conversational-entity-resolver";

const MOCK_CATALOG: CatalogProduct[] = [
  {
    id: "gpu-5090",
    name: "AURA GeForce RTX 5090 32GB OC Flagship GPU",
    description: "Next-Gen Blackwell 32GB GDDR7 Flagship",
    price: 8999900,
    category: "GPUs",
    rating: 5.0,
  },
  {
    id: "gpu-5080",
    name: "AURA GeForce RTX 5080 16GB OC Edition GPU",
    description: "Blackwell 16GB GDDR7 High-End Gaming GPU",
    price: 5499900,
    category: "GPUs",
    rating: 4.95,
  },
  {
    id: "gpu-5070ti",
    name: "AURA GeForce RTX 5070 Ti 16GB OC Gaming GPU",
    description: "Blackwell 16GB GDDR7 Ultra-Efficient GPU",
    price: 3799900,
    category: "GPUs",
    rating: 4.85,
  },
  {
    id: "gpu-4080",
    name: "AURA GeForce RTX 4080 Super 16GB OC Edition",
    description: "4K DLSS 3.5 Gaming Flagship",
    price: 4499900,
    category: "GPUs",
    rating: 4.9,
  },
  {
    id: "gpu-7800xt",
    name: "AURA Radeon RX 7800 XT 16GB OC",
    description: "1440p / 4K Gaming Graphics Card",
    price: 2199900,
    category: "GPUs",
    rating: 4.8,
  },
  {
    id: "cpu-7800x3d",
    name: "AURA Ryzen 7 7800X3D 8-Core Gaming Processor",
    description: "3D V-Cache High Performance CPU",
    price: 1599900,
    category: "CPUs",
    rating: 4.95,
  },
  {
    id: "cpu-14900k",
    name: "AURA Core i9-14900K 24-Core CPU",
    description: "Flagship 6.0 GHz Workstation Processor",
    price: 1849900,
    category: "CPUs",
    rating: 4.85,
  },
  {
    id: "mon-oled34",
    name: "AURA Vision Ultra 34\" Curved QD-OLED 240Hz",
    description: "Ultra-Wide 0.03ms QD-OLED Monitor",
    price: 3899900,
    category: "Monitors",
    rating: 4.9,
  },
  {
    id: "mon-4k27",
    name: "AURA Horizon 27\" 4K Creator Monitor",
    description: "99% DCI-P3 Color Calibrated",
    price: 2499900,
    category: "Monitors",
    rating: 4.85,
  },
  {
    id: "kb-apex75",
    name: "AURA Apex 75% Magnetic Hall Effect Keyboard",
    description: "Rapid Trigger 0.1mm Actuation Keyboard",
    price: 799900,
    category: "Keyboards",
    rating: 4.9,
  },
  {
    id: "mouse-carbon38",
    name: "AURA Carbon 38g 8K Wireless Mouse",
    description: "Carbon Fiber Superlight Gaming Mouse",
    price: 389900,
    category: "Mice",
    rating: 4.9,
  },
];

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log("\n=======================================================");
console.log("🧠 Conversational Context & Entity Resolution Test Suite");
console.log("=======================================================\n");

// ─── TEST 1: The Original Reported Bug (RTX 4080 Super + Ryzen 7800X3D Build) ─────
{
  const ctx = createInitialContext();

  // Turn 1: User asks for a build with RTX 4080 Super and Ryzen 7800X3D
  const turn1 = resolveConversationalReferences(
    "Configure a complete 4K gaming build with RTX 4080 Super and Ryzen 7800X3D",
    MOCK_CATALOG,
    ctx
  );

  assert(
    turn1.resolvedProducts.length === 2 &&
      turn1.resolvedProducts.some((p) => p.id === "gpu-4080") &&
      turn1.resolvedProducts.some((p) => p.id === "cpu-7800x3d"),
    "Turn 1: Discovers both RTX 4080 Super and Ryzen 7800X3D",
    `Found: ${turn1.resolvedProducts.map((p) => p.name).join(", ")}`
  );

  // Turn 2: User says "add them to my cart as separate items"
  const turn2 = resolveConversationalReferences(
    "add them to my cart as separate items",
    MOCK_CATALOG,
    turn1.updatedContext
  );

  assert(
    turn2.intent === "ADD_TO_CART",
    "Turn 2: Intent correctly identified as ADD_TO_CART"
  );
  assert(
    turn2.resolvedProducts.length === 2,
    "Turn 2: Resolves 'them' to both 2 products from Turn 1",
    `Resolved count: ${turn2.resolvedProducts.length}`
  );
  assert(
    turn2.resolvedProducts.some((p) => p.id === "gpu-4080") &&
      turn2.resolvedProducts.some((p) => p.id === "cpu-7800x3d"),
    "Turn 2: Resolves both canonical IDs: gpu-4080 and cpu-7800x3d",
    `Product IDs: ${turn2.resolvedProducts.map((p) => p.id).join(", ")}`
  );
  assert(
    turn2.confidence === "HIGH",
    "Turn 2: High confidence resolution without ambiguity"
  );
}

// ─── TEST 2: Plural Reference Variations ("add those", "add both", "add all of those") ─
{
  const ctx = createInitialContext();
  ctx.lastProductSet = ["gpu-4080", "mon-oled34"];

  const resThose = resolveConversationalReferences("add those", MOCK_CATALOG, ctx);
  assert(
    resThose.intent === "ADD_TO_CART" && resThose.resolvedProducts.length === 2,
    "Pronoun 'add those' resolves to both products"
  );

  const resBoth = resolveConversationalReferences("put both of them in my cart", MOCK_CATALOG, ctx);
  assert(
    resBoth.intent === "ADD_TO_CART" && resBoth.resolvedProducts.length === 2,
    "Pronoun 'both of them' resolves to both products"
  );

  const resAll = resolveConversationalReferences("add all of those", MOCK_CATALOG, ctx);
  assert(
    resAll.intent === "ADD_TO_CART" && resAll.resolvedProducts.length === 2,
    "Phrase 'add all of those' resolves to all items"
  );
}

// ─── TEST 3: Singular Pronoun ("add it", "add that") ──────────────────────────────
{
  const ctx = createInitialContext();
  ctx.lastProductSet = ["kb-apex75"];
  ctx.lastSelectedProductId = "kb-apex75";

  const resIt = resolveConversationalReferences("add it to my cart", MOCK_CATALOG, ctx);
  assert(
    resIt.intent === "ADD_TO_CART" &&
      resIt.resolvedProducts.length === 1 &&
      resIt.resolvedProducts[0].id === "kb-apex75",
    "Pronoun 'add it' resolves to the singular active product"
  );

  const resThat = resolveConversationalReferences("buy that one", MOCK_CATALOG, ctx);
  assert(
    resThat.intent === "ADD_TO_CART" &&
      resThat.resolvedProducts.length === 1 &&
      resThat.resolvedProducts[0].id === "kb-apex75",
    "Phrase 'buy that one' resolves to active product"
  );
}

// ─── TEST 4: Ordinal Selection ("the first one", "the second one", "last one") ────
{
  const ctx = createInitialContext();
  ctx.lastProductSet = ["gpu-4080", "gpu-7800xt", "mon-4k27"];

  const res1st = resolveConversationalReferences("I'll take the first one", MOCK_CATALOG, ctx);
  assert(
    res1st.intent === "ADD_TO_CART" &&
      res1st.resolvedProducts[0].id === "gpu-4080",
    "Ordinal 'first one' resolves to 1st item (gpu-4080)"
  );

  const res2nd = resolveConversationalReferences("add the second one", MOCK_CATALOG, ctx);
  assert(
    res2nd.intent === "ADD_TO_CART" &&
      res2nd.resolvedProducts[0].id === "gpu-7800xt",
    "Ordinal 'second one' resolves to 2nd item (gpu-7800xt)"
  );

  const resLast = resolveConversationalReferences("give me the last one", MOCK_CATALOG, ctx);
  assert(
    resLast.intent === "ADD_TO_CART" &&
      resLast.resolvedProducts[0].id === "mon-4k27",
    "Ordinal 'last one' resolves to 3rd item (mon-4k27)"
  );
}

// ─── TEST 5: Superlatives ("add the cheaper one", "cheapest option") ──────────────
{
  const ctx = createInitialContext();
  // 4080 (₹44,999) vs 7800XT (₹21,999)
  ctx.lastProductSet = ["gpu-4080", "gpu-7800xt"];

  const resCheaper = resolveConversationalReferences("add the cheaper one", MOCK_CATALOG, ctx);
  assert(
    resCheaper.intent === "ADD_TO_CART" &&
      resCheaper.resolvedProducts[0].id === "gpu-7800xt",
    "Superlative 'cheaper one' selects the lowest priced candidate (gpu-7800xt at ₹21,999)"
  );

  const resExpensive = resolveConversationalReferences("which is the most expensive?", MOCK_CATALOG, ctx);
  assert(
    resExpensive.resolvedProducts[0].id === "gpu-4080",
    "Superlative 'most expensive' selects top priced candidate (gpu-4080 at ₹44,999)"
  );
}

// ─── TEST 6: Category Disambiguation & Resolution ("add the GPU", "add the CPU") ───
{
  const ctx = createInitialContext();
  ctx.lastProductSet = ["gpu-4080", "cpu-7800x3d", "mon-oled34"];

  const resGPU = resolveConversationalReferences("add the GPU", MOCK_CATALOG, ctx);
  assert(
    resGPU.intent === "ADD_TO_CART" &&
      resGPU.resolvedProducts[0].id === "gpu-4080",
    "Category reference 'the GPU' resolves specifically to gpu-4080"
  );

  const resCPU = resolveConversationalReferences("add the processor", MOCK_CATALOG, ctx);
  assert(
    resCPU.intent === "ADD_TO_CART" &&
      resCPU.resolvedProducts[0].id === "cpu-7800x3d",
    "Category reference 'the processor' resolves specifically to cpu-7800x3d"
  );
}

// ─── TEST 7: Ambiguity Handling Requiring Clarification ─────────────────────────────
{
  const ctx = createInitialContext();
  // Two GPUs in previous context
  ctx.lastProductSet = ["gpu-4080", "gpu-7800xt"];

  const resAmbiguous = resolveConversationalReferences("add the graphics card", MOCK_CATALOG, ctx);
  assert(
    resAmbiguous.intent === "CLARIFY" &&
      resAmbiguous.confidence === "AMBIGUOUS" &&
      typeof resAmbiguous.clarificationPrompt === "string" &&
      resAmbiguous.clarificationPrompt.length > 0,
    "Ambiguous reference to 'graphics card' when 2 exist prompts for clarification",
    `Clarification: ${resAmbiguous.clarificationPrompt}`
  );
}

// ─── TEST 8: Cart-Aware Removal Actions ("remove the GPU", "remove it") ───────────
{
  const ctx = createInitialContext();
  const cart = [
    { productId: "gpu-4080", name: "AURA GeForce RTX 4080 Super", category: "GPUs", price: 4499900, quantity: 1 },
    { productId: "mouse-carbon38", name: "AURA Carbon 38g", category: "Mice", price: 389900, quantity: 1 },
  ];

  const resRemove = resolveConversationalReferences("remove the GPU", MOCK_CATALOG, ctx, cart);
  assert(
    resRemove.intent === "REMOVE_FROM_CART" &&
      resRemove.resolvedProducts[0].id === "gpu-4080",
    "Cart removal 'remove the GPU' correctly resolves to gpu-4080 from cart state"
  );

  const resRemoveIt = resolveConversationalReferences("remove it from my cart", MOCK_CATALOG, ctx, cart);
  assert(
    resRemoveIt.intent === "REMOVE_FROM_CART" &&
      resRemoveIt.resolvedProducts.length > 0,
    "Cart removal 'remove it' identifies cart item"
  );
}

// ─── TEST 9: Multi-Turn Conversation History State Persistence ────────────────────
{
  let ctx = createInitialContext();

  // Turn 1: User asks for monitors
  const t1 = resolveConversationalReferences("Show me OLED and 4K creator monitors", MOCK_CATALOG, ctx);
  ctx = t1.updatedContext;
  assert(ctx.lastProductSet.length >= 2, "Turn 1: Context stores monitors");

  // Turn 2: User asks which is cheaper
  const t2 = resolveConversationalReferences("Which is the cheaper one?", MOCK_CATALOG, ctx);
  ctx = t2.updatedContext;
  assert(t2.resolvedProducts[0].id === "mon-4k27", "Turn 2: Identifies 4K creator monitor as cheaper");

  // Turn 3: User says "add it"
  const t3 = resolveConversationalReferences("Add it to my cart", MOCK_CATALOG, ctx);
  assert(
    t3.intent === "ADD_TO_CART" && t3.resolvedProducts[0].id === "mon-4k27",
    "Turn 3: 'Add it' adds the previously identified cheaper monitor"
  );
}

// ─── TEST 10: Gibberish & Meaningless Input Rejection ─────────────────────────────
{
  const ctx = createInitialContext();
  const res = resolveConversationalReferences("5esdif udgd wi", MOCK_CATALOG, ctx);
  assert(
    res.intent === "INFO" && res.resolvedProducts.length === 0,
    "Test 10: Gibberish text returns INFO with 0 products without dumping catalog items"
  );
  assert(
    res.reason.includes("couldn't understand") || res.reason.includes("didn't recognize"),
    "Test 10: Gibberish returns helpful clarification prompt"
  );
}

// ─── TEST 11: In-Catalog 50-Series GPU Inquiries ───────────────────────────────
{
  const ctx = createInitialContext();
  const res = resolveConversationalReferences("are there any 50 series gpus?", MOCK_CATALOG, ctx);
  assert(
    res.resolvedProducts.some((p) => p.id === "gpu-5090") && res.resolvedProducts.some((p) => p.id === "gpu-5080"),
    "Test 11: 50-series query directly matches newly cataloged RTX 5090, 5080, and 5070 Ti GPUs"
  );
  assert(
    res.intent === "RECOMMEND",
    "Test 11: Intent is RECOMMEND with matched 50-series catalog products"
  );
}

// ─── TEST 12: Build Inquiry with Specific 50-Series Card ───────────────────────────
{
  const ctx = createInitialContext();
  const res = resolveConversationalReferences(
    "Find me a gaming setup with an RTX 5090 and Ryzen 7800X3D",
    MOCK_CATALOG,
    ctx
  );
  assert(
    res.resolvedProducts.some((p) => p.id === "gpu-5090") && res.resolvedProducts.some((p) => p.id === "cpu-7800x3d"),
    "Test 12: Matches both RTX 5090 and Ryzen 7800X3D from catalog"
  );
}

// ─── TEST 13: Curated Complete PC & Desk Setup ────────────────────────────────────
{
  const ctx = createInitialContext();
  const res = resolveConversationalReferences("Help me configure my ideal PC and desk equipment setup", MOCK_CATALOG, ctx);
  assert(
    res.resolvedProducts.length >= 3,
    "Test 13: Curated setup returns a balanced multi-component build (GPU, CPU, Monitor, Keyboard)"
  );
  assert(
    res.reason.toLowerCase().includes("curated") || res.reason.toLowerCase().includes("setup"),
    "Test 13: Explains that recommendations form a curated PC & desk setup"
  );
}

console.log("\n=======================================================");
console.log(`🎉 All ${passedTests}/${totalTests} Conversational Reference Tests Passed!`);
console.log("=======================================================\n");

