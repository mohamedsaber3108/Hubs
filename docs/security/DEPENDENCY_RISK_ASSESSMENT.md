# Dependency Vulnerability Risk Assessment

> Evidence-based triage of `npm audit` findings by **actual runtime exposure**,
> not raw count. Remediation is targeted — no `npm audit fix --force`, no blind
> semver-major upgrades that would break the toolchain or require a framework
> migration. Residual risks are explicitly accepted below with rationale and a
> re-check trigger. Date of assessment: this batch (branch `audit/baseline-verification`).

## Method

- Production runtime = code that executes in the running API process (backend)
  or ships in the browser bundle (frontend). This is where a CVE can actually be
  reached by an attacker.
- Build/dev/test tooling (jest, nodemon, vite, vitest, eslint, babel, rollup,
  esbuild, tailwind/postcss build chain) does **not** ship to production:
  backend deploys with `npm ci --omit=dev`; the frontend ships a static bundle,
  not its build tools. CVEs confined to that tooling are dev-environment risks,
  not production attack surface.

## Backend — remediated

| Package | Severity | Exposure | Action |
|---|---|---|---|
| `sharp` (libvips/libheif/librsvg CVEs) | high | **Runtime** — resizes user-uploaded images (`s3.service.js`). Real exposure. | **Fixed:** bumped `^0.33.0` → `^0.35.5` (libvips 8.18.7). API usage (`resize/jpeg/webp/toBuffer`) unchanged; 251 backend tests green; verified a real resize succeeds. |

After this fix: **0 production-runtime high vulnerabilities in the backend.**

## Backend — accepted residual risk

| Package(s) | Severity | Why accepted |
|---|---|---|
| `braces`, `micromatch`, `chokidar`, `jest*`, `babel-jest`, `create-jest`, `nodemon` | high | **Dev/test only** (jest + nodemon transitive). Not installed in production (`npm ci --omit=dev`). `braces` has **no fixed version on the registry** (latest 3.0.3 is still in-range); the only "fix" npm offers is downgrading `nodemon` to 1.x or jumping `jest` to a new major — a toolchain-breaking change for a DoS reachable only by a malicious glob pattern in a dev build. Not worth it. |
| `uuid` (via `sequelize`, `bull`, `node-cron`) | moderate | The CVE is a missing buffer bounds check **only when a `buf` argument is passed** to v3/v5/v6. Our transitive usage does not pass `buf`; the vulnerable path is unreachable. A fix requires `uuid@14` (major) overridden under sequelize/bull — high regression risk for no reachable benefit. |
| `js-yaml`/`argparse`/`sprintf-js`/`@istanbuljs/*` | moderate | Coverage/dev tooling only; not in the production dependency tree. |

## Frontend — accepted residual risk (no non-breaking runtime fix available)

| Package(s) | Severity | Exposure / why accepted |
|---|---|---|
| `react-router` / `react-router-dom` (open redirect via backslash) | moderate | **Ships to browser.** But every `<Link to>` / `navigate()` target in this app is an internal literal — no attacker-controlled navigation target — so the open-redirect path is not reachable in practice. The only fix is **react-router v7** (semver-major; data-router API migration across every route). Deferred as a tracked migration rather than a blind breaking upgrade. Mitigation: do not pass user-supplied strings directly to `navigate()`/`<Link to>`. |
| `vite`, `vitest`, `esbuild`, `rollup`, `@vitest/mocker` | high/mod | **Build/test tooling** — not shipped in the static bundle. esbuild dev-server CVE applies only to the local dev server, not production (Nginx serves static files). |
| `eslint`, `typescript-eslint`, `@humanfs/node`, `glob`, `minimatch`, `flatted` | high/mod | Lint/build tooling only; never shipped. |
| `postcss`, `tailwindcss`, `postcss-selector-parser`, `browserslist`, `lovable-tagger`, `source-map-js`, `nanoid`, `picomatch`, `brace-expansion`, `lodash`, `js-yaml`, `yaml`, `ajv` | high/mod | Build-time CSS/JS pipeline + transitive dev deps. `lodash` `_.template` injection is not reachable (we don't call `_.template`). These do not execute in the shipped SPA. |

## Net production-runtime posture after this batch

- **Backend: 0 high / 0 moderate reachable in production runtime** (sharp fixed; uuid path unreachable).
- **Frontend: 0 high shipped to the browser.** One moderate (react-router open-redirect) ships but is not reachable given internal-only navigation; tracked for the eventual v7 migration.

## Re-check triggers

- Before any production deploy, re-run `npm audit --omit=dev` (backend) and review the frontend bundle deps.
- When `braces`/`micromatch` publish a fixed release, drop the dev-only acceptance.
- Schedule the `react-router` v6→v7 migration as its own reviewed change (not bundled with feature work).
