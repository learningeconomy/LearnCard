# Best-effort zeroization in Node.js

## What zeroization means here

In this service, zeroization means reducing how long plaintext credential material stays strongly referenced in memory after we finish using it.

## Important limitation

Node.js does **not** guarantee true zeroization.

Why:

- V8 manages object and string memory through garbage collection.
- Clearing a JavaScript reference does not immediately wipe the underlying memory.
- Strings may be copied or interned by the runtime.
- `Buffer.alloc(0)` does not erase previously allocated buffers.

For buffer-backed secrets, `Buffer.fill(0)` is better than dropping the reference, but even that only applies to the specific buffer instance you still hold.

## Patterns we use

- Null out local plaintext references once signing/encryption is complete.
- Avoid unnecessary string/object copies of plaintext credentials.
- Prefer mutating a single working object instead of cloning plaintext repeatedly.
- Use explicit buffer wiping when the secret is actually stored in a mutable `Buffer`.

## Sign-then-encrypt plaintext window

Plaintext credential data exists in memory during these stages:

1. The boost JSON is parsed into an unsigned credential object.
2. Template rendering / metadata injection / OBv3 alignment injection mutate that object.
3. The unsigned credential is handed to the signer or encryptor.
4. After that handoff, local plaintext references are nulled on a best-effort basis.

## Current code pattern

`src/helpers/boost.helpers.ts` uses the comment marker below where local plaintext references are intentionally dropped:

```ts
// ZEROIZE: null out boostCredential reference after use
```

This shortens the lifetime of the helper's local handle, but it should be understood as risk reduction, not a cryptographic guarantee.
