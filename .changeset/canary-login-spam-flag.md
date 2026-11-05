---
'@learncard/escrow-canary': patch
---

Provisioning: `--allow-login-spam-fail` accepts an SES spam verdict of `FAIL` on login-code mail only (production login mail from some Postmark pools is scored as spam). All other trust checks still apply; the tier 3 runner is unchanged.
