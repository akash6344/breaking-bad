# BreakFree

BreakFree is a small, non-clinical habit-change coach. It combines an immediate SOS intervention, daily check-ins, and trend summaries with real Gemini or Mistral responses.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` serves the UI only. To exercise `/api/coach` locally, run the full stack with:

```bash
npm run dev:full
```

API credentials are server-only variables and must never use Vite's `VITE_` prefix. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before deployment.

## Architecture and evaluation map

- **Problem alignment:** onboarding captures a habit, trigger, goal, and risk time; SOS coaching, adaptive check-in nudges, and history-based perspectives use that context.
- **Code quality:** UI features, reusable components, shared coach contracts, API access, storage, and types have separate modules under `src/`.
- **Security:** `/api/coach` validates bounded input, keeps provider keys server-side, treats user context as untrusted prompt data, validates model output, and deploys with restrictive browser headers.
- **Efficiency:** only five recent check-ins are sent from the UI, API history/output/body size are capped, and a short action-aware deadline prevents a slow provider chain from delaying offline SOS guidance.
- **Testing:** component, storage, API contract, and client response-validation tests cover user flows and failure-sensitive boundaries.
- **Accessibility:** semantic controls, associated labels, live response regions, visible focus styles, status/error roles, and reduced-motion support are provided.

## Data handling

The profile and check-ins are persisted under two app-owned `localStorage` keys so the micro-app does not need accounts or a server-side personal-data database. Data is shape-checked when read, calendar dates are validated, and history is retained up to 90 entries while only the five most recent are shown or sent to the coach. Relevant context is sent to an AI provider only when the user explicitly requests SOS coaching, a check-in nudge, or a weekly perspective. Reset removes only BreakFree-owned keys.

If both providers are unavailable or exceed the response deadline, the API returns clearly labeled offline guidance. The UI never presents fallback content as an AI-generated response. A weekly perspective becomes available only after check-ins on three different days, so it does not imply a trend from a single entry.

## Deployment safeguards

`api/coach.ts` is the server-side boundary for this app; it validates bounded JSON and keeps provider keys out of the browser. Configure rate limiting for `/api/coach` in the deployment platform's edge firewall or WAF. An in-memory limit inside a serverless function would not reliably protect multiple instances, so this repository does not make that misleading claim.

Before final submission, confirm at least one provider key is set in Vercel production environment variables and smoke-test the live URL for `source: "ai"` responses.
