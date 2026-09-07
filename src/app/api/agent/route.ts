import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { AgentPromptSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import {
  CatalogProduct,
  ConversationalProductContext,
  createInitialContext,
  resolveConversationalReferences,
  findExplicitProductsInText,
} from "@/lib/conversational-entity-resolver";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = AgentPromptSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, catalog, conversationHistory, contextState, cartItems } = parseResult.data;
    const typedCatalog = catalog as CatalogProduct[];
    const catalogMap = new Map<string, CatalogProduct>(typedCatalog.map((p) => [p.id, p]));

    // Reconstruct or initialize conversational product context
    let activeContext: ConversationalProductContext = createInitialContext();
    if (contextState && typeof contextState === "object") {
      activeContext = {
        lastProductSet: Array.isArray(contextState.lastProductSet) ? (contextState.lastProductSet as string[]) : [],
        lastRecommendedProductIds: Array.isArray(contextState.lastRecommendedProductIds) ? (contextState.lastRecommendedProductIds as string[]) : [],
        lastSelectedProductId: typeof contextState.lastSelectedProductId === "string" ? contextState.lastSelectedProductId : null,
        lastMentionedProductIds: Array.isArray(contextState.lastMentionedProductIds) ? (contextState.lastMentionedProductIds as string[]) : [],
        lastComparedProductIds: Array.isArray(contextState.lastComparedProductIds) ? (contextState.lastComparedProductIds as string[]) : [],
        productRegistry: typeof contextState.productRegistry === "object" && contextState.productRegistry !== null ? (contextState.productRegistry as any) : {},
        turnHistory: Array.isArray(conversationHistory) ? (conversationHistory as any) : [],
      };
    }

    // Run deterministic entity resolution engine first to build baseline understanding
    const deterministicResolution = resolveConversationalReferences(
      prompt,
      typedCatalog,
      activeContext,
      (cartItems as any[]) || []
    );

    logger.info("Deterministic entity resolution evaluated", {
      intent: deterministicResolution.intent,
      referenceType: deterministicResolution.referenceType,
      resolvedCount: deterministicResolution.resolvedProducts.length,
      productIds: deterministicResolution.resolvedProducts.map((p) => p.id),
      confidence: deterministicResolution.confidence,
    });

    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // If Gemini LLM is configured, pass full conversational context into LLM
    if (apiKey && apiKey !== '""' && apiKey !== "''" && apiKey.length > 10) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        
        // Format last referenced items for prompt
        const referencedItemsList = activeContext.lastProductSet
          .map((id) => catalogMap.get(id))
          .filter(Boolean)
          .map((p, idx) => `${idx + 1}. [ID: ${p!.id}] "${p!.name}" (${p!.category}, ₹${(p!.price / 100).toLocaleString("en-IN")})`)
          .join("\n");

        const { object } = await generateObject({
          model: google(modelName),
          schema: z.object({
            intent: z.enum(["ADD_TO_CART", "REMOVE_FROM_CART", "VIEW_PRODUCT", "COMPARE", "CLARIFY", "RECOMMEND", "INFO"]).describe("The classified user purchasing/browsing intent"),
            action: z.enum(["ADD_TO_CART", "REMOVE_FROM_CART", "VIEW_PRODUCT", "COMPARE", "CLARIFY", "RECOMMEND", "INFO"]).describe("The specific state action to perform"),
            product_ids: z.array(z.string()).describe("Array of canonical product IDs matched or referenced (empty array if none)"),
            quantities: z.record(z.string(), z.number().int().min(1)).describe("Map of product_id to quantity (defaults to 1)"),
            confidence: z.enum(["HIGH", "MEDIUM", "LOW", "AMBIGUOUS"]).describe("Confidence of entity resolution"),
            clarificationPrompt: z.string().optional().describe("Question to ask if references are ambiguous"),
            reason: z.string().describe("Clear natural-language explanation addressing the user's request"),
          }),
          prompt: `
            You are an AI purchasing assistant and shopping copilot for the AURA high-performance electronics e-commerce store.
            Your task is to help the user discover, compare, and purchase products. Respond naturally and helpfully.

            When the user asks about products, recommend the best matching items from the catalog.
            When the user uses references like "them", "those", "both", "the GPU", "the first one", "the cheaper one", resolve them against previously discussed products.
            When the user greets you or asks general questions, respond conversationally.

            LATEST USER MESSAGE: "${prompt}"

            RECENT CONVERSATION HISTORY:
            ${JSON.stringify(conversationHistory || [], null, 2)}

            PREVIOUSLY DISCUSSED / RECOMMENDED PRODUCTS IN CONTEXT:
            ${referencedItemsList || "(No products in previous turn)"}

            CURRENT SHOPPING CART:
            ${JSON.stringify(cartItems || [], null, 2)}

            FULL MERCHANT CATALOG:
            ${JSON.stringify(
              typedCatalog.map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price, specs: p.specs })),
              null,
              2
            )}

            RULES:
            1. For product searches/recommendations: set action to "RECOMMEND", include matching product_ids, and write a helpful reason.
            2. For "add them"/"add those"/"add both"/"add the GPU"/etc: set action to "ADD_TO_CART", resolve references to canonical product_ids from the conversation context.
            3. For removals: set action to "REMOVE_FROM_CART" with the resolved product_ids.
            4. For greetings or general conversation: set action to "INFO", leave product_ids empty, and write a friendly conversational response in reason.
            5. For ambiguous references: set action to "CLARIFY", confidence to "AMBIGUOUS", and ask a clarification question.
            6. OUT-OF-CATALOG PRODUCTS: If the user requests items NOT in our catalog (e.g. RTX 5090, 50-series GPUs, Ryzen 9 9950X3D, iPhone, PS5), explicitly inform the user that this specific model is not carried in the AURA catalog, and then clearly recommend the closest in-stock alternative (e.g. AURA GeForce RTX 4080 Super 16GB OC Edition or AURA Ryzen 7 7800X3D) as the next best option.
            7. GIBBERISH / MEANINGLESS INPUT: If the user sends random characters or nonsensical text (e.g. '5esdif udgd wi'), set action to "INFO", leave product_ids empty, and ask them to clarify what components or gear they are looking for.
            8. FACT CORRECTIONS / SPECIFICATIONS: Never confirm specifications for unlisted products. If asked about non-existent items like RTX 5090, clarify that only our listed products (e.g. RTX 4080 Super 16GB at ₹44,999) are available.
            9. Every product_id in product_ids MUST be a valid ID from the merchant catalog.
            10. The reason field must always contain a natural, helpful, truthful response that directly addresses what the user asked.
          `,
        });

        // Validate that LLM resolved products actually exist in catalog
        const validResolvedProducts: CatalogProduct[] = [];
        for (const pid of object.product_ids) {
          const prod = catalogMap.get(pid);
          if (prod && !validResolvedProducts.some((p) => p.id === prod.id)) {
            validResolvedProducts.push(prod);
          }
        }

        // Always use the LLM response when the call succeeds
        {
          const currentTurn = activeContext.turnHistory.length + 1;
          const updatedContext: ConversationalProductContext = {
            ...activeContext,
            lastProductSet: validResolvedProducts.length > 0 ? validResolvedProducts.map((p) => p.id) : activeContext.lastProductSet,
            lastRecommendedProductIds: validResolvedProducts.length > 0 ? validResolvedProducts.map((p) => p.id) : activeContext.lastRecommendedProductIds,
            lastSelectedProductId: validResolvedProducts.length === 1 ? validResolvedProducts[0].id : activeContext.lastSelectedProductId,
          };

          // Register products in history
          validResolvedProducts.forEach((p) => {
            updatedContext.productRegistry[p.id] = {
              productId: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              turnIndex: currentTurn,
              role: object.action === "ADD_TO_CART" ? "user" : "assistant",
              contextRole: object.action === "ADD_TO_CART" ? "selected" : "recommended",
            };
          });

          // Build companion products for upsell
          const companionProducts: CatalogProduct[] = [];
          if (validResolvedProducts.length > 0) {
            const primary = validResolvedProducts[0];
            if (primary.category === "GPUs") {
              const cpu = typedCatalog.find((p) => p.name.includes("7800X3D"));
              const ram = typedCatalog.find((p) => p.name.includes("DDR5"));
              if (cpu && !validResolvedProducts.some((p) => p.id === cpu.id)) companionProducts.push(cpu);
              if (ram && !validResolvedProducts.some((p) => p.id === ram.id)) companionProducts.push(ram);
            } else if (primary.category === "CPUs") {
              const ram = typedCatalog.find((p) => p.name.includes("DDR5"));
              const ssd = typedCatalog.find((p) => p.name.includes("SSD"));
              if (ram && !validResolvedProducts.some((p) => p.id === ram.id)) companionProducts.push(ram);
              if (ssd && !validResolvedProducts.some((p) => p.id === ssd.id)) companionProducts.push(ssd);
            } else if (primary.category === "Keyboards") {
              const mouse = typedCatalog.find((p) => p.category === "Mice");
              const mat = typedCatalog.find((p) => p.name.includes("Desk Mat"));
              if (mouse && !validResolvedProducts.some((p) => p.id === mouse.id)) companionProducts.push(mouse);
              if (mat && !validResolvedProducts.some((p) => p.id === mat.id)) companionProducts.push(mat);
            }
          }

          logger.info("Agent parsed intent via Gemini LLM with context resolution", {
            action: object.action,
            resolvedCount: validResolvedProducts.length,
            productIds: validResolvedProducts.map((p) => p.id),
          });

          return NextResponse.json({
            action: object.action,
            intent: object.intent,
            product_id: validResolvedProducts.length > 0 ? validResolvedProducts[0].id : "",
            product_ids: validResolvedProducts.map((p) => p.id),
            items: validResolvedProducts.map((p) => ({
              product_id: p.id,
              quantity: object.quantities[p.id] || 1,
              name: p.name,
              price: p.price,
            })),
            products: validResolvedProducts,
            companionProducts,
            confidence: object.confidence,
            clarificationPrompt: object.clarificationPrompt,
            reason: object.reason,
            updatedContext,
            debug: {
              intent: object.intent,
              resolved_entities: validResolvedProducts.map((p) => ({ name: p.name, productId: p.id, category: p.category })),
              confidence: object.confidence,
              action: object.action,
            },
          });
        }
      } catch (llmError) {
        logger.warn("Gemini LLM call failed or produced empty resolution, engaging deterministic resolution engine", {
          error: String(llmError),
        });
      }
    }

    // ─── DETERMINISTIC FALLBACK RESOLUTION ─────────────────────────────────
    // Build companion products for fallback
    const companionProducts: CatalogProduct[] = [];
    if (deterministicResolution.resolvedProducts.length > 0) {
      const primary = deterministicResolution.resolvedProducts[0];
      if (primary.category === "GPUs") {
        const cpu = typedCatalog.find((p) => p.name.includes("7800X3D"));
        const ram = typedCatalog.find((p) => p.name.includes("DDR5"));
        if (cpu && !deterministicResolution.resolvedProducts.some((p) => p.id === cpu.id)) companionProducts.push(cpu);
        if (ram && !deterministicResolution.resolvedProducts.some((p) => p.id === ram.id)) companionProducts.push(ram);
      } else if (primary.category === "CPUs") {
        const ram = typedCatalog.find((p) => p.name.includes("DDR5"));
        const ssd = typedCatalog.find((p) => p.name.includes("SSD"));
        if (ram && !deterministicResolution.resolvedProducts.some((p) => p.id === ram.id)) companionProducts.push(ram);
        if (ssd && !deterministicResolution.resolvedProducts.some((p) => p.id === ssd.id)) companionProducts.push(ssd);
      } else if (primary.category === "Keyboards") {
        const mouse = typedCatalog.find((p) => p.category === "Mice");
        const mat = typedCatalog.find((p) => p.name.includes("Desk Mat"));
        if (mouse && !deterministicResolution.resolvedProducts.some((p) => p.id === mouse.id)) companionProducts.push(mouse);
        if (mat && !deterministicResolution.resolvedProducts.some((p) => p.id === mat.id)) companionProducts.push(mat);
      }
    }

    return NextResponse.json({
      action: deterministicResolution.intent,
      intent: deterministicResolution.intent,
      product_id: deterministicResolution.resolvedProducts.length > 0 ? deterministicResolution.resolvedProducts[0].id : "",
      product_ids: deterministicResolution.resolvedProducts.map((p) => p.id),
      items: deterministicResolution.resolvedProducts.map((p) => ({
        product_id: p.id,
        quantity: deterministicResolution.quantities[p.id] || 1,
        name: p.name,
        price: p.price,
      })),
      products: deterministicResolution.resolvedProducts,
      companionProducts,
      confidence: deterministicResolution.confidence,
      clarificationPrompt: deterministicResolution.clarificationPrompt,
      reason: deterministicResolution.reason,
      updatedContext: deterministicResolution.updatedContext,
      debug: {
        intent: deterministicResolution.intent,
        referenceType: deterministicResolution.referenceType,
        resolved_entities: deterministicResolution.resolvedProducts.map((p) => ({ name: p.name, productId: p.id, category: p.category })),
        confidence: deterministicResolution.confidence,
        action: deterministicResolution.intent,
      },
    });
  } catch (error) {
    logger.error("Agent processing error", { error: String(error) });
    return NextResponse.json({ error: "Agent failed to process request" }, { status: 500 });
  }
}
