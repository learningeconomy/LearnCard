/* Styles helpers for LearnCard Embed SDK */

/** Parse 6-digit hex to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Lerp each RGB channel toward 255 by `amount` (0–1). Returns 6-digit hex. */
export function lightenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return '#' + [lr, lg, lb].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Darken a hex color by `amount` (0–1). */
export function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return '#' + [dr, dg, db].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Convert hex to `r, g, b` string for use in rgba(). */
export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export const DEFAULT_PRIMARY = '#2EC4A5';
export const DEFAULT_LOGO_URL = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

export function createGlobalStyleEl(primary?: string, accent?: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('data-learncard-embed', '');
  const p = (primary || DEFAULT_PRIMARY).replace(/"/g, '');
  const a = (accent || darkenHex(p, 0.2)).replace(/"/g, '');
  const rgb = hexToRgbString(p);
  style.textContent = `
    :root { --lc-primary: ${p}; --lc-accent: ${a}; --lc-primary-rgb: ${rgb}; }
    .lc-claim-btn {
      appearance: none; border: 0; cursor: pointer;
      padding: 12px 14px; border-radius: 10px; font-weight: 600; font-size: 14px;
      background: var(--lc-primary); color: white;
      box-shadow: 0 4px 14px rgba(${rgb}, 0.25);
      transition: transform 150ms, box-shadow 150ms;
    }
    .lc-claim-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(${rgb}, 0.35); }
    .lc-claim-btn:active { transform: translateY(0); }

    .lc-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      z-index: 2147483000; display: flex; align-items: center; justify-content: center;
    }
    .lc-modal {
      width: 100%; max-width: 420px; background: #fff; border-radius: 16px;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
      animation: lcModalIn 250ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes lcModalIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .lc-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: #fff; border-bottom: 1px solid #f0f0f0;
    }
    .lc-brand {
      display: flex; align-items: center; gap: 10px;
      font-weight: 600; font-size: 14px; color: #374151;
    }
    .lc-brand img { height: 26px; width: auto; border-radius: 5px; display: block; }
    .lc-brand .lc-sep { color: #d1d5db; font-size: 13px; font-weight: 400; }
    .lc-brand .lc-partner-logo { height: 26px; width: auto; border-radius: 5px; display: block; }
    .lc-brand .lc-partner-name { font-weight: 600; font-size: 14px; color: #374151; }
    .lc-close {
      background: #f5f5f5; border: none; color: #9ca3af; font-size: 14px;
      cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;
    }
    .lc-close:hover { background: #ebebeb; }
    .lc-iframe { width: 100%; height: 420px; border: 0; display: block; }
  `;
  return style;
}

export function iframeCss(primary?: string, accent?: string): string {
  const p = (primary || DEFAULT_PRIMARY).replace(/"/g, '');
  const a = (accent || darkenHex(p, 0.2)).replace(/"/g, '');
  const rgb = hexToRgbString(p);
  const cardStart = lightenHex(p, 0.85);
  const cardEnd = lightenHex(p, 0.7);

  return `
  :root { --lc-primary: ${p}; --lc-accent: ${a}; --lc-primary-rgb: ${rgb}; }
  * { box-sizing: border-box; margin: 0; padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
  body { margin: 0; color: #111; background: #fff; }

  /* Layout */
  .wrap { padding: 0; position: relative; }
  .view-content { padding: 16px 20px 8px; }

  /* Progress stepper */
  .lc-stepper { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px 6px; }
  .lc-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; transition: background 300ms ease, box-shadow 300ms ease, transform 300ms ease; flex-shrink: 0; }
  .lc-dot.active { background: ${p}; box-shadow: 0 0 0 3px rgba(${rgb}, 0.18); transform: scale(1.15); }
  .lc-dot.done { background: #10b981; }
  .lc-bar { width: 24px; height: 2px; background: #e5e7eb; border-radius: 1px; transition: background 300ms ease; flex-shrink: 0; }
  .lc-bar.done { background: #10b981; }

  /* Credential card */
  .cred-card {
    margin: 10px 16px 0; border-radius: 12px; padding: 16px 18px;
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, ${cardStart}, ${cardEnd});
    color: #0c3a2e;
  }
  .cred-card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(12,58,46,0.4); margin-bottom: 6px; }
  .cred-card-name { font-size: 17px; font-weight: 700; position: relative; z-index: 1; }
  .cred-card-issuer { font-size: 12px; color: rgba(12,58,46,0.45); margin-top: 5px; position: relative; z-index: 1; }

  /* Surface sweep shine */
  .cred-card::after {
    content: ''; position: absolute; top: -50%; left: -60%; width: 40%; height: 200%;
    background: linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.45) 55%, transparent 60%, transparent 100%);
    transform: rotate(25deg); animation: sweepShine 3.5s ease-in-out infinite; pointer-events: none;
  }
  @keyframes sweepShine { 0% { left: -60%; } 40% { left: 130%; } 100% { left: 130%; } }

  /* Typography */
  .title { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 6px; }
  .subtitle { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 16px; }

  /* Form elements */
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .label { font-size: 13px; font-weight: 600; color: #374151; }
  .input {
    width: 100%; padding: 11px 14px; border: 2px solid #e5e7eb; border-radius: 10px;
    font-size: 14px; color: #111; background: #fff; outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .input:focus { border-color: ${p}; box-shadow: 0 0 0 3px rgba(${rgb}, 0.1); }
  .input::placeholder { color: #9ca3af; }

  /* OTP inputs */
  .otp { display: flex; gap: 8px; justify-content: center; margin-bottom: 14px; }
  .otp input {
    width: 42px; text-align: center; font-size: 18px; font-weight: 600;
    padding: 10px 0; border: 2px solid #e5e7eb; border-radius: 10px;
    outline: none; transition: border-color 150ms, box-shadow 150ms, background 150ms, transform 150ms;
  }
  .otp input:focus { border-color: ${p}; box-shadow: 0 0 0 3px rgba(${rgb}, 0.1); }
  .otp input.filled { border-color: ${p}; background: rgba(${rgb}, 0.04); animation: otpPulse 150ms ease; }
  @keyframes otpPulse { 0% { transform: scale(1.03); } 100% { transform: scale(1); } }

  /* Buttons */
  .btn {
    appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    padding: 12px 14px; font-weight: 600; font-size: 14px;
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform 150ms, box-shadow 150ms, opacity 150ms;
  }
  .btn-primary {
    background: ${p}; color: #fff;
    box-shadow: 0 4px 14px rgba(${rgb}, 0.25);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(${rgb}, 0.35); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-primary.loading { pointer-events: none; }

  .btn-secondary {
    background: transparent; color: #6b7280; font-weight: 500; font-size: 13px;
    padding: 8px 14px;
  }
  .btn-secondary:hover { color: #374151; }

  /* Spinner */
  .spinner { width: 14px; height: 14px; animation: spin 1s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Error */
  .error { color: #dc2626; font-size: 12px; min-height: 16px; margin-top: 4px; }

  /* Hint */
  .hint { font-size: 12px; color: #9ca3af; margin-top: 8px; text-align: center; }

  /* Success view */
  .success { text-align: center; padding: 8px 10px; position: relative; z-index: 1; }
  .success-circle {
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 8px auto 16px; background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    animation: scaleIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes scaleIn { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .checkmark-path { stroke-dasharray: 30; stroke-dashoffset: 30; animation: drawCheck 500ms 300ms ease forwards; }
  @keyframes drawCheck { to { stroke-dashoffset: 0; } }

  /* Confetti */
  .confetti-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: hidden; z-index: 0; }
  .confetti-piece {
    position: absolute; top: -10px; border-radius: 2px; opacity: 0;
    animation: confettiFall var(--duration, 2.5s) var(--delay, 0s) ease-out forwards;
  }
  @keyframes confettiFall {
    0% { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
    15% { opacity: 1; }
    100% { transform: translateY(420px) rotate(var(--rotation, 720deg)) scale(0.2); opacity: 0; }
  }

  /* Consent checkbox */
  .consent-row {
    display: flex; gap: 10px; align-items: flex-start; text-align: left;
    margin: 16px 0; font-size: 13px; color: #6b7280;
  }
  .consent-row input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; }

  /* Footer */
  .lc-footer {
    text-align: center; padding: 10px 16px 14px; font-size: 11px; color: #b0b8c4;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    border-top: 1px solid #f3f4f6;
  }
  .lc-footer img { height: 13px; width: auto; border-radius: 2px; opacity: 0.5; }

  /* View transitions */
  .view-wrap { transition: opacity 200ms ease, transform 200ms ease; }
  .view-wrap.exiting { opacity: 0; transform: translateX(-20px); }
  .view-wrap.entering { opacity: 0; transform: translateX(20px); }

  `;
  // Note: Skeleton loading was in the spec but is not needed because config is delivered
  // inline via srcdoc (window.__LC_EMBED__ is set synchronously before island-vanilla.js runs).
  // If async config delivery is added later, add skeleton CSS + SkeletonView() to island-vanilla.js.
}
