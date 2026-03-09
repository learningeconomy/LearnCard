# Multiple Origins Support

## Overview

The Partner Connect SDK supports configuring multiple allowed origins via the `hostOrigin` option. These origins serve as a **whitelist for the `lc_host_override` query parameter**, enabling partner apps to work across multiple deployment environments (production, staging, preview) without code changes.

**Important:** At runtime, only a **single active origin** is used for both sending and receiving messages. The multiple origins array does **not** enable accepting messages from multiple origins simultaneously.

## Usage

### Single Origin (Default Behavior)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});
```

### Multiple Origins (Whitelist for `lc_host_override`)

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

### How Origin Resolution Works

At initialization, the SDK determines a **single `activeHostOrigin`** using this hierarchy:

1. **`lc_host_override` query parameter** — if present and the value is in the configured `hostOrigin` array (or is a native app origin when `allowNativeAppOrigins` is `true`)
2. **First configured `hostOrigin`** — fallback
3. **Default** — `https://learncard.app`

### Incoming Messages (Validation)

Messages are validated with **strict exact matching** against the single `activeHostOrigin`:

```typescript
private isValidOrigin(eventOrigin: string): boolean {
  return eventOrigin === this.activeHostOrigin;
}
```

Example with multiple origins and no override:

```typescript
hostOrigin: ['https://app.com', 'https://staging.app.com']
// No lc_host_override in URL

// Active origin: https://app.com (first in array)
// ✅ Accepts: https://app.com
// ❌ Rejects: https://staging.app.com (not the active origin)
// ❌ Rejects: https://unauthorized.com
```

Example with override:

```typescript
hostOrigin: ['https://app.com', 'https://staging.app.com']
// URL: ?lc_host_override=https://staging.app.com

// Active origin: https://staging.app.com (from validated override)
// ✅ Accepts: https://staging.app.com
// ❌ Rejects: https://app.com (not the active origin)
```

### Outgoing Messages (Sending)

Messages are always sent to the `activeHostOrigin`:

```typescript
window.parent.postMessage(message, this.activeHostOrigin);
```

## Common Use Cases

### 1. Multiple Deployment Environments

Support production and staging via `lc_host_override`:

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://app.example.com',              // Production (default)
    'https://staging.example.com',          // Staging (via override)
  ]
});

// Production iframe: https://partner-app.com/
//   → Active origin: https://app.example.com
//
// Staging iframe: https://partner-app.com/?lc_host_override=https://staging.example.com
//   → Active origin: https://staging.example.com
```

### 2. Dynamic Configuration

Load allowed origins from environment:

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://learncard.app'];

const learnCard = createPartnerConnect({
  hostOrigin: allowedOrigins
});

// .env:
// ALLOWED_ORIGINS=https://app.com,https://staging.app.com
```

### 3. Development + Production

```typescript
const isDev = process.env.NODE_ENV === 'development';

const learnCard = createPartnerConnect({
  hostOrigin: isDev
    ? 'http://localhost:3000'
    : ['https://app.com', 'https://staging.app.com']
});
```

## Security Considerations

### ✅ Safe

- Only a **single active origin** is used at runtime for message validation
- The whitelist only controls which `lc_host_override` values are accepted
- Exact match required for validation (no wildcards or patterns)
- The LearnCard host controls which override value is set on the iframe URL

### ⚠️ Important

1. **Only whitelist origins you control** — any whitelisted origin can become the active origin via `lc_host_override`
2. **First origin is the default** — used when no valid override is present
3. **Keep list minimal** — fewer whitelisted origins = smaller attack surface
4. **Use environment variables** — don't hardcode sensitive origins

### ❌ Avoid

```typescript
// ❌ DON'T: Overly broad whitelisting
hostOrigin: [
  'https://app.com',
  'https://staging.app.com',
  'https://dev.app.com',
  'https://test.app.com',
  // ... many more origins
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
   - Production domain (first in array = default)
   - Staging/preview domains (available via `lc_host_override`)

2. **Convert to array:**
   ```typescript
   // Before
   hostOrigin: 'https://app.com'
   
   // After
   hostOrigin: ['https://app.com', 'https://staging.app.com']
   ```

3. **Order matters:**
   - Put primary/production origin first
   - First origin is used as the default active origin

4. **Test thoroughly:**
   - Verify default active origin works without override
   - Verify `lc_host_override` switches the active origin correctly
   - Verify invalid overrides are rejected

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

Origins are normalized to an array internally, but a single `activeHostOrigin` is determined at init:

```typescript
constructor(options?: PartnerConnectOptions) {
  const hostOrigin = options?.hostOrigin || 'https://learncard.app';
  this.hostOrigins = Array.isArray(hostOrigin) ? hostOrigin : [hostOrigin];
  // ...
  this.configureActiveOrigin(); // Determines single activeHostOrigin
}
```

### Whitelist Validation (for `lc_host_override`)

```typescript
private isOriginInWhitelist(origin: string): boolean {
  return (
    this.hostOrigins.includes(origin) ||
    (this.allowNativeAppOrigins && this.isOriginNativeApp(origin))
  );
}
```

### Message Validation (runtime)

```typescript
private isValidOrigin(eventOrigin: string): boolean {
  // STRICT: Only the single active origin
  return eventOrigin === this.activeHostOrigin;
}
```

### Message Sending

```typescript
private sendMessage<T>(action: string, payload?: unknown): Promise<T> {
  // Always sends to the single active origin
  window.parent.postMessage(message, this.activeHostOrigin);
}
```

## FAQ

**Q: Can I use wildcards like `*.example.com`?**  
A: No, only exact origin matching is supported for security.

**Q: Does the SDK accept messages from ALL configured origins?**  
A: No. Only the single `activeHostOrigin` (determined at initialization) is used for message validation. The origins array is a whitelist for `lc_host_override` only.

**Q: Can I change origins after initialization?**  
A: No, origins are set at construction and immutable. Create a new instance if needed.

**Q: What happens with an empty array?**  
A: Empty arrays are not recommended. The SDK falls back to `https://learncard.app`.

**Q: Do I need to include Capacitor origins in the array?**  
A: No, when `allowNativeAppOrigins` is `true` (default), Capacitor/localhost origins are automatically accepted as valid `lc_host_override` values.

**Q: How does the LearnCard host select which origin to use?**  
A: The LearnCard host sets `?lc_host_override=<origin>` on the partner app's iframe URL. The SDK validates this against the whitelist and uses it as the active origin.
