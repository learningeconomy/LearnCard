---
description: Exposing an isomorphic webcrypto object
---

# Crypto

### Overview

Due to the nature of VCs/VPs, it can be important for users/plugins to have access to certain crypto primitives. There is a standardized crypto object available in browsers, but that is not always available in Node. This plugin exposes an isomorphic version of that crypto object that can be safely used anywhere by plugins!

### Install

```bash
pnpm i @learncard/crypto-plugin
```

### What is Webcrypto?

> The **Web Crypto API** is an interface allowing a script to use cryptographic primitives in order to build systems using cryptography.

In order to learn more, see the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/Web\_Crypto\_API).

### Use Cases

Any time a plugin or use needs to access the Web Crypto API!
