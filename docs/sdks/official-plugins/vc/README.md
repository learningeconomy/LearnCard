# VC

The VC Plugin is responsible for implementing standard Verifiable Credential methods. These include signing and verifying credentials and presentations, as well as easily creating testing VCs and VPs.

### Install

```bash
pnpm i @learncard/vc-plugin
```

## Verification Extension

This plugin also exposes the `VerifyExtension` type, allowing sub-plugins to be easily created that add extra verification checks to the `verifyCredential` method.
