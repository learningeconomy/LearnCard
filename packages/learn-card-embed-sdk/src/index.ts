/*
  LearnCard Embed SDK (MVP V1)
  Exposes global LearnCard.init(...) when built as IIFE.
*/

/// <reference path="./ambient.d.ts" />

import islandScript from './iframe/island-vanilla.js';
import { createGlobalStyleEl, iframeCss } from './styles';
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

function buildIframeHtml(opts: InitOptions, nonce: string, parentOrigin: string): string {
  const partnerLabel = (opts.partnerName || 'Partner').replace(/</g, '&lt;');
  const primary = (opts.branding?.primaryColor || opts.theme?.primaryColor || '#1F51FF');
  const accent = (opts.branding?.accentColor || '#0F3BD9');
  const credName = (opts.credential?.name || 'Credential').replace(/</g, '&lt;');
  const showConsent = !!opts.requestBackgroundIssuance;
  const csp = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'";

  const cfg = {
    partnerLabel,
    credentialName: credName,
    showConsent,
    nonce,
    parentOrigin,
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
  brand.setAttribute('aria-label', `LearnCard × ${(opts.partnerName || 'Partner')}`);
  const logos = document.createElement('div');
  logos.className = 'lc-brand-logos';
  const brandText = document.createElement('span');
  brandText.textContent = `LearnCard × ${(opts.partnerName || 'Partner')}`;
  const lcLogoUrl = opts.branding?.logoUrl;
  const partnerLogoUrl = opts.branding?.partnerLogoUrl;
  if (lcLogoUrl) {
    const img = document.createElement('img');
    img.alt = 'LearnCard';
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.src = lcLogoUrl;
    logos.appendChild(img);
  }
  if (partnerLogoUrl) {
    const img = document.createElement('img');
    img.alt = (opts.partnerName || 'Partner');
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.src = partnerLogoUrl;
    logos.appendChild(img);
  }
  brand.appendChild(logos);
  brand.appendChild(brandText);

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
  iframe.srcdoc = buildIframeHtml(opts, nonce, parentOrigin);

  function sendToIframe(type: string, payload: unknown) {
    try {
      iframe.contentWindow?.postMessage({ __lcEmbed: true, type, nonce, payload }, '*');
    } catch {}
  }

  // Default network-backed handlers for email submit and OTP verify
  // Use provided apiBaseUrl + publishableKey if available, otherwise fall back to stubbed success.
  const apiBase = (opts.apiBaseUrl ?? 'https://network.learncard.com/api').replace(/\/$/, '');
  let sessionJwt: string | null = null;

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
        // Try to parse a message if available
        let message = 'Failed to send code';
        try { const j = await res.json(); if (j?.message) message = j.message; } catch {}
        return { ok: false, error: message };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error while sending code' };
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
        let message = 'Verification failed';
        try { const j = await verifyRes.json(); if (j?.message) message = j.message; } catch {}
        return { ok: false, error: message };
      }

      const verifyJson = await verifyRes.json() as { sessionJwt?: string };
      if (!verifyJson?.sessionJwt || typeof verifyJson.sessionJwt !== 'string') {
        return { ok: false, error: 'Invalid session response' };
      }
      sessionJwt = verifyJson.sessionJwt;

      // 2) Perform authenticated claim request
      const claimRes = await fetch(`${apiBase}/inbox/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionJwt}`,
        },
        body: JSON.stringify({
          credential: opts.credential,
          configuration: { publishableKey: opts.publishableKey },
        }),
      });

      if (!claimRes.ok) {
        let message = 'Failed to claim credential';
        try { const j = await claimRes.json(); if (j?.message) message = j.message; } catch {}
        return { ok: false, error: message };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error during verification' };
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
       .catch(() => sendToIframe('lc-embed:email-submit:result', { ok: false, error: 'Failed to send code' }));
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
       .catch(() => sendToIframe('lc-embed:otp-verify:result', { ok: false, error: 'Verification failed' }));
      return;
    }

    // Completion
    if (!isTrustedMessage(data, nonce)) return;
    const details = (data as any).payload;
    const walletUrl = opts.branding?.walletUrl || 'https://learncard.app';
    window.open(walletUrl, '_blank', 'noopener,noreferrer');
    if (opts.onSuccess) {
      try { opts.onSuccess(details); } catch {}
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
  if (existing) return;
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
