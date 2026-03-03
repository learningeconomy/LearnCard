# Query Parameter Override (`lc_host_override`)

## Overview

The Partner Connect SDK supports dynamic origin configuration via the `lc_host_override` query parameter. This enables testing against staging and preview environments without recompiling partner applications.

## Configuration Hierarchy

The SDK determines the active host origin using this priority order:

### 1. **Hardcoded Default** (Security Anchor)

```typescript
PartnerConnect.DEFAULT_HOST_ORIGIN = 'https://learncard.app'
```

This is the ultimate fallback and foundational security anchor.

### 2. **Query Parameter Override** (Dynamic)

```
?lc_host_override=https://staging.learncard.app
```

The LearnCard host app inserts this query parameter into the iframe URL when serving non-production environments.

### 3. **Configured Origin** (Static Fallback)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});
```

First value in the `hostOrigin` array, or the single string value if not an array.

## How It Works

### LearnCard Host Behavior

**Production Environment:**
```html
<iframe src="https://partner-app.com/"></iframe>
```
- No `lc_host_override` parameter
- SDK uses configured/default origin

**Staging Environment:**
```html
<iframe src="https://partner-app.com/?lc_host_override=https://staging.learncard.app"></iframe>
```
- `lc_host_override` parameter present
- SDK adopts staging origin for all communication

**Preview Environment:**
```html
<iframe src="https://partner-app.com/?lc_host_override=https://pr-123.learncard.app"></iframe>
```
- Dynamically generated override
- SDK routes to preview environment

### Partner App Behavior

The SDK automatically:
1. Reads the `lc_host_override` query parameter
2. Validates it against the configured whitelist (if provided)
3. Adopts it as the active origin
4. Sends all messages to that origin
5. Only accepts messages from that origin

## Whitelist Validation

### Without Whitelist (Development)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// URL: ?lc_host_override=https://staging.learncard.app
// ✅ Accepted (no whitelist to validate against)
// ⚠️ Less secure - any origin can be specified
```

### With Whitelist (Recommended)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app',
    'https://preview.learncard.app'
  ]
});

// Scenario 1: Valid override
// URL: ?lc_host_override=https://staging.learncard.app
// ✅ Accepted - in whitelist
// → Active origin: https://staging.learncard.app

// Scenario 2: Invalid override
// URL: ?lc_host_override=https://evil.com
// ❌ Rejected - not in whitelist
// ⚠️ Console warning logged
// → Active origin: https://learncard.app (fallback)

// Scenario 3: No override
// URL: (no query param)
// → Active origin: https://learncard.app (first in array)
```

## Security Model

### The Validation Rule

**Mathematical Equivalence:**
```
Incoming Message Origin ≡ Active Host Origin
```

The SDK enforces **strict exact matching** on all incoming messages.

### Why This Is Secure

Even if an attacker manipulates the query parameter:

```typescript
// Malicious URL injection
// URL: ?lc_host_override=https://evil.com

const learnCard = createPartnerConnect({
  hostOrigin: ['https://learncard.app']  // Whitelist
});

// What happens:
// 1. SDK reads lc_host_override=https://evil.com
// 2. Validates against whitelist: ['https://learncard.app']
// 3. NOT FOUND in whitelist
// 4. Falls back to: https://learncard.app
// 5. activeHostOrigin = 'https://learncard.app'
// 6. Sends messages to: https://learncard.app
// 7. Only accepts messages from: https://learncard.app
// 8. Attacker's messages from evil.com: REJECTED ❌
```

**Key Point:** Browser security prevents `evil.com` from spoofing `event.origin`. Even if the attacker controls the query parameter, they cannot forge the message origin, so their messages will always be rejected.

## Use Cases

### 1. Staging Testing

```typescript
// Production config - same for all environments
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app'
  ]
});

// Production: iframe URL has no query param
// → Uses: https://learncard.app

// Staging: iframe URL has ?lc_host_override=https://staging.learncard.app
// → Uses: https://staging.learncard.app
```

### 2. Preview Deployments

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app',
    'https://pr-*.learncard.app'  // ❌ Won't work - no wildcards
  ]
});

// Better approach: Don't validate preview origins
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'  // No whitelist
});

// Any preview origin will be accepted via lc_host_override
// URL: ?lc_host_override=https://pr-123.learncard.app
// ✅ Works (no whitelist validation)
```

### 3. Local Development

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'http://localhost:3000'
  ]
});

// LearnCard running locally
// URL: ?lc_host_override=http://localhost:3000
// ✅ Works - validates against whitelist
```

## Implementation Details

### Query Parameter Parsing

```typescript
private configureActiveOrigin(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const hostOverride = urlParams.get('lc_host_override');

  if (hostOverride) {
    if (this.isOriginInWhitelist(hostOverride)) {
      this.activeHostOrigin = hostOverride;
      console.log('[LearnCard SDK] Using lc_host_override:', hostOverride);
    } else {
      console.warn('[LearnCard SDK] Invalid lc_host_override:', hostOverride);
      this.activeHostOrigin = this.hostOrigins[0];
    }
  } else {
    this.activeHostOrigin = this.hostOrigins[0];
  }
}
```

### Message Validation

```typescript
private isValidOrigin(eventOrigin: string): boolean {
  // STRICT: Exact match with active host origin only
  return eventOrigin === this.activeHostOrigin;
}
```

### Message Sending

```typescript
private sendMessage<T>(action: string, payload?: unknown): Promise<T> {
  const message = { protocol, action, requestId, payload };
  
  // Use active origin (configured or overridden)
  window.parent.postMessage(message, this.activeHostOrigin);
}
```

## Console Logging

The SDK logs origin configuration for debugging:

**Valid Override:**
```
[LearnCard SDK] Using lc_host_override: https://staging.learncard.app
```

**Invalid Override:**
```
[LearnCard SDK] lc_host_override value is not in the configured whitelist: https://evil.com
Allowed: ['https://learncard.app', 'https://staging.learncard.app']
[LearnCard SDK] Using configured origin: https://learncard.app
```

**No Override:**
```
[LearnCard SDK] Using configured origin: https://learncard.app
```

## Best Practices

### ✅ DO

1. **Use whitelist for known environments:**
   ```typescript
   hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
   ```

2. **Log validation failures in production:**
   - Monitor console warnings about invalid overrides
   - May indicate misconfiguration or attack attempts

3. **Test both with and without override:**
   - Verify fallback behavior
   - Ensure whitelist validation works

### ❌ DON'T

1. **Don't use wildcards (not supported):**
   ```typescript
   hostOrigin: ['https://*.learncard.app']  // Won't work
   ```

2. **Don't hardcode staging URLs in production:**
   ```typescript
   // ❌ Bad
   const origin = isDev ? 'http://localhost:3000' : 'https://learncard.app';
   
   // ✅ Good
   const origin = ['https://learncard.app', 'https://staging.learncard.app'];
   ```

3. **Don't disable validation carelessly:**
   ```typescript
   // ⚠️ Insecure if deployed to production
   hostOrigin: undefined  // Accepts any override
   ```

## Testing

### Manual Testing

1. **Test default behavior:**
   ```
   https://partner-app.com/
   → Should use first configured origin
   ```

2. **Test valid override:**
   ```
   https://partner-app.com/?lc_host_override=https://staging.learncard.app
   → Should use staging origin
   → Check console for confirmation log
   ```

3. **Test invalid override:**
   ```
   https://partner-app.com/?lc_host_override=https://evil.com
   → Should fall back to first configured origin
   → Check console for warning log
   ```

4. **Test message rejection:**
   - Manually send postMessage from unauthorized origin
   - Verify SDK silently rejects the message
   - No errors should be thrown

### Automated Testing

```typescript
describe('lc_host_override', () => {
  it('should use override when in whitelist', () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '?lc_host_override=https://staging.learncard.app' }
    });

    const sdk = createPartnerConnect({
      hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
    });

    // Assert: activeHostOrigin === 'https://staging.learncard.app'
  });

  it('should reject override not in whitelist', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?lc_host_override=https://evil.com' }
    });

    const sdk = createPartnerConnect({
      hostOrigin: ['https://learncard.app']
    });

    // Assert: activeHostOrigin === 'https://learncard.app'
  });
});
```

## Migration

### From Previous Version

**Old behavior:** Parent origin detected from incoming messages
**New behavior:** Query parameter takes precedence

**No code changes required** for most cases:

```typescript
// This still works
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// Now additionally supports:
// URL: ?lc_host_override=https://staging.learncard.app
```

### Adding Whitelist

If you previously used multiple origins for detection:

```typescript
// Before: Used for detection
hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']

// After: Used for whitelist validation
hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
// Behavior change: No longer accepts both by default
// Requires lc_host_override to use staging
```

## FAQ

**Q: Can I use wildcards in the whitelist?**  
A: No, only exact origin matching is supported for security.

**Q: What if I don't provide a whitelist?**  
A: Any `lc_host_override` value will be accepted (less secure).

**Q: Can attackers use this to hijack communication?**  
A: No. Even with a malicious override, browser security prevents origin spoofing.

**Q: Does this work with Capacitor mobile apps?**  
A: Yes, use `?lc_host_override=capacitor://localhost` in the iframe URL.

**Q: Can I change the parameter name?**  
A: Not currently. The parameter name `lc_host_override` is fixed.

**Q: Will this work with hash-based routing (#)?**  
A: Yes, query parameters work with both hash and path-based routing.

---

**The Partner Connect SDK now supports flexible, secure origin configuration for seamless staging/preview testing!** 🔐✨
