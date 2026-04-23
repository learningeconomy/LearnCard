/*
  LearnCard Badge Claim — one-line embed.

  Usage (partner HTML):

      <!-- Partner hosts their badge JSON (signed or unsigned) and points -->
      <!-- data-src at the public HTTPS URL. Required.                     -->
      <script src="https://embed.learncard.com/badge-claim.js" async
              data-src="https://partner.com/badges/accountability.json"
              data-mode="both"></script>

      <!-- Optional: mount into an existing element instead of auto-placing -->
      <div id="my-badge"></div>
      <script src="https://embed.learncard.com/badge-claim.js" async
              data-src="https://partner.com/badges/x.json"
              data-target="#my-badge"></script>

  The script turns the partner-hosted JSON URL into a wallet-claimable link
  via the single `/interactions/inline/<payload>?iuv=1` VC-API workflow on
  `data-host` (default: https://learncard.app). The server auto-detects URL
  vs inline JSON, and signed vs unsigned VCs — partners only pick `data-src`.
*/

import QRCode from 'qrcode';

type Mode = 'button' | 'qr' | 'both';

interface BadgeClaimConfig {
    host: string;
    src: string;
    mode: Mode;
    label: string;
    target?: string;
}

const DEFAULT_HOST = 'https://learncard.app';
const DEFAULT_LABEL = 'Claim Credential';

// Interaction URL Version. Per VCALM §Interaction URL Format, interaction URLs
// MUST contain an `iuv` query parameter whose value is `1` for this version of
// the spec. Wallets use this to recognize the URL as a VC-API interaction
// bootstrap point. See https://w3c.github.io/vcalm/#initiating-interactions.
const INTERACTION_URL_VERSION = '1';

// Single workflow id. The server decodes the payload and auto-detects URL vs
// inline JSON, signed vs unsigned.
const WORKFLOW_ID = 'inline';

function readConfig(scriptEl: HTMLScriptElement): BadgeClaimConfig | null {
    const src = scriptEl.dataset.src?.trim();

    if (!src) {
        console.warn('[learncard-badge-claim] data-src is required; skipping.');
        return null;
    }

    const modeRaw = (scriptEl.dataset.mode ?? 'both').toLowerCase();
    const mode: Mode =
        modeRaw === 'button' || modeRaw === 'qr' || modeRaw === 'both'
            ? (modeRaw as Mode)
            : 'both';

    return {
        host: (scriptEl.dataset.host?.trim() || DEFAULT_HOST).replace(/\/$/, ''),
        src,
        mode,
        label: scriptEl.dataset.label?.trim() || DEFAULT_LABEL,
        target: scriptEl.dataset.target?.trim() || undefined,
    };
}

/** URL-safe base64 for browser (`btoa` produces standard base64). */
function base64urlEncode(input: string): string {
    // Use TextEncoder so we handle Unicode cleanly.
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Read the presenting origin (the site the SDK is embedded on). Server-side
 * rendering or test environments without `window.location` return `undefined`,
 * which the server treats as "no presenting signal" and falls back to the
 * fetch origin alone.
 */
function readPresentingOrigin(): string | undefined {
    try {
        if (typeof window === 'undefined') return undefined;
        const origin = window.location?.origin;
        if (!origin || origin === 'null') return undefined;
        // Only surface http(s) origins. File URLs, `about:blank`, extension
        // contexts, etc. wouldn't reconcile against a fetch origin anyway.
        if (!/^https?:/i.test(origin)) return undefined;
        return origin;
    } catch {
        return undefined;
    }
}

/**
 * Absolutize a partner-supplied `data-src`. Partners may paste either a full
 * URL (`https://partner.com/badges/x.json`) or a site-relative path
 * (`/badges/x.json`). Brain-service's fetch path requires an absolute URL, so
 * we resolve relative values against the embedding page's location.
 *
 * `new URL(absolute, base)` returns the absolute value verbatim, so this is
 * a safe no-op when the partner already provided a full URL.
 */
function resolveSrc(src: string): string {
    if (typeof window === 'undefined') return src;
    const base = window.location?.href;
    if (!base) return src;
    try {
        return new URL(src, base).toString();
    } catch {
        // Malformed src — hand back as-is and let the server reject it with
        // a meaningful error rather than silently rewriting to nonsense.
        return src;
    }
}

/**
 * Build the inline-src envelope `{v:1, url, presenting?}`. The server uses
 * the presenting origin, if reconcilable against the fetch origin via eTLD+1,
 * to promote the verified domain in the issued credential (e.g. collapse
 * `storage.myapp.com` + `myapp.com` into a single `myapp.com` identity).
 */
function buildClaimUrl(
    cfg: BadgeClaimConfig,
    presenting: string | undefined = readPresentingOrigin()
): { url: string; workflowId: string } {
    const envelope: { v: 1; url: string; presenting?: string } = {
        v: 1,
        url: resolveSrc(cfg.src),
        ...(presenting ? { presenting } : {}),
    };
    const id = base64urlEncode(JSON.stringify(envelope));
    const url = `${cfg.host}/interactions/${WORKFLOW_ID}/${id}?iuv=${INTERACTION_URL_VERSION}`;
    return { url, workflowId: WORKFLOW_ID };
}

function injectBaseStyles(): void {
    if (document.getElementById('learncard-badge-claim-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'learncard-badge-claim-styles';
    styleEl.textContent = `
        .lc-badge-claim {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        .lc-badge-claim__button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 20px;
            background: #18224E;
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            border: none;
            cursor: pointer;
            transition: opacity 0.15s ease;
        }
        .lc-badge-claim__button:hover { opacity: 0.9; }
        .lc-badge-claim__qr {
            padding: 8px;
            background: #fff;
            border: 1px solid #E2E3E9;
            border-radius: 12px;
            line-height: 0;
        }
        .lc-badge-claim__qr img { display: block; width: 180px; height: 180px; }
        .lc-badge-claim__hint {
            font-size: 12px;
            color: #6F7590;
            margin: 0;
        }
    `;
    document.head.appendChild(styleEl);
}

function mountContainer(scriptEl: HTMLScriptElement, target?: string): HTMLElement {
    if (target) {
        const el = document.querySelector<HTMLElement>(target);
        if (el) return el;
        console.warn(`[learncard-badge-claim] target "${target}" not found; auto-placing instead.`);
    }
    const container = document.createElement('div');
    scriptEl.parentNode?.insertBefore(container, scriptEl);
    return container;
}

async function renderQR(containerEl: HTMLElement, url: string): Promise<void> {
    try {
        const dataUrl = await QRCode.toDataURL(url, {
            margin: 1,
            width: 360,
            errorCorrectionLevel: 'M',
        });
        const img = document.createElement('img');
        img.alt = 'Scan to claim with wallet';
        img.src = dataUrl;
        const wrap = document.createElement('div');
        wrap.className = 'lc-badge-claim__qr';
        wrap.appendChild(img);
        containerEl.appendChild(wrap);
    } catch (err) {
        console.error('[learncard-badge-claim] QR generation failed:', err);
    }
}

function renderButton(containerEl: HTMLElement, url: string, label: string): void {
    const a = document.createElement('a');
    a.className = 'lc-badge-claim__button';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = label;
    containerEl.appendChild(a);
}

function render(
    scriptEl: HTMLScriptElement,
    cfg: BadgeClaimConfig,
    claim: { url: string; workflowId: string }
): void {
    injectBaseStyles();

    const host = mountContainer(scriptEl, cfg.target);
    const root = document.createElement('div');
    root.className = 'lc-badge-claim';
    root.dataset.workflowId = claim.workflowId;
    // Expose the generated claim URL on the container so host pages (and tests)
    // can inspect it even in `mode=qr` where no <a> button is rendered.
    root.dataset.claimUrl = claim.url;
    host.appendChild(root);

    if (cfg.mode === 'button' || cfg.mode === 'both') {
        renderButton(root, claim.url, cfg.label);
    }
    if (cfg.mode === 'qr' || cfg.mode === 'both') {
        void renderQR(root, claim.url);
        if (cfg.mode === 'qr') {
            const hint = document.createElement('p');
            hint.className = 'lc-badge-claim__hint';
            hint.textContent = 'Scan with a compatible wallet';
            root.appendChild(hint);
        }
    }
}

function boot(): void {
    const scriptEl = document.currentScript as HTMLScriptElement | null;
    if (!scriptEl) {
        console.warn('[learncard-badge-claim] document.currentScript unavailable; skipping.');
        return;
    }

    const cfg = readConfig(scriptEl);
    if (!cfg) return;

    const run = () => {
        const claim = buildClaimUrl(cfg);
        render(scriptEl, cfg, claim);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        run();
    }
}

boot();

// Named export for programmatic use (e.g. testing).
export { buildClaimUrl, base64urlEncode };
export type { BadgeClaimConfig, Mode };
