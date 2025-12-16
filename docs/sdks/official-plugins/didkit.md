---
description: Exposing the fundamental building blocks of Dids, VCs and VPs
---

# DIDKit

### Overview

In order to interact with DIDs, Verifiable Credentials and Verifiable Presentations, we need a few primitives. These primitives include cryptographically generating and converting key material, signing and signature verification, and the resolution of a did to its did document.

The folks over at [Spruce](https://www.spruceid.com/) have made a wonderful Rust crate named [DIDKit](https://www.spruceid.dev/didkit/didkit) that can be used for this purpose via the DIDKit plugin.

### Install

```bash
pnpm i @learncard/didkit-plugin
```

### What is DIDKit?

> DIDKit provides Verifiable Credential and Decentralized Identifier functionality across different platforms. DIDKit's core libraries are written in Rust due to Rust's expressive type system, memory safety, simple dependency web, and suitability across different platforms including embedded systems, but the comprehensive DIDKit SDK includes many libraries and interfaces for using it almost everywhere.

### Use Cases

Anything related to issuing and signing VCs/VPs, as well as generating key material and DIDs!
