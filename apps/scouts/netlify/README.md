# Scout news endpoint

`GET /api/scout-news` fetches the public `https://www.scout.org/api/news` feed. It accepts no URL or pagination parameters and forwards no client cookies or authorization. This replaces the unreliable AllOrigins proxy.

The endpoint is a Netlify edge function deployed with the frontend. `deploy.yml` already copies this directory into its deploy staging folder and checks that the edge bundle exists. No new secret or backend deployment is required.

Web uses `/api/scout-news` on the current host, including staging and deploy previews. Native uses `https://<resolved tenant domain>/api/scout-news`; production is `pass.scout.org`, staging is `staging.pass.scout.org`. Public CORS responses support both `capacitor://localhost` (iOS) and `https://localhost` (Android). Local Vite development proxies the same route directly to Scout.org.

Successful responses have a five-minute browser/CDN cache lifetime and a one-hour CDN stale-while-revalidate window. `cache: 'manual'` is also required for Netlify edge caching. The client considers fetched news fresh for five minutes, retries failures once, and fetches immediately on first mount despite its bundled initial data. Upstream requests time out after eight seconds; failures return uncached JSON errors with CORS headers, and the UI keeps its bundled-news fallback.

## Traffic and billing

Cached responses bypass edge function invocation, reducing upstream fetches and invocation usage. This is a regional cache, not a guarantee of one upstream request globally every five minutes. Requests and outgoing response bandwidth can still incur usage even for cache hits. This endpoint serves public news only; it is deliberately unauthenticated and is not a general-purpose proxy.

As of October 11, 2026, Netlify's published credit-based pricing lists 2 credits per 10,000 web requests and 20 credits per GB of bandwidth. The tested 100-article feed was approximately 76 KB when serialized and 19 KB when gzipped locally; deployed compression has not been measured. For illustration, one million news requests with 20 KB transferred per response would consume approximately 200 request credits plus 400 bandwidth credits, before other app usage. Compression, browser caching, actual payload size, and the team's legacy/enterprise/credit plan change the estimate. The team's current plan has not been verified.

The team lead should review the account's usage limits, recharge/overage settings, and whether traffic rules/rate limits are warranted for expected traffic. No account billing or firewall settings are changed by this PR.

References: [edge function usage](https://docs.netlify.com/build/edge-functions/usage-and-billing/), [caching configuration](https://docs.netlify.com/build/edge-functions/optional-configuration/), [current pricing](https://www.netlify.com/pricing/).

## Deployment QA

1. Deploy frontend to `scouts-staging`; this deploys the web endpoint and the CapGo client update together.
2. Fetch `https://staging.pass.scout.org/api/scout-news` twice. Verify JSON `{ data, pager }`, CORS, and a `Cache-Status` cache hit on a subsequent request (headers on the deployed response are the source of truth).
3. Open Campfire on staging web and staging iOS/Android; check that current articles appear and native requests use the staging domain.
4. Block the endpoint or go offline and verify that bundled articles still render.
5. Repeat with target `scouts` and `https://pass.scout.org/api/scout-news` after staging validation. Existing native installs need the new CapGo bundle to activate; publishing a native store binary is optional for this web-code change.

Local tests cover endpoint errors, timeout, CORS/cache headers, client caching, first-mount refresh, production/staging native URL selection, and rendered fallback. Live Netlify cache behavior and actual device OTA activation require deployment QA.
