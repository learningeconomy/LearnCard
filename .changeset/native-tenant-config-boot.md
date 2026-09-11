---
"learn-card-app": patch
"learn-card-base": patch
---

fix: native apps no longer fail to boot with "TenantConfig endpoint /__tenant-config returned invalid JSON"

Native builds skip the relative `/__tenant-config` overlay fetch (it only exists as a web edge function; Capacitor SPA-fallbacks it to `index.html` with HTTP 200) and boot from the baked config. As a safety net, `resolveTenantConfig` now treats a non-JSON overlay response as non-fatal whenever a baked config exists.
