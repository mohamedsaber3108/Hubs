# Feature Matrix — verified against source

Status legend: **Working** = route+controller+model+frontend wiring confirmed by direct code read, no DB-backed test run. **Partial** = wiring confirmed but a specific gap found. **Unverified** = exists but not traced end-to-end. **Broken** = confirmed bug.

| Frontend route | Page | Backend route prefix | Models touched | Status | Evidence |
|---|---|---|---|---|---|
| `/` | `Index`→`Landing` | — | — | Working | `App.tsx:66`, `Index.tsx:2,8` |
| `/auth/signup`, `/auth/signin` | `SignUp`/`SignIn` | `/auth` | User, Session, EmailVerification | Working | `auth.routes.js`↔`auth.controller.js` |
| `/pricing` | `Pricing` | `/admin/pricing` (read via settings) | PricingPlan, Subscription | Partial | pricing plans are admin-managed; no public pricing route found distinct from admin — confirm with user if a public `/api/v1/pricing` is expected |
| `/profile/:username`, `/profile/edit` | `Profile`/`ProfileEdit` | `/profile`, `/users/me` | User, UserSkill, UserExperience, UserEducation, Follow | Working | `profile.routes.js`, `user.routes.js` |
| `/communities` | `Communities` | `/communities` | Community, CommunityMembership | Working | |
| `/feed`, `/:community/feed` | `Feed` | `/posts` | Post, PostLike, PostComment | Partial | real feed data via `useFeed`→`post.service`; `TRENDING_HASHTAGS` sidebar still mocked (`mockFeedData.ts`) |
| `/events`, `/events/:id` | `Events`/`EventDetail` | `/events` | Event, EventAttendee | Working | RSVP capacity enforcement confirmed in controller |
| `/challenges`, `/challenges/:id` | `Challenges`/`ChallengeDetail` | `/challenges` | Challenge, ChallengeSubmission, ChallengeVote, LeaderboardPoint, PointTransaction | Working | |
| `/opportunities` | `Opportunities` | `/opportunities` | Opportunity, OpportunityApplication, SavedOpportunity | Working | |
| `/resources` | `Resources` | `/resources` | Resource, ResourceRating | Working | |
| `/leaderboard` | `Leaderboard` | `/leaderboard` | User, LeaderboardPoint, Community, CommunityMembership | Working | cached 60s via `optionalAuth`+`cache` middleware |
| `/discover` | `Discover` | — (reuses `/users`, `/communities`) | User, Community | Unverified | page exists and routed; underlying service calls not individually traced |
| `/mentors` | `Mentors` | `/mentors` | Mentor, MentorRequest, User, Community | Working | |
| `/groups`, `/groups/:id` | `Groups`/`GroupDetail` | `/groups` | Group, GroupMember, Post | Working | |
| `/search` | `SearchPage` | `/search` | 9 entity models | Working | |
| `/onboarding` | `Onboarding` (protected) | `/onboarding` | OnboardingResponse, Community, CommunityMembership | Working | |
| `/dashboard` | `Dashboard` (protected) | multiple | — | Unverified | not individually traced this pass |
| `/settings` | `Settings` (protected) | `/users/me/*` | User, Session, Notification | Working | |
| `/messages` | `Messages` (protected) | `/messages` + Socket.IO `/chat` | Conversation, ConversationParticipant, ChatMessage | Working | real-time via socket namespace, confirmed in `server.js` |
| `/admin` | `Admin` (protected, two-layer gate) | `/admin/*` | 10 admin controllers, 42 models | Partial | see SEC-01 in `SECURITY_AND_PRODUCTION_GAPS.md` — role gap now fixed, not yet execution-verified |
| NomadAI widget (global) | `NomadAI.tsx` | `/nomad/chat` | none (direct Anthropic API call) | Working | no persistence model found for chat history despite docs claiming "persisted history" — **flag: unverified claim**, no `NomadMessage`-style model exists in the 42-model list |
| — | — | `/api/v1/webhooks/ses-bounce` | — | **Not implemented** | confirmed via grep, no `/webhooks` router mounted anywhere |

## Flags needing follow-up (not yet resolved this pass)
1. **NomadAI chat history persistence** — `PROJECT_OVERVIEW.md`/phase docs claim "persisted history" but no chat-history model was found among the 42 models. Needs direct verification of `nomad.controller.js` to confirm whether history is persisted anywhere (Redis? DB? not at all?) before trusting that claim.
2. **Public pricing endpoint** — `Pricing.tsx` page exists; unclear if it calls a public read endpoint or reuses admin-settings pricing data. Needs direct trace of `pricingPlan`/pricing-related frontend service calls.
3. **Dashboard page** — not traced to specific backend calls this pass.
4. **Discover page** — not traced to specific backend calls this pass.

These four items are good candidates for the next context-gathering pass before further feature work.
