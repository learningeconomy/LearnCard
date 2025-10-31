# Multiple Origins Support

## Overview

The Partner Connect SDK now supports configuring multiple allowed origins for message validation. This enables partner apps to whitelist multiple deployment environments, domains, or brands while maintaining security.

## Usage

### Single Origin (Original Behavior)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});
```

### Multiple Origins (New Feature)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app',
    'https://preview.learncard.app'
  ]
});
```

## Behavior

### Incoming Messages (Validation)

Messages are accepted from:
1. **Any** configured origin (exact match)
2. **Capacitor origins** (always: `capacitor://localhost`, `ionic://localhost`)
3. **Localhost variants** (when any configured origin is localhost-based)

Example with multiple origins:

```typescript
hostOrigin: ['https://app.com', 'https://staging.app.com']

// ✅ Accepts: https://app.com
// ✅ Accepts: https://staging.app.com
// ✅ Accepts: capacitor://localhost (mobile apps)
// ✅ Accepts: ionic://localhost (legacy mobile)
// ❌ Rejects: https://unauthorized.com
// ❌ Rejects: http://localhost:3000 (not localhost-based)
```

### Outgoing Messages (Sending)

Messages are **automatically sent to the detected parent origin**:

```typescript
hostOrigin: ['https://prod.com', 'https://staging.com', 'https://dev.com']

// If iframe is hosted on staging.com:
// → postMessage will use: 'https://staging.com'

// If iframe is hosted on prod.com:
// → postMessage will use: 'https://prod.com'

// If detection fails (rare):
// → postMessage will fall back to: 'https://prod.com' (first in array)
```

**How Detection Works:**
1. SDK attempts to read `window.parent.location.origin` (same-origin only)
2. If cross-origin (typical), SDK waits for first incoming message from parent
3. Uses the validated origin from that message for all subsequent outgoing messages
4. Falls back to first configured origin if detection fails

**Important:** While the first origin is used as a fallback, messages are intelligently routed to the actual parent origin in practice.

## Common Use Cases

### 1. Multiple Deployment Environments

Support production, staging, and preview deployments:

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://app.example.com',              // Production
    'https://staging.example.com',          // Staging
    'https://preview-pr-123.example.com'    // PR preview
  ]
});
```

### 2. Multiple Brands/Domains

Single app supporting multiple brand domains:

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://brand-a.com',
    'https://brand-b.com',
    'https://brand-c.com'
  ]
});
```

### 3. Development + Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

const learnCard = createPartnerConnect({
  hostOrigin: isDev 
    ? ['http://localhost:3000', 'http://localhost:5173']  // Dev: multiple ports
    : ['https://app.com', 'https://staging.app.com']      // Prod: prod + staging
});
```

### 4. Dynamic Configuration

Load allowed origins from environment:

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://learncard.app'];

const learnCard = createPartnerConnect({
  hostOrigin: allowedOrigins
});

// .env:
// ALLOWED_ORIGINS=https://app.com,https://staging.app.com,https://preview.app.com
```

## Security Considerations

### ✅ Safe

- All origins are explicitly whitelisted
- Exact match required for validation
- Capacitor origins are cryptographically secure
- No wildcards or pattern matching (prevents broad attacks)

### ⚠️ Important

1. **Don't over-whitelist:** Only add origins you control
2. **First origin matters:** Outgoing messages use the first origin
3. **Keep list minimal:** More origins = larger attack surface
4. **Use environment variables:** Don't hardcode sensitive origins

### ❌ Avoid

```typescript
// ❌ DON'T: Overly broad whitelisting
hostOrigin: [
  'https://app.com',
  'https://staging.app.com',
  'https://dev.app.com',
  'https://test.app.com',
  'https://preview-*.app.com',  // This won't work anyway (no wildcards)
  // ... 20 more origins
]

// ✅ DO: Minimal necessary origins
hostOrigin: [
  'https://app.com',
  'https://staging.app.com'
]
```

## Migration

### No Breaking Changes

Existing single-origin configurations continue to work:

```typescript
// Before and After - works the same
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'  // string still works
});
```

### Upgrading to Multiple Origins

1. **Identify your origins:**
   - Production domain
   - Staging/preview domains
   - Development localhost (optional)

2. **Convert to array:**
   ```typescript
   // Before
   hostOrigin: 'https://app.com'
   
   // After
   hostOrigin: ['https://app.com', 'https://staging.app.com']
   ```

3. **Order matters:**
   - Put primary/production origin first
   - Messages will be sent to the first origin

4. **Test thoroughly:**
   - Verify all origins accept messages
   - Verify unauthorized origins are rejected
   - Verify outgoing messages use correct origin

## TypeScript

Full type safety for both single and multiple origins:

```typescript
import { createPartnerConnect, PartnerConnectOptions } from '@learncard/partner-connect';

// Both are valid
const config1: PartnerConnectOptions = {
  hostOrigin: 'https://app.com'  // string
};

const config2: PartnerConnectOptions = {
  hostOrigin: ['https://app.com', 'https://staging.app.com']  // string[]
};

const learnCard1 = createPartnerConnect(config1);
const learnCard2 = createPartnerConnect(config2);
```

## Implementation Details

### Internal Storage

Origins are normalized to an array internally:

```typescript
constructor(options: PartnerConnectOptions) {
  const hostOrigin = options.hostOrigin || 'https://learncard.app';
  this.hostOrigins = Array.isArray(hostOrigin) ? hostOrigin : [hostOrigin];
}
```

### Validation Logic

```typescript
private isValidOrigin(eventOrigin: string): boolean {
  // Check exact match with any configured origin
  if (this.hostOrigins.includes(eventOrigin)) return true;
  
  // Check Capacitor origins (always allowed)
  // ...
  
  // Check localhost variants (if applicable)
  // ...
}
```

### Message Sending

```typescript
private sendMessage<T>(action: string, payload?: unknown): Promise<T> {
  // Use first configured origin for sending
  window.parent.postMessage(message, this.hostOrigins[0]);
}
```

## FAQ

**Q: Can I use wildcards like `*.example.com`?**  
A: No, only exact origin matching is supported for security.

**Q: What if I need different behavior for different origins?**  
A: Create separate SDK instances for different origin groups.

**Q: Can I change origins after initialization?**  
A: No, origins are set at construction and immutable. Create a new instance if needed.

**Q: What happens with an empty array?**  
A: Empty arrays are not recommended. Always provide at least one origin.

**Q: Do I need to include Capacitor origins in the array?**  
A: No, Capacitor origins are always accepted automatically.

**Q: Can I mix localhost and production origins?**  
A: Yes, but localhost variants are only accepted if ANY origin is localhost-based.

## Examples

### Astro App with Environment Detection

```typescript
---
const isProd = import.meta.env.PROD;
const hostOrigins = isProd
  ? ['https://learncard.app']
  : ['http://localhost:3000', 'http://localhost:4321'];
---

<script>
  import { createPartnerConnect } from '@learncard/partner-connect';
  
  const learnCard = createPartnerConnect({
    hostOrigin: window.__LEARNCARD_ORIGINS
  });
</script>

<script define:vars={{ hostOrigins }}>
  window.__LEARNCARD_ORIGINS = hostOrigins;
</script>
```

### React App with Env Variables

```typescript
// config.ts
export const LEARNCARD_ORIGINS = process.env.REACT_APP_LEARNCARD_ORIGINS
  ?.split(',')
  .map(origin => origin.trim())
  || ['https://learncard.app'];

// App.tsx
import { createPartnerConnect } from '@learncard/partner-connect';
import { LEARNCARD_ORIGINS } from './config';

const learnCard = createPartnerConnect({
  hostOrigin: LEARNCARD_ORIGINS
});
```

---

**The Partner Connect SDK now supports flexible multi-origin configurations while maintaining security!** 🔒✨
