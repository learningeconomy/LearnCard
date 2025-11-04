/* Styles helpers for LearnCard Embed SDK */

export function createGlobalStyleEl(primary?: string, accent?: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('data-learncard-embed', '');
  const p = (primary || '#1F51FF').replace(/"/g, '');
  const a = (accent || '#0F3BD9').replace(/"/g, '');
  style.textContent = `
    :root { --lc-primary: ${p}; --lc-accent: ${a}; }
    .lc-claim-btn { 
      appearance: none; border: 0; cursor: pointer; 
      padding: 10px 14px; border-radius: 8px; font-weight: 600; 
      background: var(--lc-primary, #1F51FF); color: white; 
      box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
    }
    .lc-claim-btn:hover { filter: brightness(0.95); }

    .lc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483000; display: flex; align-items: center; justify-content: center; }
    .lc-modal { width: 100%; max-width: 420px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .lc-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #eee; }
    .lc-brand { display: flex; gap: 8px; align-items: center; font-weight: 700; color: #111; }
    .lc-brand-logos { display: flex; align-items: center; gap: 8px; }
    .lc-brand-logos img { height: 20px; width: auto; display: block; }
    .lc-close { background: transparent; border: 0; font-size: 18px; cursor: pointer; padding: 6px; line-height: 1; }
    .lc-iframe { width: 100%; height: 420px; border: 0; display: block; }
  `;
  return style;
}

export function iframeCss(primary?: string, accent?: string): string {
  const p = (primary || '#1F51FF').replace(/"/g, '');
  const a = (accent || '#0F3BD9').replace(/"/g, '');
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
