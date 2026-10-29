# Issuer registry proxy

`GET /api/registry-proxy/<host>/<path>[?query]` fetches public OpenID Federation (OIDF) issuer-registry documents for `useKnownDIDRegistry`. It follows the same pattern as the Scout news endpoint (`apps/scouts/netlify/README.md`): a small app-owned Netlify edge function, deployed with the frontend, with no secrets and no backend service.

Example: `https://staging.learncard.ai/api/registry-proxy/staging.opensalt.net/issuer-registry/fetch?sub=did%3Aweb%3Aoneuni.testuni.edu`

## Where it lives

The handler is `registryProxy.ts` in this directory. It is dependency-free so the same file runs in three places:

- **Netlify edge (Deno):** `apps/learn-card-app/netlify/edge-functions/registry-proxy.ts` and `apps/scouts/netlify/edge-functions/registry-proxy.ts` re-export it. Each entry has `path: '/api/registry-proxy/*'` and `cache: 'manual'`.
- **Local Vite dev and preview servers:** `registryProxyDevServer.ts`, registered in both apps' Vite configs.
- **Browser:** the client uses the same allowlist to decide which URLs to proxy.

`deploy.yml` deploys from a clean staging directory, so it copies this file to the same repo-relative path under the stage root. That lets the edge entries' relative imports resolve when Netlify bundles them. Deploy previews built by Netlify's git integration have the full repo, so no copy is needed there.

## Allowlist

Anything not listed below gets an uncached `403` without contacting any upstream.

| Host                                   | Path                                             | Query parameters (each at most once, non-empty, at most 2048 chars) |
| -------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `opensalt.net`, `staging.opensalt.net` | `/issuer-registry/.well-known/openid-federation` | none                                                                |
|                                        | `/issuer-registry/fetch`                         | `sub` (required), `iss`                                             |
|                                        | `/issuer-registry/list`                          | `entity_type`                                                       |
|                                        | `/issuer-registry/subordinate_listing`           | `entity_type`                                                       |

Additional rules:

- **Exact matches only.** Hosts and paths must match exactly: no subdomains, ports, userinfo, fragments, or percent-encoded separators. Dot segments are normalized before matching.
- **Upstream is always `https`.**
- **Methods:** only `GET` and `OPTIONS` (CORS preflight, `204`). Everything else gets `405` with `Allow: GET, OPTIONS`.
- **No credentials forwarded.** Requests to OpenSALT carry only an `Accept` header. Caller cookies, authorization, and other headers are dropped, and upstream response headers such as `Set-Cookie` are not returned.
- **Redirects are not followed** (`redirect: 'manual'`), so an upstream redirect cannot escape the allowlist. A redirect is treated as an error.
- **Timeout:** the upstream request, including reading the body, is aborted after 8 seconds (`504`).
- **Response checks:**
    - Content type must be `application/entity-statement+jwt`, `application/jwt`, or `application/json`.
    - Body must be at most 256 KiB. This is checked against `Content-Length` and again while streaming.
    - JWT bodies must be compact JWS and JSON bodies must parse.

    Anything else gets `502`. At the time of writing, the staging trust-anchor entity configuration is about 9.5 KB, an issuer entity statement about 1 KB, and the subordinate listing under 1 KB.

To add a registry, extend `ALLOWED_HOSTS` / `ALLOWED_PATHS` in `registryProxy.ts` and its tests. Paths should stay specific to the OIDF endpoints listed in that registry's trust-anchor configuration.

## Caching

| Response                         | Headers                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `200`                            | `Cache-Control: public, max-age=60`; `Netlify-CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=600` |
| `404` (issuer not in registry)   | `Cache-Control: no-store`                                                                                          |
| Errors (`403`/`405`/`502`/`504`) | `Cache-Control: no-store`                                                                                          |

With these headers, removing an issuer from the registry can take up to about 15 minutes to show up at the CDN (5 minutes fresh plus 10 minutes stale-while-revalidate). The client also keeps documents for 60 seconds and conclusive lookups for an hour, which is the same as before this proxy. Negative `404` lookups are not cached, so a newly registered issuer appears on the next lookup. The query string is part of the cache key, so each `sub` is cached separately.

All responses carry `Access-Control-Allow-Origin: *`, allow the `sentry-trace` / `baggage` request headers, and expose `X-Registry-Proxy: 1`. The client uses that header to tell real proxy responses apart from SPA fallbacks.

## Client behavior and base URL

`useKnownDIDRegistry` passes a proxy base URL to `knownDIDRegistryQueryOptions`:

- **Web:** `window.location.origin`. This covers production, staging, deploy previews, and local Vite dev, which serves the same handler.
- **Native (iOS/Android):** `https://<tenant domain>` from `TenantConfig`. Native origins are `capacitor://localhost` / `https://localhost`. Examples: `learncard.app`, `staging.learncard.ai`, `pass.scout.org`, `staging.pass.scout.org`.
- **Native with no tenant config:** no proxy, so direct requests are made as before.

Only allowlisted URLs (currently the OpenSALT trust anchor and fetch endpoint) are proxied. The LearnCard registry lists and `dcc-legacy` registries are still fetched directly.

**Fail-safe:** a proxied response is used only if it carries `X-Registry-Proxy` and is `200` or `404`. In every other case (proxy outage, `5xx`, timeout, network error, or an HTML SPA fallback because the edge function is missing) the client retries the original direct request, which is the old behavior. If that also fails, the registry is marked unchecked and the issuer resolves to `unknown` with `incomplete: true`. The proxy only relays the same public upstream documents, so it can never turn a failure into `trusted`.

Registry labels remain informational. As before, federation JWTs are decoded but not signature-verified.

## Traffic and billing

Same assumptions as the Scout news endpoint:

- **Invocations:** CDN cache hits do not invoke the edge function. The cache is regional, so this is not a guarantee of one upstream request per document per window.
- **Requests and bandwidth** can still incur usage on cache hits.
- **Who triggers requests:** traffic comes from credential views, issuer-status cards, and verification displays for credentials whose registry list includes an OIDF registry.
- **Requests per lookup:** each uncached issuer lookup is at most two proxy requests (trust anchor, shared across issuers, plus one `fetch?sub=` per issuer DID). React Query de-duplicates in-flight and recent lookups on the client.

Netlify's published credit-based pricing (as of October 2026) is 2 credits per 10,000 web requests and 20 credits per GB of bandwidth. For illustration, one million proxy requests averaging 5 KB each (a mix of 9.5 KB anchors and 1 KB statements, before compression) would use about 200 request credits plus about 100 bandwidth credits, before other app usage. Actual cost depends on compression, browser caching, real payload sizes, and the team's plan, which has not been verified. The team lead should review usage limits and overage settings, and decide whether traffic rules or rate limits are warranted. This change does not modify any account, billing, or firewall settings.

References: [edge function usage](https://docs.netlify.com/build/edge-functions/usage-and-billing/), [caching configuration](https://docs.netlify.com/build/edge-functions/optional-configuration/), [current pricing](https://www.netlify.com/pricing/).

## Deployment QA

1. Deploy LCA and ScoutPass frontends to staging.
2. Fetch `https://staging.learncard.ai/api/registry-proxy/staging.opensalt.net/issuer-registry/.well-known/openid-federation` twice. Verify:
    - status `200` and `application/entity-statement+jwt`
    - CORS headers
    - a `Cache-Status` hit on the second request
3. Verify the rejections:
    - `.../api/registry-proxy/example.com/issuer-registry/fetch?sub=x` returns `403`
    - a `POST` returns `405`
4. Open a credential issued by a DID in the OpenSALT test registry (see `.../issuer-registry/subordinate_listing`) on staging web, iOS, and Android. Check that it shows as trusted. On native, check that requests go to the tenant's staging domain.
5. Block `/api/registry-proxy/*` and verify the issuer still resolves through the direct fallback, or shows as unknown if OpenSALT is also blocked. It must never show as trusted in that case.
6. Repeat on production after staging validation. Existing native installs need the new CapGo bundle.

Local unit tests (`registryProxy.test.ts`, `issuerRegistry.test.ts`) cover:

- the allowlist and its rejections
- methods
- timeout
- CORS and cache headers
- content-type, size, and body validation
- uncached errors
- base-URL selection
- proxy routing, `404` handling, and direct fallback
- the never-trusted-on-failure guarantee
