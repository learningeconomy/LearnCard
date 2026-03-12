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
  return `
  :root { --lc-primary: ${p}; --lc-accent: ${a}; }
  * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
  body { margin: 0; color: #111; background: #fff; }
  .wrap { padding: 16px; }
  .title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  .subtitle { font-size: 14px; color: #555; margin-bottom: 16px; }
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .label { font-size: 13px; color: #333; }
  .input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
  .otp { display: flex; gap: 8px; }
  .otp input { width: 42px; text-align: center; font-size: 18px; padding: 10px 0; border: 1px solid #ddd; border-radius: 8px; }
  .btn { appearance: none; border: 0; border-radius: 8px; cursor: pointer; padding: 10px 14px; font-weight: 700; }
  .btn-primary { background: var(--lc-primary); color: #fff; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .center { display: flex; gap: 10px; align-items: center; justify-content: center; }
  .success { text-align: center; padding: 20px 10px; }
  .check { display: flex; gap: 10px; align-items: flex-start; text-align: left; margin: 16px 0; }
  .hint { font-size: 12px; color: #777; }
  .error { color: #b00020; font-size: 12px; min-height: 16px; }
  `;
}
