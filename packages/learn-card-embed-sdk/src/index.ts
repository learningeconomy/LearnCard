/*
  LearnCard Embed SDK (MVP V1)
  Exposes global LearnCard.init(...) when built as IIFE.
*/

/// <reference path="./ambient.d.ts" />

import islandScript from './iframe/island-vanilla.js';
import { createGlobalStyleEl, iframeCss } from './styles';
import { getTargetEl } from './dom';
import { createNonce } from './security';
import type { InitOptions, KnownMessages } from './types';

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

/* getTargetEl moved to dom.ts */

/* Styles moved to styles.ts */

function buildIframeHtml(opts: InitOptions, nonce: string, parentOrigin: string): string {
  const partnerLabel = (opts.partnerName || opts.partnerId).replace(/</g, '&lt;');
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
  brand.setAttribute('aria-label', `LearnCard × ${(opts.partnerName || opts.partnerId)}`);
  const logos = document.createElement('div');
  logos.className = 'lc-brand-logos';
  const brandText = document.createElement('span');
  brandText.textContent = `LearnCard × ${(opts.partnerName || opts.partnerId)}`;
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
    img.alt = (opts.partnerName || opts.partnerId);
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
    if (!isTrustedMessage(data, nonce)) return;
    const details = data.payload;
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
