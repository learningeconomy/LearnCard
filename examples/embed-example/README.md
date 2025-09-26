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

## Netlify

This project includes `netlify.toml` for one-click deployments. Use Netlify’s monorepo support with the base directory set to `examples/embed-example/`.

- Build command: `pnpm exec nx build embed-example`
- Publish directory: `dist/`

## Notes

- The example depends on the workspace package `@learncard/embed-sdk`.
- If you change the SDK, rebuild it before running this example locally.
