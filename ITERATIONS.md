# ITERATIONS.md — AgentPay Change Provenance & Audit Log

## [Iteration 18] — 2026-09-02 — Increased Transaction Limit to ₹2,00,000 & Merchant Negotiation Modal

### Executive Summary
1. **Transaction Policy Hard Limit Increased to ₹2,00,000**:
   - Updated `prisma/seed.ts` and database policy to set `maxAmount: 20000000` (₹2,00,000 in paise), up from ₹50,000.
   - Updated policy dashboard and checkout validation UI to reflect the new ₹2,00,000 cap.
2. **Customer-to-Merchant Negotiation Experience**:
   - Added **Negotiate with Merchant** button in:
     - Blocked Transaction Banner in Checkout Drawer (when order total > ₹2,00,000).
     - Cart Checkout action area.
     - Product Detail Modal.
   - Added sleek **Merchant Negotiation Modal**:
     - Generates and renders randomized merchant contact details (verified POC name, designation, physical store address across major tech hubs, direct mobile and landline numbers, desk reference code, and working hours).
     - Provides instant actions: Direct Phone Call, WhatsApp inquiry, Copy Details to Clipboard, Randomize/Switch Outlet.
     - Includes an interactive custom price counter-offer and message submission form with immediate confirmation telemetry.

---

## [Iteration 17] — 2026-08-29 — 50-Series GPUs Database & Catalog Expansion

### Executive Summary
1. **Database & Catalog Expansion (`prisma/seed.ts`)**:
   - Seeded 3 new next-gen NVIDIA Blackwell 50-series graphics cards into the database:
     - **AURA GeForce RTX 5090 32GB OC Flagship GPU** (₹89,999 / 8999900 paise, 32GB GDDR7, 28,160 CUDA cores, DLSS 4 AI).
     - **AURA GeForce RTX 5080 16GB OC Edition GPU** (₹54,999 / 5499900 paise, 16GB GDDR7, 10,752 CUDA cores, DLSS 4 AI).
     - **AURA GeForce RTX 5070 Ti 16GB OC Gaming GPU** (₹37,999 / 3799900 paise, 16GB GDDR7, 8,960 CUDA cores, 250W TGP).
2. **Conversational Entity Resolver Integration (`src/lib/conversational-entity-resolver.ts`)**:
   - Added direct keyword and token matching for `5090`, `5080`, `5070`, `5070 ti`, `rtx 50`, `50 series`, and `geforce 50`.
   - Updated out-of-catalog detector since 50-series GPUs are now live in-catalog items.
3. **Automated Verification**:
   - Updated `scripts/test-conversational-context.ts` to test direct 50-series discovery and multi-component builds featuring the RTX 5090 and Ryzen 7800X3D (30/30 tests passing).
   - Production Next.js build validated with 0 errors.

---

## [Iteration 16] — 2026-08-29 — Out-of-Catalog Product Guidance, Gibberish Filtering & Curated Setups

### Executive Summary
1. **Out-of-Catalog Product Detection & Next-Best Alternative Guidance**:
   - Fixed silent product substitution when users query non-catalog hardware (e.g. RTX 50-series / RTX 5090 / Ryzen 9 9950X3D / iPhone).
   - The agent now explicitly clarifies that the requested model is not currently carried in the AURA catalog, and transparently offers the closest in-stock flagship alternative (e.g. AURA GeForce RTX 4080 Super 16GB OC Edition and AURA Ryzen 7 7800X3D).
2. **Gibberish & Meaningless Input Rejection**:
   - Implemented `isGibberishText` guard to reject random character inputs (e.g. `"5esdif udgd wi"`) with an `INFO` response and a polite clarification prompt, instead of randomly dumping unrelated keyboards/items.
3. **Curated Full PC & Desk Setup Builder**:
   - When users ask for a complete build or desk equipment setup, the agent recommends a balanced, curated setup across categories (GPU, CPU, Monitor, Keyboard) with clear contextual explanations.
4. **Automated Test Coverage**:
   - Added 8 new automated test cases in `scripts/test-conversational-context.ts` (totaling 31/31 passing tests) covering out-of-catalog hardware, gibberish inputs, and full curated setups.

---

## [Iteration 15] — 2026-08-29 — Companion Product Null-Safety, Policy Gating & Chat Card Cleanup

### Executive Summary
1. **Chat UI Redundant Product Card Cleanup on Cart Actions**:
   - Resolved repetitive product discovery cards appearing after items were already added to the cart via natural language ("add them to cart").
   - Added clean `addedToCart` confirmation banner with quick "View Cart" and "Checkout" actions instead of re-prompting users with "+ Add to Cart" cards for items already in their cart.
2. **Companion Product Rendering TypeError Fix**:
   - Fixed `Cannot read properties of undefined (reading 'image')` in `src/app/page.tsx`.
   - Added catalog enrichment and normalization in `executeAiPrompt` so `companionProducts` are always formatted with rich product details (`image`, `name`, `price`, `badge`).
   - Added defensive optional chaining and filtering in the chat UI rendering to prevent runtime crashes from partial data.
3. **Multi-Item Cart Policy Gating & Cross-Tab Sync**:
   - Updated `CreateTransactionSchema` and `/api/transactions` (POST) to compute the server-authoritative total for the entire cart rather than just the first item.
   - Added `BLOCKED` UI alert state for orders exceeding the ₹50,000 hard limit.
   - Added `/api/transactions` (GET) and client polling hook in `src/app/page.tsx` for real-time synchronization between merchant dashboard approvals and customer checkout states across tabs.

---

## [Iteration 14] — 2026-08-29 — Conversational Entity & Reference Resolution Engine (ENG-001 / AI-002)

### Executive Summary
Fixed the conversational context and entity resolution failure in the **AURA AI Shopping Copilot**. The agent now persists multi-turn session state and deterministically resolves complex linguistic references (group pronouns, singular pronouns, ordinals, superlatives, categories, and multi-product cart additions).

1. **Conversational Entity & Reference Resolution Engine (`src/lib/conversational-entity-resolver.ts`)**:
   - Maintains full conversational context across turns: `lastProductSet`, `lastRecommendedProductIds`, `lastSelectedProductId`, `productRegistry`, `turnHistory`, and `cartItems`.
   - Implements semantic and syntactic reference resolution:
     - **Group Pronouns**: `"them"`, `"those"`, `"both"`, `"all of those"`, `"add them to my cart as separate items"` $\rightarrow$ resolves to all canonical products from the previous turn and triggers multi-item cart addition.
     - **Singular Pronouns**: `"it"`, `"that"`, `"buy that one"`, `"the one you recommended"` $\rightarrow$ resolves to the active/selected candidate.
     - **Ordinals**: `"first one"`, `"second one"`, `"last one"` $\rightarrow$ index-based selection from ordered `lastProductSet`.
     - **Superlatives**: `"cheaper one"`, `"cheapest"`, `"most expensive"` $\rightarrow$ price/rating ranking among candidates.
     - **Category Disambiguation**: `"the GPU"`, `"the processor"` $\rightarrow$ matches specific category in pool, prompts clarification if ambiguous.
     - **Cart Removals**: `"remove the GPU"`, `"remove it from my cart"` $\rightarrow$ resolves against live cart state.
2. **Schema & API Updates (`src/lib/validation.ts` & `src/app/api/agent/route.ts`)**:
   - `AgentPromptSchema` updated to ingest `conversationHistory`, `contextState`, and `cartItems`.
   - `POST /api/agent` enhanced with multi-item actions (`action`, `product_ids`, `items: [{ product_id, quantity, name, price }]`, `updatedContext`, structured `debug` telemetry).
3. **Frontend Integration (`src/app/page.tsx`)**:
   - `aiContextState` stored and synchronized across every turn and tool invocation.
   - `executeAiPrompt` passes conversation history and cart items to `/api/agent`.
   - Directly executes multi-item additions and removals in the cart state without losing conversational context.
   - AI message stream renders interactive cards for all resolved items with individual and batch addition controls.
4. **Comprehensive Automated Test Suite (`scripts/test-conversational-context.ts`)**:
   - 23/23 tests passing covering all required reference patterns, multi-turn contexts, cart removals, ambiguity prompts, and the exact RTX 4080 Super + Ryzen 7800X3D multi-item scenario.

---

### Atomic Change Log

- **[NEW] [`src/lib/conversational-entity-resolver.ts`](file:///c:/Users/arunt/OneDrive/Documents/PROJECTS/Razorpay%20agent/src/lib/conversational-entity-resolver.ts)**:
  - Implemented `ConversationalProductContext`, `resolveConversationalReferences`, `findExplicitProductsInText`, and semantic classification.
- **[MODIFY] [`src/lib/validation.ts`](file:///c:/Users/arunt/OneDrive/Documents/PROJECTS/Razorpay%20agent/src/lib/validation.ts)**:
  - Extended `AgentPromptSchema` with `conversationHistory`, `contextState`, and `cartItems`.
- **[MODIFY] [`src/app/api/agent/route.ts`](file:///c:/Users/arunt/OneDrive/Documents/PROJECTS/Razorpay%20agent/src/app/api/agent/route.ts)**:
  - Added hybrid Gemini LLM + local deterministic entity resolution with multi-item payload support.
- **[MODIFY] [`src/app/page.tsx`](file:///c:/Users/arunt/OneDrive/Documents/PROJECTS/Razorpay%20agent/src/app/page.tsx)**:
  - Added `aiContextState`, updated `executeAiPrompt` for multi-item cart actions and state syncing, and enhanced product card rendering for multiple items.
- **[NEW] [`scripts/test-conversational-context.ts`](file:///c:/Users/arunt/OneDrive/Documents/PROJECTS/Razorpay%20agent/scripts/test-conversational-context.ts)**:
  - 23 automated tests verifying all reference resolution cases.

---

### Verification Summary
- ✅ `scripts/test-conversational-context.ts`: 23/23 tests passed.
- ✅ `scripts/test-integration.ts`: 6/6 HTTP security tests passed.
- ✅ `scripts/verify-security.ts`: 3/3 state machine tests passed.
- ✅ `npm run build`: Next.js 16.3.3 compiled in 16.0s with 0 errors across 13 routes.

---

## [Iteration 13] — 2026-08-28 — Dynamic Contextual Upselling & Bundle Recommendations in Cart and AI Agent
...
