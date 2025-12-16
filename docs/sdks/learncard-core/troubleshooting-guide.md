---
description: Common issues and solutions when working with LearnCard SDK
---

# Troubleshooting Guide

This guide addresses common issues encountered when developing with LearnCard SDK and provides practical solutions and workarounds.

## Installation and Setup Issues

### Module Resolution Errors

**Issue:** Errors like `Cannot find module '@learncard/core'` or `Cannot find module '@learncard/init'`

**Solutions:**
1. Verify package installation:
   ```bash
   npm list @learncard/core @learncard/init
   # or for pnpm
   pnpm list @learncard/core @learncard/init
   ```

2. Check for version mismatches between LearnCard packages:
   ```bash
   npm list | grep learncard
   # or for pnpm
   pnpm list | grep learncard
   ```

3. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

### WASM Loading Issues

**Issue:** Errors related to WASM loading, particularly in browsers or serverless environments

**Error messages:**
- `WebAssembly module is included in initial chunk`
- `Error: Unable to load WASM module`

**Solutions:**
1. For webpack, ensure proper WASM loading configuration:
   ```javascript
   // webpack.config.js
   module.exports = {
     experiments: {
       asyncWebAssembly: true,
     },
     // ...
   };
   ```

2. For Next.js, use dynamic imports:
   ```javascript
   const initializeLearnCard = async () => {
     const { initLearnCard } = await import('@learncard/init');
     return initLearnCard({ seed: yourSeed });
   };
   ```

3. Provide your own WASM bundle path:
   ```javascript
   import { initLearnCard } from '@learncard/init';
   import didkitPath from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
   
   const learnCard = await initLearnCard({ 
     seed: yourSeed,
     didkit: didkitPath
   });
   ```

## Credential Issuance and Verification Issues

### Invalid Signature Errors

**Issue:** `Verification equation was not satisfied` or `Signature error` during credential verification

**Solutions:**
1. Ensure you're using the same wallet instance for verification that was used for issuance
2. Check for credential tampering or modification after issuance
3. Verify the credential format matches expected schema
4. Check if the credential has been properly signed:
   ```javascript
   // Verify the credential structure
   console.log(JSON.stringify(credential, null, 2));
   
   // Ensure the proof exists and is properly formatted
   console.log(credential.proof);
   ```

### DID Resolution Failures

**Issue:** Errors like `Unable to resolve DID` or `Not a valid DID` during verification

**Solutions:**
1. Verify the DID format:
   ```javascript
   // Should follow the pattern: did:method:identifier
   console.log(credential.issuer);
   ```

2. Check network connectivity if resolving remote DIDs
3. For `did:web`, ensure the domain is accessible and properly configured
4. Try resolving the DID manually:
   ```javascript
   const didDocument = await learnCard.invoke.resolveDid(credential.issuer);
   console.log(didDocument);
   ```

## Storage and Retrieval Issues

### URI Resolution Failures

**Issue:** Unable to retrieve credentials from URIs, getting `null` or errors

**Solutions:**
1. Check URI format:
   ```javascript
   // Should follow proper URI format for the storage method
   console.log(uri);
   ```

2. Verify network connectivity for remote storage
3. Ensure the credential exists at the specified location
4. For LearnCloud storage, check API connectivity:
   ```javascript
   const status = await fetch('https://network.learncard.com/health');
   console.log(await status.json());
   ```

### Index Retrieval Issues

**Issue:** `index.[provider].get()` returns empty array or missing credentials

**Solutions:**
1. Verify credentials were properly added to the index:
   ```javascript
   // Check all indexes
   const allIndexes = await learnCard.index.all.get();
   console.log(allIndexes);
   
   // Check specific index
   const learnCloudIndex = await learnCard.index.LearnCloud.get();
   console.log(learnCloudIndex);
   ```

2. Ensure you're using the same wallet instance (same seed) that added the credentials
3. Check if the storage service is accessible

## Plugin-Related Issues

### Plugin Not Found

**Issue:** Errors like `Cannot invoke method from undefined plugin: [methodName]`

**Solutions:**
1. Ensure plugin is properly registered:
   ```javascript
   // Check registered plugins
   console.log(learnCard.plugins.map(p => p.name));
   ```

2. Check plugin initialization order (dependency plugins should be loaded first)
3. Verify plugin compatibility with your LearnCard Core version

### Plugin Method Errors

**Issue:** Unexpected errors when calling plugin methods

**Solutions:**
1. Check method parameters match expected types
2. Verify plugin version compatibility with core
3. Enable debug mode if available:
   ```javascript
   const learnCard = await initLearnCard({
     seed: yourSeed,
     debug: true
   });
   ```

## Browser/Environment-Specific Issues

### CORS Issues

**Issue:** CORS errors when accessing storage or DIDs in browser environments

**Solutions:**
1. Ensure your backend properly sets CORS headers
2. For development, consider using a CORS proxy
3. For Ceramic/LearnCloud, check endpoint configurations

### Mobile Web View Incompatibilities

**Issue:** LearnCard functionality not working in mobile web views

**Solutions:**
1. Ensure WASM is supported in the web view
2. Check for any mobile-specific storage limitations
3. Consider using LearnCard Bridge HTTP API for mobile apps

## Debugging Techniques

### Enable Verbose Logging

Add a logging plugin to capture detailed information:

```javascript
const loggingPlugin = {
  name: 'debug-logger',
  methods: {
    intercept: async (method, params, learnCard) => {
      console.log(`Calling ${method} with params:`, params);
      try {
        const result = await learnCard.invoke[method](...params);
        console.log(`${method} result:`, result);
        return result;
      } catch (error) {
        console.error(`${method} error:`, error);
        throw error;
      }
    }
  }
};

const learnCard = await initLearnCard({
  seed: yourSeed,
  plugins: [loggingPlugin]
});

// Now wrap any method call
const result = await learnCard.invoke.intercept('verifyCredential', [credential]);
```

### Inspect Credential Structure

For verification issues, inspect the credential structure:

```javascript
function inspectCredential(credential) {
  console.log('===== CREDENTIAL INSPECTION =====');
  console.log('Types:', credential.type);
  console.log('Issuer:', credential.issuer);
  console.log('Subject:', credential.credentialSubject.id);
  console.log('Proof type:', credential.proof?.type);
  console.log('Issuance date:', credential.issuanceDate);
  console.log('Expiration date:', credential.expirationDate);
  console.log('================================');
}
```

## Getting Help

If you continue to experience issues after trying the solutions in this guide:

1. Check the [GitHub repository](https://github.com/learningeconomy/LearnCard) for open issues
2. Join the [Learning Economy Discord](https://discord.gg/learningeconomy) for community support
3. Submit a detailed bug report with:
   - LearnCard SDK version
   - Node.js/browser version
   - Complete error message and stack trace
   - Minimal reproducible example
   - Environment details (OS, deployment context)