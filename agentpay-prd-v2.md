# AgentPay — Hackathon PRD (v2)
### Trust & Policy Layer for Agentic Commerce on Razorpay
**Track:** AI Growth & Agentic Commerce | **Status:** Build-ready | **Window:** 12 days

---

## 1. Executive Summary

AgentPay lets an AI buyer agent complete a real purchase from a merchant on Razorpay test-mode rails — safely. Every money-moving action is gated by a deterministic policy engine, never by the LLM directly, and every action produces a signed, explainable audit entry. The MVP demonstrates one complete, narratable transaction: an AI agent discovers a product, proposes an upsell that breaches the merchant's autonomous spend limit, gets held for human approval, is approved, pays through Razorpay, and — in a second run — hits a simulated payment failure that recovers gracefully. That's the whole demo. Everything in this PRD exists to make those two runs bulletproof.

**Why this wins:** judges in this track are scoring for exactly three things — explainability, bounded/gated autonomy, and a working audit trail with a graceful failure. This PRD cuts everything that doesn't directly serve one of those three, so 100% of the 12 days goes into things a judge will actually see or ask about.

---

## 2. Goals & What Judges Will Score

| Judging criterion | How AgentPay proves it |
|---|---|
| **Explainability** | Every policy decision returns a human-readable rationale *before* the payment call — shown live in the demo trace. |
| **Bounded autonomy** | LLM never touches the Razorpay credential path. A deterministic policy engine is the only thing authorized to trigger a payment. |
| **Auditability** | Hash-chained, queryable audit log; one API call replays the full trace of any transaction. |
| **Graceful failure** | One rehearsed payment-decline scenario: detect → log → message → retry-or-cancel, no dead ends. |
| **Real integration, not a mockup** | Actual Razorpay test-mode Orders + Payments + Webhooks, not stubbed responses. |

### Success metrics (for the pitch, not a dashboard you need to build)
- 100% of money actions have a complete signed audit entry.
- 1 upsell scenario that gets correctly blocked and then correctly re-authorized.
- 1 payment failure that recovers without manual code intervention.
- Demo runs twice, live, without a rehearsed failure of its own.

---

## 3. Core Feature Set — Build These, In This Order

Ranked by judge-visible impact per day of effort. If time runs out, stop at the line marked **CUT LINE** — everything above it is a complete, demoable product on its own.

### 3.1 Policy Engine (deterministic gate) — Day 3–5
The single most important artifact in the whole build — it's what makes the "bounded autonomy" claim true instead of asserted.
- `POST /api/policy/evaluate` takes a cart total + merchant limits, returns `ALLOW | APPROVAL_REQUIRED | BLOCK` plus a `reason_code` and one sentence of plain-language rationale.
- Hardcoded rule set is fine — no DSL, no config UI. Three rules only: autonomous spend cap, discount ceiling, and upsell-must-be-re-evaluated.
- **Non-negotiable:** the LLM/agent layer never calls Razorpay directly. Only a passing Policy Engine decision unlocks the Razorpay call. This is the line you'll get asked about — have the code ready to point at.

### 3.2 Agent-Readable Catalog + Conversational Checkout Agent — Day 3–6 (parallel with 3.1)
- Seed 3–5 products with price, stock, and a discount ceiling.
- Agent takes a natural-language request ("find me a wireless keyboard under ₹5,000"), queries the catalog, proposes a cart, and states its rationale for the pick.
- Checkout path: `Product → Cart → Quote → Policy → (Approval if required) → Razorpay → Confirmation`.

### 3.3 Bounded Upsell — Day 6
- Agent may propose exactly one complementary item per transaction.
- The combined cart is re-run through the Policy Engine — this is your live "watch it get blocked, then approved" moment. Don't build more than one upsell rule; this is a demo beat, not a feature.

### 3.4 Razorpay Test-Mode Checkout — Day 6–8
- Real `orders.create` → `payments.capture` → webhook confirmation. No shortcuts here — a judge asking "is this real Razorpay?" and getting "yes" is worth more than three extra dashboard widgets.
- One idempotency key per checkout session (cheap to add, and it's the kind of detail that signals engineering maturity to a technical judge).

### 3.5 Audit Trail — Day 7–9
- Every catalog query, policy decision, approval event, and Razorpay call logged with: `event_id`, `timestamp`, `actor_id`, `action_type`, `decision`, `reason_code`, hash-chain (`prior_hash` / `event_hash`).
- `GET /api/audit/{transaction_id}` returns the full trace — this single endpoint is your explainability proof and doubles as a live "let me show you the receipts" moment in the pitch.

### 3.6 One Graceful Failure Path — Day 9
- Simulate one Razorpay payment-capture decline. On failure: log with reason code, no blind auto-retry, buyer gets a plain-language message with **Retry / Cancel**.
- Build exactly one failure scenario, well, rather than several half-working ones — this is explicitly what separates a demo that inspires confidence from one that looks brittle under judge questions.

### 3.7 Minimal Merchant Dashboard — Day 9–10
- One screen: revenue, agent-activity counts (allowed/approved/blocked), and a clickable transaction trace for any order.
- This is where the audit trail becomes visually legible to a non-technical judge in 10 seconds — worth the day, nothing more.

**— CUT LINE — everything above is a complete, judged-worthy submission —**

### 3.8 If You Have Slack Time (Day 11, only if 3.1–3.7 are done and stable)
- Polish the approval modal UI.
- Add a second seeded merchant/catalog for variety in the demo.
- Do **not** start: campaign orchestrator, multi-protocol bridge, refund agent, rate-limiting, compliance export tooling. These are real roadmap items but they add surface area without adding judge-visible proof of the three scoring criteria — save them for the "what's next" slide, not the build.

---

## 4. Explicitly Out of Scope for the Hackathon

Say these out loud in the pitch as "roadmap," never attempt to half-build them:
- Multi-protocol bridge (ACP / AP2 / x402 / NPCI UAP) — mention as a 1-slide vision item only.
- Campaign orchestrator / proactive discount triggers.
- Autonomous refunds (human-gated only, and not even that in the MVP).
- Rate-limiting / velocity controls.
- Compliance export tooling, PII tokenization infra, formal data-retention policy.
- General policy DSL — three hardcoded rules is correct, not a shortcut.

---

## 5. Technical Architecture (minimum viable)

```
React / Next.js
 ├── Buyer Agent UI (chat + cart)
 └── Merchant Dashboard (revenue, activity, trace)
        │
        ▼
Node.js API
 ├── Agent Controller     (proposes actions only — no payment scope)
 ├── Catalog Service
 ├── Policy Engine        (ALLOW / APPROVAL_REQUIRED / BLOCK)
 ├── Checkout Service     (cart → quote → order lifecycle)
 ├── Razorpay Service     (test-mode order + capture calls)
 └── Audit Service        (hash-chained event log)
        │
        ├── PostgreSQL (merchants, products, policies, transactions, audit_log)
        └── Razorpay Test API
```

**Design principle to state explicitly to judges:** the Agent Controller emits a *proposed action*, never a payment call. The Policy Engine independently validates price, stock, discount, and spend limit before anything reaches Razorpay. This separation — not the UI — is the actual product.

### Endpoints (implement these exactly, nothing extra)
- `GET /api/products/search?query=...`
- `POST /api/cart/quote`
- `POST /api/policy/evaluate` → `{ decision, reason_code, rationale }`
- `POST /api/approval/request`, `POST /api/approval/{id}/decision`
- `POST /razorpay/orders`, `POST /razorpay/payments/capture`
- `GET /api/audit/{transaction_id}`

---

## 6. Acceptance Criteria (use these to know you're demo-ready)

**AC-1 — Explainability**
Given a completed checkout, when the audit trace is queried, then `reason_code` and rationale text are present and timestamped *before* the Razorpay call.

**AC-2 — Gating**
Given a merchant autonomous limit of ₹5,000, when an agent proposes a ₹6,498 cart (keyboard + upsell), then decision is `APPROVAL_REQUIRED`; when only the ₹4,499 keyboard is proposed, decision is `ALLOW` and no approval step occurs.

**AC-3 — Audit completeness**
Given any transaction (allowed, approved, or blocked), when inspected via `GET /api/audit/{id}`, then every state transition has a corresponding hash-chained entry with no gaps.

**AC-4 — Graceful failure**
Given a simulated Razorpay decline, when capture fails, then: order marked `failed` → reason-coded audit entry written → buyer sees a plain-language message with Retry/Cancel → no automatic blind retry.

**AC-5 — Credential separation**
Given the Agent Controller's runtime, when inspected, then it holds no credential scope capable of calling `/razorpay/payments/capture` directly — only the Checkout/Razorpay Service does, and only after a passing Policy Engine decision.

---

## 7. Demo Script (rehearse this exactly)

1. Agent request: *"Find me a wireless mechanical keyboard under ₹5,000."*
2. Agent finds keyboard (₹4,499), states rationale.
3. Agent proposes upsell: wireless mouse (₹1,999) → cart total ₹6,498.
4. Policy Engine returns `APPROVAL_REQUIRED`, reason: exceeds ₹5,000 autonomous cap — **shown live in the trace**.
5. Merchant approves in the dashboard.
6. Razorpay test-mode order created, payment captured, confirmation shown.
7. Pull up `GET /api/audit/{id}` — walk through the full hash-chained trace.
8. **Second run:** trigger the simulated decline → show the graceful failure path end-to-end → retry succeeds.
9. Close on the one-slide roadmap (multi-protocol bridge, campaign orchestrator) — proves vision without having half-built it.

---

## 8. 12-Day Timeline

| Days | Deliverable |
|---|---|
| 1–2 | Next.js shell, Node API, Postgres schema, Razorpay test-mode connectivity confirmed |
| 3–5 | Policy Engine + rule tests (Section 3.1) |
| 3–6 | Catalog + Conversational Checkout Agent, in parallel (Section 3.2) |
| 6 | Bounded upsell + re-evaluation (Section 3.3) |
| 6–8 | Full Razorpay order → capture → webhook flow live end-to-end (**MVP checkpoint**) |
| 7–9 | Audit trail + hash chain + trace endpoint (Section 3.5) |
| 9 | One graceful failure path, rehearsed (Section 3.6) |
| 9–10 | Minimal merchant dashboard (Section 3.7) |
| 11 | Slack time only if stable — polish, not new scope (Section 3.8) |
| 12 | Feature freeze, full regression pass on the demo script, backup demo recorded |

---

## 9. Risks (only the ones that can actually sink the demo)

- **LLM output reaching Razorpay directly** — mitigate with credential-level separation (Section 5), not just application logic; this is the first thing a technical judge will try to break.
- **Over-scoping past the cut line** — hold firm; every item in Section 3.8/Section 4 is a "next" slide, not a sprint task.
- **Demo-day flakiness** — rehearse both the success run and the failure run at least 3 times before judging; record a backup video on Day 12.
- **Audit log becomes a bottleneck** — keep writes simple and synchronous for the MVP; async/eventual-consistency is a post-hackathon optimization, not a Day 1–12 concern.
