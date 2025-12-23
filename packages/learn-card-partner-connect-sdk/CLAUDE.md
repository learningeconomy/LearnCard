# Partner Connect SDK - AI Assistant Guide

## Package Overview

The `@learncard/partner-connect` SDK is a Promise-based JavaScript library that enables secure cross-origin communication between partner applications and the LearnCard host application. It abstracts away complex postMessage management and provides a clean, type-safe API.

## Architecture

### Core Components

- **PartnerConnect Class**: Main SDK class managing message lifecycle
- **Message Queue**: Tracks pending requests with unique IDs and timeouts
- **Central Listener**: Validates origins and resolves/rejects promises
- **Type System**: Comprehensive TypeScript definitions for all APIs

### Security Model

The SDK implements defense-in-depth security:

1. **Origin Validation**: Strict origin matching against configured whitelist
2. **Protocol Verification**: Messages must match expected protocol version
3. **Request ID Tracking**: Only tracked requests are processed
4. **No Wildcard Origins**: Never uses `'*'` as target origin
5. **Query Parameter Override**: Validated against whitelist for staging deployments

### Configuration Hierarchy

1. **Default**: `https://learncard.app` (security anchor)
2. **Query Parameter**: `?lc_host_override=https://staging.learncard.app`
3. **Configured Origin**: From `hostOrigin` option

## Development Guidelines

### When to Modify This Package

- Adding new postMessage action types to communicate with LearnCard host
- Implementing new security features or origin validation logic
- Updating TypeScript definitions for new API methods
- Fixing browser compatibility issues

### When NOT to Modify This Package

- Adding business logic (belongs in example apps or consuming applications)
- Implementing credential issuance logic (use `@learncard/init` in backend)
- Creating UI components (partner apps handle their own UI)

### Code Style Guidelines

This package follows strict coding standards:

- **TypeScript**: All code must be fully typed with no `any` types
- **Error Handling**: Use structured `LearnCardError` objects with specific codes
- **Security**: Never bypass origin validation or use wildcard origins
- **Documentation**: All public APIs must have JSDoc with examples
- **Browser Compatibility**: Target modern browsers, avoid Node.js-specific APIs

### Common Tasks

#### Adding a New SDK Method

1. Define the method interface in `src/types.ts`:
```typescript
export interface NewFeatureResponse {
  success: boolean;
  data?: unknown;
}
```

2. Add the method to `PartnerConnect` class in `src/index.ts`:
```typescript
public newFeature(params: unknown): Promise<NewFeatureResponse> {
  return this.sendMessage<NewFeatureResponse>('NEW_FEATURE', params);
}
```

3. Document the method with JSDoc including examples
4. Update the README.md with the new method
5. Test with example applications

#### Updating Security Configuration

When modifying origin validation:
- Never bypass the security checks
- Always validate query parameter overrides
- Test with different deployment scenarios
- Update documentation for new security features

### Testing Strategy

Since this is a browser-only SDK that requires iframe communication:

1. **Example Apps**: Use example apps to test all SDK methods
2. **Integration Testing**: Test against staging and production LearnCard hosts
3. **Security Testing**: Verify origin validation with malicious origins
4. **Browser Testing**: Test across Chrome, Firefox, Safari

### Common Patterns

#### Secure Message Handling
```typescript
// ✅ Good: Strict origin validation
private isValidOrigin(eventOrigin: string): boolean {
  return eventOrigin === this.activeHostOrigin;
}

// ❌ Bad: Accepting any origin
private isValidOrigin(eventOrigin: string): boolean {
  return true; // NEVER DO THIS
}
```

#### Proper Cleanup
```typescript
// ✅ Good: Clean up resources
public destroy(): void {
  if (this.messageListener) {
    window.removeEventListener('message', this.messageListener);
  }
  // Reject pending requests
  for (const [requestId, pending] of this.pendingRequests.entries()) {
    clearTimeout(pending.timeoutId);
    pending.reject({ code: 'SDK_DESTROYED', message: 'SDK was destroyed' });
  }
  this.pendingRequests.clear();
}
```

#### Type-Safe Error Handling
```typescript
// ✅ Good: Structured error objects
public async someMethod(): Promise<Response> {
  try {
    return await this.sendMessage('SOME_ACTION');
  } catch (error) {
    if (error.code === 'LC_TIMEOUT') {
      // Handle timeout specifically
    }
    throw error;
  }
}
```

## Build and Deployment

### Build Commands

- **Build**: `pnpm exec nx build partner-connect-sdk`
- **Development**: `pnpm exec nx dev partner-connect-sdk`
- **Type Check**: `pnpm exec nx typecheck partner-connect-sdk`

### Build Outputs

The package builds to multiple formats:
- **CommonJS**: `dist/partner-connect.js`
- **ESM**: `dist/partner-connect.esm.js`
- **Types**: `dist/index.d.ts`

### Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+  
- Safari 14+
- Requires: `postMessage`, `Promise`, `URLSearchParams`

## Integration with LearnCard Ecosystem

### Relationship to Other Packages

- **Independent**: No dependencies on other LearnCard packages
- **Consumed By**: Example apps in `examples/app-store-apps/`
- **Communicates With**: LearnCard host application via postMessage
- **Backend Integration**: Example apps use `@learncard/init` for credential issuance

### Example App Development

When creating new example apps:
1. Follow existing patterns in `examples/app-store-apps/`
2. Use Astro for simple static hosting compatibility
3. Implement proper error handling and user feedback
4. Include environment variable configuration
5. Document setup and deployment steps

### Deployment Considerations

- **CDN Distribution**: Package is suitable for CDN distribution
- **Bundle Size**: Keep dependencies minimal (currently zero)
- **Security**: Never expose private keys in browser code
- **Environment Variables**: Backend credentials only, never in frontend

## Troubleshooting Guide

### Common Issues

1. **Origin Validation Errors**
   - Check that hostOrigin matches LearnCard host exactly
   - Verify query parameter overrides are in whitelist
   - Ensure no mixed HTTP/HTTPS protocols

2. **Timeout Issues**  
   - Increase requestTimeout for slow networks
   - Check that LearnCard host is responding to messages
   - Verify iframe is properly loaded

3. **Type Errors**
   - Ensure using browser setTimeout (returns number, not NodeJS.Timeout)
   - Check TypeScript compiler target supports modern features
   - Verify all imports are correctly typed

### Debug Information

Enable console logging by setting:
```typescript
// The SDK automatically logs configuration in development
console.log('[LearnCard SDK] Using configured origin:', this.activeHostOrigin);
```

## Security Considerations

### Critical Security Rules

1. **Never bypass origin validation**
2. **Never use wildcard (`*`) target origins**
3. **Always validate query parameter overrides against whitelists**
4. **Reject messages from untrusted origins silently**
5. **Use unique request IDs to prevent replay attacks**

### Production Deployment

- Set `hostOrigin` to production LearnCard domain
- Remove any hardcoded development origins
- Test origin validation with production domains
- Monitor for security warnings in browser console

### Staging/Testing Configuration

Use query parameter override for staging:
```typescript
const sdk = createPartnerConnect({
  hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
});
// URL: https://partner-app.com/?lc_host_override=https://staging.learncard.app
```