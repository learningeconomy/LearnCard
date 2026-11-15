---
'learn-card-app': patch
---

On cold start, mount the app's routes without suspending once their module has loaded, so the first frame after the wallet is ready no longer swaps the whole app for the root loading fallback before redirecting to the dashboard.
