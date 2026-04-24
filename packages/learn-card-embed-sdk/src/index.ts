/*
  LearnCard Embed SDK (MVP V1)
  Exposes global LearnCard.init(...) when built as IIFE.
*/

/// <reference path="./ambient.d.ts" />

import islandScript from './iframe/island-vanilla.js';
import { createGlobalStyleEl, iframeCss, DEFAULT_PRIMARY, DEFAULT_LOGO_URL, darkenHex } from './styles';
import { getTargetEl } from './dom';
import { createNonce } from './security';
import type { InitOptions, KnownMessages, EmailSubmitResult, OtpVerifyResult } from './types';

// Types moved to types.ts

// Trusted message check
function isTrustedMessage(data: unknown, expectedNonce: string): data is KnownMessages {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as any).__lcEmbed === true &&
    (data as any).type === 'lc-embed:complete' &&
    (data as any).nonce === expectedNonce
  );
}

function isTrustedMessageOfType(
  data: unknown,
  expectedNonce: string,
  type: string
): data is { __lcEmbed: true; type: string; nonce: string; payload?: unknown } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as any).__lcEmbed === true &&
    (data as any).type === type &&
    (data as any).nonce === expectedNonce
  );
}

/* getTargetEl moved to dom.ts */

/* Styles moved to styles.ts */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildIframeHtml(
  opts: InitOptions,
  nonce: string,
  parentOrigin: string,
  loggedInEmail?: string
): string {
  const partnerLabel = escapeHtml(opts.partnerName || 'Partner');
  const primary = (opts.branding?.primaryColor || opts.theme?.primaryColor || DEFAULT_PRIMARY);
  const accent = (opts.branding?.accentColor || darkenHex(primary, 0.2));
  const credName = escapeHtml(opts.credential?.name || 'Credential');
  const showConsent = !!opts.requestBackgroundIssuance;
  const csp = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

  const logoUrl = opts.branding?.logoUrl || DEFAULT_LOGO_URL;
  const issuerName = escapeHtml(opts.issuerName || '');
  const walletName = escapeHtml(opts.branding?.walletName || 'LearnCard');
  const cfg = {
    partnerLabel,
    partnerName: opts.partnerName || '',
    issuerName,
    credentialName: credName,
    showConsent,
    nonce,
    parentOrigin,
    logoUrl,
    walletName,
    ...(loggedInEmail ? { loggedInEmail } : {}),
  } as const;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <title>LearnCard Claim</title>
    <style>${iframeCss(primary, accent)}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>window.__LC_EMBED__ = ${JSON.stringify(cfg)};<\/script>
    <script>${islandScript}<\/script>
  </body>
</html>`;
}

function openModal(opts: InitOptions): { close: () => void } {
  const overlay = document.createElement('div');
  overlay.className = 'lc-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'lc-modal';

  const header = document.createElement('div');
  header.className = 'lc-modal-header';

  const brand = document.createElement('div');
  brand.className = 'lc-brand';

  // Left side: Issuer (logo/avatar + name). Falls back to LC logo if no issuerName provided.
  const issuerName = opts.issuerName || '';
  const issuerLogoUrl = opts.issuerLogoUrl;
  if (issuerName) {
    if (issuerLogoUrl) {
      const issuerImg = document.createElement('img');
      issuerImg.className = 'lc-issuer-logo';
      issuerImg.alt = issuerName;
      issuerImg.referrerPolicy = 'no-referrer';
      issuerImg.decoding = 'async';
      issuerImg.src = issuerLogoUrl;
      brand.appendChild(issuerImg);
    } else {
      const avatar = document.createElement('span');
      avatar.className = 'lc-issuer-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = issuerName.charAt(0).toUpperCase();
      brand.appendChild(avatar);
    }
    const issuerText = document.createElement('span');
    issuerText.className = 'lc-issuer-name';
    issuerText.textContent = issuerName;
    brand.appendChild(issuerText);
  } else {
    // Fallback: LC logo
    const lcLogoUrl = opts.branding?.logoUrl || DEFAULT_LOGO_URL;
    const lcImg = document.createElement('img');
    lcImg.alt = 'LearnCard';
    lcImg.referrerPolicy = 'no-referrer';
    lcImg.decoding = 'async';
    lcImg.src = lcLogoUrl;
    brand.appendChild(lcImg);
  }

  // Separator + Partner (only shown if partnerName or partnerLogoUrl is set)
  const partnerLogoUrl = opts.branding?.partnerLogoUrl;
  const partnerName = opts.partnerName || '';
  if (partnerName || partnerLogoUrl) {
    const sep = document.createElement('span');
    sep.className = 'lc-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '\u00d7';
    brand.appendChild(sep);

    if (partnerLogoUrl) {
      const pImg = document.createElement('img');
      pImg.className = 'lc-partner-logo';
      pImg.alt = partnerName || 'Partner';
      pImg.referrerPolicy = 'no-referrer';
      pImg.decoding = 'async';
      pImg.src = partnerLogoUrl;
      brand.appendChild(pImg);
    }
    if (partnerName) {
      const pText = document.createElement('span');
      pText.className = 'lc-partner-name';
      pText.textContent = partnerName;
      brand.appendChild(pText);
    }
  }

  brand.setAttribute('aria-label', `${issuerName || 'LearnCard'} \u00d7 ${partnerName || 'Partner'}`);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lc-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';

  const iframe = document.createElement('iframe');
  iframe.className = 'lc-iframe';
  // Harden sandbox: no same-origin, no top-nav, only scripts
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  const nonce = createNonce();
  const parentOrigin = window.location.origin;
  // Local session persistence helpers
  const storageKey = `lcEmbed:v1:${opts.publishableKey || 'anon'}`;
  function getStoredSession(): { email: string; jwt: string } | null {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.jwt === 'string' && typeof parsed.email === 'string') return parsed;
      return null;
    } catch {
      return null;
    }
  }
  function setStoredSession(email: string, jwt: string) {
    try { localStorage.setItem(storageKey, JSON.stringify({ email, jwt })); } catch {}
  }
  function clearStoredSession() {
    try { localStorage.removeItem(storageKey); } catch {}
  }

  const stored = getStoredSession();
  iframe.srcdoc = buildIframeHtml(opts, nonce, parentOrigin, stored?.email);

  function sendToIframe(type: string, payload: unknown) {
    try {
      iframe.contentWindow?.postMessage({ __lcEmbed: true, type, nonce, payload }, '*');
    } catch {}
  }

  // Default network-backed handlers for email submit and OTP verify
  // Use provided apiBaseUrl + publishableKey if available, otherwise fall back to stubbed success.
  const apiBase = (opts.apiBaseUrl ?? 'https://network.learncard.com/api').replace(/\/$/, '');
  let sessionJwt: string | null = stored?.jwt || null;

  // Map technical/internal error codes to user-friendly messages
  function friendlyError(raw: string, fallback: string): string {
    const normalized = raw.toUpperCase().replace(/[\s_-]+/g, '_');
    const map: Record<string, string> = {
      NOT_FOUND: 'This integration could not be found. Please check your configuration.',
      UNAUTHORIZED: 'Authorization failed. Please check your publishable key.',
      FORBIDDEN: 'Access denied. Please check your permissions.',
      RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
      INVALID_EMAIL: 'Please enter a valid email address.',
      INVALID_CODE: 'The code you entered is incorrect. Please try again.',
      EXPIRED: 'This code has expired. Please request a new one.',
      INTERNAL_SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    };
    return map[normalized] || (/^[A-Z_]+$/.test(raw) ? fallback : raw);
  }

  async function defaultEmailSubmit(email: string): Promise<EmailSubmitResult> {
    // If publishableKey is missing, preserve no-op behavior for backwards compatibility and tests
    if (!opts.publishableKey) return { ok: true };

    try {
      const res = await fetch(`${apiBase}/contact-methods/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          value: email,
          configuration: { publishableKey: opts.publishableKey },
        }),
      });

      if (!res.ok) {
        let message = 'Unable to send verification code. Please try again.';
        try {
          const j = await res.json();
          if (j?.message) message = friendlyError(j.message, message);
        } catch {}
        return { ok: false, error: message };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Unable to reach the server. Please check your connection and try again.' };
    }
  }

  async function defaultOtpVerify(email: string, code: string): Promise<OtpVerifyResult> {
    // If publishableKey is missing, preserve no-op behavior for backwards compatibility and tests
    if (!opts.publishableKey) return { ok: true };

    try {
      // 1) Verify OTP to get session JWT
      const verifyRes = await fetch(`${apiBase}/contact-methods/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactMethod: { type: 'email', value: email },
          otpChallenge: code,
        }),
      });

      if (!verifyRes.ok) {
        let message = 'Verification failed. Please try again.';
        try {
          const j = await verifyRes.json();
          if (j?.message) message = friendlyError(j.message, message);
        } catch {}
        return { ok: false, error: message };
      }

      const verifyJson = await verifyRes.json() as { sessionJwt?: string };
      if (!verifyJson?.sessionJwt || typeof verifyJson.sessionJwt !== 'string') {
        return { ok: false, error: 'Something went wrong. Please try again.' };
      }
      sessionJwt = verifyJson.sessionJwt;
      setStoredSession(email, sessionJwt);

      // 2) Perform authenticated claim request
      const claimRes = await fetch(`${apiBase}/inbox/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionJwt}` },
        body: JSON.stringify({
          credential: (opts.credential as any).credential ?? (opts.credential as any).obv3Template ?? opts.credential,
          configuration: { publishableKey: opts.publishableKey },
        }),
      });

      if (!claimRes.ok) {
        let message = 'Unable to claim credential. Please try again.';
        try {
          const j = await claimRes.json();
          if (j?.message) message = friendlyError(j.message, message);
        } catch {}
        return { ok: false, error: message };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Unable to reach the server. Please check your connection and try again.' };
    }
  }

  header.appendChild(brand);
  header.appendChild(closeBtn);
  modal.appendChild(header);
  modal.appendChild(iframe);
  overlay.appendChild(modal);

  function onBackdropClick(e: MouseEvent) {
    if (e.target === overlay) close();
  }

  function close() {
    window.removeEventListener('message', onMessage);
    overlay.removeEventListener('click', onBackdropClick);
    document.body.removeChild(overlay);
  }

  function onMessage(ev: MessageEvent) {
    // In real browsers, ev.source will be the iframe's contentWindow. In jsdom, iframe.contentWindow is null
    // and ev.source may be null. Only enforce strict equality when both values are available.
    if (iframe.contentWindow && ev.source && ev.source !== iframe.contentWindow) return;
    const data = ev.data;

    // Handle interim requests from iframe
    if (isTrustedMessageOfType(data, nonce, 'lc-embed:email-submit')) {
      const email = (data as any).payload?.email as string | undefined;
      const cb = opts.onEmailSubmit;
      const p: Promise<EmailSubmitResult> = Promise.resolve(
        cb ? cb(email || '') : defaultEmailSubmit(email || '')
      ) as Promise<EmailSubmitResult>;
      p.then(res => sendToIframe('lc-embed:email-submit:result', res))
       .catch(() => sendToIframe('lc-embed:email-submit:result', { ok: false, error: 'Unable to send code. Please try again.' }));
      return;
    }

    if (isTrustedMessageOfType(data, nonce, 'lc-embed:otp-verify')) {
      const email = (data as any).payload?.email as string | undefined;
      const code = (data as any).payload?.code as string | undefined;
      const cb = opts.onOtpVerify;
      const p: Promise<OtpVerifyResult> = Promise.resolve(
        cb ? cb(email || '', code || '') : defaultOtpVerify(email || '', code || '')
      ) as Promise<OtpVerifyResult>;
      p.then(res => sendToIframe('lc-embed:otp-verify:result', res))
       .catch(() => sendToIframe('lc-embed:otp-verify:result', { ok: false, error: 'Verification failed. Please try again.' }));
      return;
    }

    // Accept (already-logged-in) flow
    if (isTrustedMessageOfType(data, nonce, 'lc-embed:accept')) {
      const p: Promise<OtpVerifyResult> = (async () => {
        if (!opts.publishableKey) return { ok: false, error: 'Configuration error. Please contact support.' };
        if (!sessionJwt) return { ok: false, error: 'Your session has expired. Please log in again.' };

        try {
          const claimRes = await fetch(`${apiBase}/inbox/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionJwt}` },
            body: JSON.stringify({
              credential: (opts.credential as any).credential ?? (opts.credential as any).obv3Template ?? opts.credential,
              configuration: { publishableKey: opts.publishableKey },
            }),
          });

          if (!claimRes.ok) {
            let message = 'Unable to claim credential. Please try again.';
            try {
              const j = await claimRes.json();
              if (j?.message) message = friendlyError(j.message, message);
            } catch {}
            if (claimRes.status === 401) message = 'Your session has expired. Please log in again.';
            return { ok: false, error: message };
          }

          return { ok: true };
        } catch {
          return { ok: false, error: 'Unable to reach the server. Please check your connection and try again.' };
        }
      })();

      p.then(res => sendToIframe('lc-embed:accept:result', res))
       .catch(() => sendToIframe('lc-embed:accept:result', { ok: false, error: 'Unable to claim credential. Please try again.' }));
      return;
    }

    // Logout request
    if (isTrustedMessageOfType(data, nonce, 'lc-embed:logout')) {
      clearStoredSession();
      sessionJwt = null;
      sendToIframe('lc-embed:logout:result', { ok: true });
      return;
    }

    // Completion
    if (!isTrustedMessage(data, nonce)) return;
    const details = (data as any).payload;
    const baseWalletUrl = opts.branding?.walletUrl ?? 'https://learncard.app';
    const handoffUrl = baseWalletUrl && sessionJwt
      ? `${baseWalletUrl.replace(/\/$/, '')}/auth/handoff?token=${encodeURIComponent(sessionJwt)}`
      : baseWalletUrl || undefined;
    if (opts.onSuccess) {
      try { opts.onSuccess({ ...details, handoffUrl }); } catch {}
    }
    // Always open wallet unless walletUrl was explicitly set to empty string
    if (handoffUrl) {
      window.open(handoffUrl, '_blank', 'noopener,noreferrer');
    }
    close();
  }

  overlay.addEventListener('click', onBackdropClick);
  closeBtn.addEventListener('click', () => close());
  window.addEventListener('message', onMessage);

  document.body.appendChild(overlay);

  return { close };
}

function ensureGlobalStyles(opts: InitOptions) {
  const existing = document.querySelector('style[data-learncard-embed]');
  if (existing) existing.remove(); // Always recreate so branding changes are reflected
  const style = createGlobalStyleEl(opts.branding?.primaryColor || opts.theme?.primaryColor, opts.branding?.accentColor);
  document.head.appendChild(style);
}

function mountButton(opts: InitOptions) {
  const target = getTargetEl(opts.target);
  ensureGlobalStyles(opts);

  // Clear target and add button
  const btn = document.createElement('button');
  btn.className = 'lc-claim-btn';
  btn.type = 'button';
  btn.textContent = `Claim “${opts.credential.name}”`;
  let isOpen = false;

  btn.addEventListener('click', () => {
    if (isOpen) return;
    isOpen = true;
    const { close } = openModal(opts);
    const reset = () => { isOpen = false; document.removeEventListener('keydown', onEsc); };
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') { close(); reset(); } }
    document.addEventListener('keydown', onEsc);
    // When modal closes, reset
    const observer = new MutationObserver(() => {
      const present = document.body.contains(document.querySelector('.lc-modal-overlay'));
      if (!present) { reset(); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Replace target contents
  target.innerHTML = '';
  target.appendChild(btn);
}

export function init(options: InitOptions): void {
  mountButton(options);
}

// Attach to window when built as IIFE
declare global {
  interface Window { LearnCard?: { init: (options: InitOptions) => void } }
}

if (typeof window !== 'undefined') {
  // Lazily define to avoid overwriting if multiple scripts included
  window.LearnCard = window.LearnCard || { init };
}
