# ADR-003: `hub.usamif.com` is a Candidate Domain Only

## Status
Accepted (decision) — **no infrastructure action authorized.**

## Context
A browser tab in the user's screenshot showed `hub.usamif.com`. The ecosystem audit (`docs/ecosystem/ECOSYSTEM_ARCHITECTURE_AND_INTEGRATION.md` §2) verified that **none of the five USAM source trees reference `hub.usamif.com`**, and that USAM Hub's own nginx (`backend/deploy/nginx.conf`) still uses the literal placeholder `server_name yourdomain.com`. The network was offline during inspection, so the live site could not be resolved.

## Decision
Treat `hub.usamif.com` as a **candidate** domain for USAM Communities only. Do **not** change DNS, nginx `server_name`, TLS/certificates, CORS allow-lists, OAuth callback URLs, or any production deployment on the basis of this assumption.

## Consequences
- The placeholder `yourdomain.com` in `backend/deploy/nginx.conf`, `ssl-setup.sh`, `ec2-setup.sh`, and `.env.example` stays untouched until the real domain and the live application serving it are both verified (requires network access + confirmation from the user or infra owner).
- Any env/config that would need the real domain (CORS, OAuth redirect URIs, cookie `Domain=.usamif.com` for future cross-subdomain SSO) is deferred to a single, deliberate "domain assignment" change once verified.
- This is explicitly reversible: it changes nothing.

## Follow-up to unblock
- Resolve `hub.usamif.com` (DNS + HTTP) when the network is available and confirm what application answers it.
- Confirm with the user/infra owner whether USAM Communities is the intended tenant of that subdomain.
