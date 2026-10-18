# ADR-005: E-USAM Payments as a Candidate Shared Billing Service (audit required, not approved)

## Status
Proposed — E-USAM's payment implementation is a **candidate** for shared billing, **not an automatically approved shared service.** A dedicated audit must pass first.

## Context
The ecosystem audit found E-USAM's Django `api/payments/` app was deliberately built as a shareable commerce foundation: `PLATFORM_CODE` namespacing, EGP base currency with display FX, pluggable gateways (Stripe/Paymob/Fawry/Bank-of-Alexandria/manual), clean `checkout/ orders refunds providers/ webhook/<provider>/ fx/` endpoints.

USAM Communities today has **no commerce surface at all** (verified): `PricingPlan` and `Subscription` models exist but are dormant (admin read/edit only; `Subscription` is never written by any code; no checkout/webhook/provider/transaction/invoice/order). So billing for events, subscriptions, offers, and marketplace transactions is net-new regardless.

## Decision
Before adopting E-USAM payments as the ecosystem billing service, conduct and pass a **payments suitability audit** covering:

1. **Payment flows** — does it actually support the use cases USAM Communities needs: paid events/ticketing, membership/subscription billing, marketplace/service transactions (buyer↔seller), offers/perks redemption? Which are implemented vs scaffolded in E-USAM?
2. **API contracts** — are the `checkout/orders/refunds/webhook` contracts stable and versioned enough for an external consumer (USAM Communities) to call cross-service? Document request/response shapes.
3. **Security** — webhook signature verification per provider; idempotency keys on checkout; no secrets leaked; PCI-scope boundary (does card data ever touch our services, or only the gateway's hosted fields?).
4. **Tenant separation** — can funds/orders/refunds be correctly attributed per `PLATFORM_CODE` and (per ADR-006) per organization/tenant, with no cross-tenant read/write of financial records?
5. **Marketplace fit** — does it support multi-party/split payments (platform fee + seller payout) needed for a services marketplace, or only single-payee checkout? If not, that's a gap to flag, not assume.
6. **Operational** — currencies, countries, payout rules, refund windows, reconciliation/ledger, and who the legal merchant-of-record is.

Until that audit passes, USAM Communities integrates billing behind a **provider-independent `PaymentService` interface** (a seam), so the backing implementation (E-USAM payments vs a direct gateway vs a future dedicated billing service) can be chosen without rewriting callers.

## Consequences
- No payment code is wired to E-USAM yet; no live charges; no gateway credentials.
- The dormant `PricingPlan`/`Subscription` models are a hook for the eventual subscription use case but must not be assumed sufficient for marketplace/transactional billing.
- Any marketplace design (ADR for offers/services, see the gap report) must treat split-payment/escrow as an explicit requirement to test E-USAM payments against, not a given.

## Open questions
- Is E-USAM payments the sanctioned ecosystem billing service, or is billing owned elsewhere / to be a new dedicated service?
- Does the business need multi-party marketplace payouts (platform fee + seller) in phase 1, or only simple paid-events/subscriptions?
