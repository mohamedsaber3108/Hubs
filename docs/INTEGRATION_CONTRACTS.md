# Integration Contracts (skeleton — pending essential questions)

No external integration contract below is implemented. These are placeholders showing the shape of what will need defining once the essential questions in the audit report are answered. No secrets are included or should ever be added here.

## SSO / Identity (blocked on ADR-001)

```
GET  {IDP_ISSUER}/.well-known/openid-configuration   — discovery (once IdP is known)
POST {IDP_ISSUER}/oauth2/token                        — Authorization Code + PKCE exchange
```
Request/response shapes cannot be defined until the central IdP (if any) is identified.

## USAM Education (not yet integrated)

Unknown API surface — no contract exists in this codebase today. Needs the Education product's actual API docs/OpenAPI spec before any client code is written.

## USAM Jobs (not yet integrated)

Hub currently has its own `Opportunity`/`OpportunityApplication` models (confirmed in `CURRENT_STATE_VERIFIED.md`). Per the master prompt, "Jobs and applications belong in USAM Jobs. Hub surfaces relevant opportunities and transfers using shared identity and deep links/API integrations." This implies either:
- Hub's `Opportunity` feature becomes a read-only mirror/deep-link surface into Jobs, or
- Hub's existing opportunities are migrated into Jobs outright.

**Essential question** (see final report): which of these is intended? No schema or route changes should happen here until answered, since it affects whether `OpportunityApplication` stays or gets deprecated.

## USAM Freelancing (not yet integrated)

No existing Hub code references a Freelancing product. Unknown API surface.

## Billing / Payments (blocked on provider decision, Track D)

```
POST /api/v1/events/:id/checkout        — placeholder, NOT implemented
POST /api/v1/webhooks/payment-provider  — placeholder, NOT implemented
```
No payment provider has been chosen (essential question). Current `PricingPlan`/`Subscription` models exist for platform-tier billing but have no payment-provider integration wired in yet (not traced in depth this pass — flagged for Track A follow-up).

## Notification (Novu — deferred per OPEN_SOURCE_REGISTRY.md)

No contract needed yet; current notification implementation (SES/Nodemailer + `Notification` model + Socket.IO `/notifications` namespace) needs to be fully traced before deciding if a new contract/integration is warranted.

## AI / NomadAI (Anthropic — already integrated, contract below is the VERIFIED current one)

```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key: {ANTHROPIC_API_KEY}  (env var, never logged/printed)
```
Confirmed in `nomad.controller.js:25-28` — direct `fetch` call, no SDK wrapper, no persistence model found for chat history (flagged SEC-10 in `SECURITY_AND_PRODUCTION_GAPS.md`). Multi-agent orchestration layer (Track E) will need a formal internal contract (orchestrator → agent → tool registry) that does not exist yet.
