# LearnCard Embed Example (Astro)

This is a minimal Astro app demonstrating the LearnCard Embed SDK in a real "Course Completion" flow.

- Clean UI with a completion card
- Renders the LearnCard Claim button via the Embed SDK
- Fully deployable to Netlify (mirrors the chapi example setup)

## Local development

From the repo root after installing deps:

```bash
pnpm i
pnpm --filter @learncard/embed-sdk build
cd examples/embed-example
pnpm dev
```

Then open `http://localhost:4321`.

## Testing modes

The example reads configuration from URL query params, so you can test different scenarios without touching code:

| URL | Mode |
|-----|------|
| `http://localhost:4321` | **Stub mode** — no backend needed. Email/OTP submit no-ops, flows all the way to success screen. Good for UI-only testing. |
| `http://localhost:4321?pk=pk_xxx` | **Live network** — uses `https://network.learncard.com/api` with the given publishable key and the hardcoded demo credential. |
| `http://localhost:4321?pk=pk_xxx&template=My+Template` | **Live network + template** — resolves credential by name server-side instead of sending a full VC object. |
| `http://localhost:4321?pk=pk_xxx&api=http://localhost:4000/api&template=My+Template` | **Fully local** — points at a local backend with a locally-created template. Useful for end-to-end local testing. |

### Params

| Param | Description |
|-------|-------------|
| `pk` | Publishable key from the developer dashboard. Omit for stub mode. |
| `api` | API base URL. Defaults to `https://network.learncard.com/api` when `pk` is set. |
| `template` | Template name for server-side resolution. When set, passes `credential: { name }` instead of the hardcoded demo VC. |

## Netlify

This project includes `netlify.toml` for one-click deployments. Use Netlify's monorepo support with the base directory set to `examples/embed-example/`.

- Build command: `pnpm exec nx build embed-example`
- Publish directory: `dist/`

## Notes

- The example depends on the workspace package `@learncard/embed-sdk`.
- If you change the SDK, rebuild it with `pnpm --filter @learncard/embed-sdk build` before running this example locally.
