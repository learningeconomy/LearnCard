---
'learn-card-app': patch
---

perf: give every learn-card-app route its own React Router route module (`src/routes.ts` reads the route table in `src/routing/routeTable.ts`). Each page is its own chunk that React Router can prefetch, a route's clientLoader starts its page code (and, for `/launchpad` and `/app/:listingId`, its data) when navigation starts, and `/legal/terms`, `/legal/privacy` and `/app/:listingId` render without waiting for sign-in to settle. Public app store reads (listings, install counts, browsing) use the anonymous network client instead of a wallet. The static build now also fails on prerendered route data (`.data`) for `/s/`, `/share-boost` or `/verify/resume`.
