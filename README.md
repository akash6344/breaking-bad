# BreakFree

BreakFree is a small, non-clinical habit-change coach. It combines an immediate SOS intervention, daily check-ins, and trend summaries with real Gemini or Mistral responses.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

API credentials are server-only variables and must never use Vite's `VITE_` prefix. Run `npm test` and `npm run build` before deployment.

## Architecture and evaluation map

- **Problem alignment:** onboarding captures a habit, trigger, goal, and risk time; SOS coaching, adaptive check-in nudges, and history-based perspectives use that context.
- **Code quality:** UI features, reusable components, API access, storage, and shared types have separate modules under `src/`.
- **Security:** `/api/coach` validates bounded input, keeps provider keys server-side, treats user context as untrusted prompt data, validates model output, and deploys with restrictive browser headers.
- **Efficiency:** only five recent check-ins are sent from the UI, API history and output are capped, provider calls time out, and local state avoids unnecessary network persistence.
- **Testing:** component, storage, and API contract tests cover user flows and failure-sensitive boundaries.
- **Accessibility:** semantic controls, associated labels, live response regions, visible focus styles, status/error roles, and reduced-motion support are provided.

## Data handling

The profile and check-ins are persisted under two app-owned `localStorage` keys so the micro-app does not need accounts or a server-side personal-data database. Relevant context is sent to an AI provider only when the user explicitly requests SOS coaching, a check-in nudge, or a weekly perspective. Reset removes only BreakFree-owned keys.

If both providers are unavailable, the API returns clearly labeled offline guidance. The UI never presents fallback content as an AI-generated response.
