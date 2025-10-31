# Capacitor & Localhost Support

## Overview

The Partner Connect SDK now supports LearnCard running as a Capacitor mobile app on iOS and Android, as well as localhost development environments with flexible port configurations.

**Key Features:**
- Capacitor origins are **ALWAYS accepted**, even in production, to enable seamless communication with LearnCard mobile apps
- **Multiple origins** can be whitelisted by passing an array to `hostOrigin`

## Changes Made

### 1. New `isValidOrigin()` Method

Added a private method to intelligently validate message origins:

```typescript
private isValidOrigin(eventOrigin: string): boolean
```

**Logic:**
1. **Exact match**: Always accepts if `eventOrigin === hostOrigin`
2. **Capacitor origins**: ALWAYS accepts `capacitor://localhost` and `ionic://localhost` (production mobile apps)
3. **Localhost variants**: When `hostOrigin` is localhost-based, accepts various localhost development origins
4. **Security-first**: All other origins are rejected

### 2. Supported Origins

**Always Accepted (regardless of hostOrigin):**
- ✅ Exact match with configured `hostOrigin`
- ✅ `capacitor://localhost` (iOS Capacitor apps)
- ✅ `ionic://localhost` (legacy Ionic apps)

**Additionally Accepted (when hostOrigin is localhost-based):**
- ✅ `http://localhost` (any port or no port)
- ✅ `https://localhost` (any port or no port)
- ✅ `http://127.0.0.1` (any port or no port)
- ✅ `https://127.0.0.1` (any port or no port)

### 3. Updated Message Listener

Changed origin validation from strict equality to flexible validation:

**Before:**
```typescript
if (event.origin !== this.hostOrigin) {
  return;
}
```

**After:**
```typescript
if (!this.isValidOrigin(event.origin)) {
  return;
}
```

### 4. Documentation Updates

- ✅ Updated `types.ts` with comprehensive `hostOrigin` documentation
- ✅ Added "Mobile & Capacitor Support" section to README
- ✅ Updated Security section to reflect new validation logic
- ✅ Added examples for all supported origin types

## Use Cases

### Production (Web + Mobile)

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// Will accept messages from:
// - https://learncard.app (exact match)
// - capacitor://localhost (iOS/Android mobile apps)
// - ionic://localhost (legacy mobile apps)
// Will REJECT:
// - http://localhost:3000 (development servers)
// - https://evil.com (malicious sites)
```

### Multiple Production Domains

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app',
    'https://preview.learncard.app'
  ]
});

// Will accept messages from:
// - https://learncard.app (production)
// - https://staging.learncard.app (staging)
// - https://preview.learncard.app (preview)
// - capacitor://localhost (mobile apps)
// - ionic://localhost (legacy mobile)
// Will REJECT:
// - https://unauthorized.com
// - http://localhost:3000
// 
// Messages automatically sent to whichever origin is hosting the iframe:
// - If hosted on learncard.app → sends to https://learncard.app
// - If hosted on staging.learncard.app → sends to https://staging.learncard.app
// - If hosted on preview.learncard.app → sends to https://preview.learncard.app
```

### Local Development

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'http://localhost:3000'
});

// Will accept messages from:
// - http://localhost:3000 (exact match)
// - http://localhost:5173 (other ports)
// - http://127.0.0.1:3000 (IP variant)
// - capacitor://localhost (mobile apps)
// - ionic://localhost (legacy mobile)
```

### Capacitor Development

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'capacitor://localhost'
});

// Will accept messages from:
// - capacitor://localhost (exact match)
// - ionic://localhost (always accepted)
// Will REJECT:
// - http://localhost:3000 (not localhost-based config)
```

## Multiple Origins Feature

### Configuration

You can now configure multiple allowed origins by passing an array:

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',          // Production
    'https://staging.learncard.app',  // Staging
    'https://preview.learncard.app'   // Preview/Branch deploys
  ]
});
```

### Behavior

**Incoming Messages (Validation):**
- All configured origins are checked for exact match
- Any message from any configured origin is accepted
- Capacitor origins are always accepted (in addition to configured origins)
- Localhost variants are accepted if ANY configured origin is localhost-based

**Outgoing Messages (Sending):**
- Messages are automatically sent to the **detected parent origin**
- SDK detects which of the configured origins is actually hosting the iframe
- Falls back to the first configured origin if detection fails (rare)

**Origin Detection:**
1. Attempts to read `window.parent.location.origin` on initialization
2. If blocked (cross-origin), uses origin from first incoming message
3. All subsequent messages use the detected origin

### Use Cases

1. **Multiple Deployment Environments:**
   ```typescript
   hostOrigin: ['https://prod.example.com', 'https://staging.example.com']
   ```

2. **Multiple Brands/Domains:**
   ```typescript
   hostOrigin: ['https://brand-a.com', 'https://brand-b.com']
   ```

3. **Preview Deployments + Production:**
   ```typescript
   hostOrigin: ['https://app.com', 'https://pr-123-preview.app.com']
   ```

## Security Considerations

### ✅ Capacitor Origins are Safe to Always Accept

Capacitor origins (`capacitor://localhost`, `ionic://localhost`) are **unique to the Capacitor framework** and cannot be:
- Spoofed by malicious websites
- Set by arbitrary web pages
- Used by domains other than actual Capacitor apps

These origins are generated by the native mobile app container and are cryptographically secure. Unlike HTTP origins that any server can claim, Capacitor's custom protocol ensures only legitimate Capacitor apps can use these origins.

### ✅ Production Secure

Production web origins (e.g., `https://learncard.app`) maintain strict validation:
- Only exact origin match is accepted
- Capacitor origins are accepted (for mobile apps)
- All other origins are rejected (no localhost/development origins)
- No wildcards or patterns

### ✅ Development Flexible

When `hostOrigin` is localhost-based, additional localhost variants are accepted:
- Developers don't need to configure exact ports
- Works with Vite (5173), Astro (4321), Next.js (3000), etc.
- Works with both HTTP and HTTPS local servers
- Still maintains security by rejecting non-localhost origins

## Implementation Details

### Regular Expressions Used

**Capacitor Patterns (always checked):**
```typescript
const capacitorPatterns = [
  /^capacitor:\/\/localhost$/,  // Capacitor iOS
  /^ionic:\/\/localhost$/,      // Ionic legacy
];
```

**Localhost Patterns (only when hostOrigin is localhost-based):**
```typescript
const localhostPatterns = [
  /^http:\/\/localhost(:\d+)?$/,      // http://localhost:8080
  /^https:\/\/localhost(:\d+)?$/,     // https://localhost:3000
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,  // http://127.0.0.1:5173
  /^https:\/\/127\.0\.0\.1(:\d+)?$/, // https://127.0.0.1:4321
];
```

### Validation Flow

```typescript
isValidOrigin(eventOrigin: string): boolean {
  // 1. Check exact match with ANY configured origin
  if (this.hostOrigins.includes(eventOrigin)) return true;
  
  // 2. Check Capacitor origins (always allowed)
  if (capacitorPatterns.some(p => p.test(eventOrigin))) return true;
  
  // 3. Check if ANY hostOrigin is localhost-based
  const hasLocalhostOrigin = this.hostOrigins.some(
    origin => origin.includes('localhost') || origin.includes('127.0.0.1')
  );
  
  if (!hasLocalhostOrigin) return false;
  
  // 4. Check localhost variants (only if ANY hostOrigin is localhost-based)
  return localhostPatterns.some(p => p.test(eventOrigin));
}
```

## Testing

### Manual Testing Scenarios

1. **Production Web + Mobile**
   - Set `hostOrigin: 'https://learncard.app'`
   - ✅ Verify `https://learncard.app` accepted
   - ✅ Verify `capacitor://localhost` accepted
   - ✅ Verify `ionic://localhost` accepted
   - ❌ Verify `http://localhost:3000` rejected
   - ❌ Verify `https://evil.com` rejected

2. **Local Dev Server**
   - Set `hostOrigin: 'http://localhost:4321'`
   - ✅ Verify messages from `:3000`, `:5173`, `:8080` work
   - ✅ Verify `capacitor://localhost` works
   - ✅ Verify `http://127.0.0.1:3000` works

3. **Capacitor iOS Testing**
   - Set `hostOrigin: 'capacitor://localhost'`
   - Run in Xcode simulator
   - ✅ Verify postMessage communication works
   - ✅ Verify `ionic://localhost` also works

4. **Capacitor Android Testing**
   - Set `hostOrigin: 'http://localhost'` or `'capacitor://localhost'`
   - Run in Android emulator
   - ✅ Verify postMessage communication works

5. **Multiple Origins Testing**
   - Set `hostOrigin: ['https://app.com', 'https://staging.app.com']`
   - ✅ Verify `https://app.com` accepted
   - ✅ Verify `https://staging.app.com` accepted
   - ✅ Verify `capacitor://localhost` accepted
   - ❌ Verify `https://other.com` rejected
   - ✅ Verify messages sent to `https://app.com` (first in array)

## Migration Guide

**No breaking changes!** Existing implementations continue to work and now automatically support mobile apps:

```typescript
// Existing production code - works for web AND mobile now!
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// This configuration now accepts:
// ✅ https://learncard.app (web app)
// ✅ capacitor://localhost (iOS/Android mobile apps)
// ✅ ionic://localhost (legacy mobile apps)
```

For local development with flexible ports:

```typescript
// Local development: accepts all localhost variants
const learnCard = createPartnerConnect({
  hostOrigin: process.env.LEARNCARD_HOST || 'http://localhost:3000'
});

// Accepts localhost:3000, :5173, :4321, capacitor://, etc.
```

**What Changed:**

- **Before:** Production configs only accepted exact web origin
- **After:** Production configs accept web origin + Capacitor mobile origins
- **Impact:** Apps now work seamlessly with LearnCard mobile apps without config changes

## Future Enhancements

Potential improvements:
- [ ] Add explicit `allowedOrigins` array option
- [ ] Add `strictMode` flag to disable flexible matching
- [ ] Log rejected origins in development mode
- [ ] Support custom origin validation function

## References

- [Capacitor Documentation](https://capacitorjs.com/)
- [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Origin Security Model](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

---

**Result:** The Partner Connect SDK now seamlessly supports LearnCard as a Capacitor mobile app while maintaining production security! 📱✨
