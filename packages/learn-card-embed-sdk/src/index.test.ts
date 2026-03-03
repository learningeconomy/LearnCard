import { init } from './index';

function setupTarget(id = 'mount') {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function getOverlay() {
  return document.querySelector('.lc-modal-overlay');
}

function getIframe(): HTMLIFrameElement {
  const iframe = document.querySelector('iframe.lc-iframe') as HTMLIFrameElement | null;
  if (!iframe) throw new Error('iframe not found');
  return iframe;
}

function parseEmbedConfigFromSrcdoc(html: string): any {
  const m = html.match(/window.__LC_EMBED__\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error('embed config not found in srcdoc');
  return JSON.parse(m[1]);
}

describe('LearnCard Embed SDK', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = '';
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null as any);
  });

  afterEach(() => {
    openSpy.mockRestore();
    jest.restoreAllMocks();
  });

  test('renders claim button into target and injects styles', () => {
    const target = setupTarget();

    init({
      target: '#mount',
      credential: { name: 'Test Credential' },
    });

    const btn = target.querySelector('button.lc-claim-btn') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn?.textContent || '').toContain('Claim');
    expect(btn?.textContent || '').toContain('Test Credential');

    const style = document.querySelector('style[data-learncard-embed]');
    expect(style).toBeTruthy();
  });

  test('opens modal with secure iframe and proper config on click', () => {
    setupTarget();

    init({
      partnerName: 'ACME',
      target: '#mount',
      credential: { name: 'Badge' },
      requestBackgroundIssuance: true,
    });

    const btn = document.querySelector('button.lc-claim-btn') as HTMLButtonElement;
    btn.click();

    const overlay = getOverlay();
    expect(overlay).toBeTruthy();

    const iframe = getIframe();
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.getAttribute('referrerpolicy')).toBe('no-referrer');

    const cfg = parseEmbedConfigFromSrcdoc(iframe.srcdoc || '');
    expect(cfg.partnerLabel).toBe('ACME');
    expect(cfg.credentialName).toBe('Badge');
    expect(cfg.showConsent).toBe(true);
    expect(typeof cfg.nonce).toBe('string');
    expect(cfg.parentOrigin).toBe(window.location.origin);
  });

  test('completes flow on trusted message, calls onSuccess, opens wallet, and closes modal', () => {
    setupTarget();

    const onSuccess = jest.fn();

    init({
      target: '#mount',
      credential: { name: 'Thing' },
      onSuccess,
    });

    (document.querySelector('button.lc-claim-btn') as HTMLButtonElement).click();

    const iframe = getIframe();
    const cfg = parseEmbedConfigFromSrcdoc(iframe.srcdoc || '');

    // Dispatch a trusted completion message; jsdom iframe.contentWindow is null, so use source: null
    const payload = { __lcEmbed: true, type: 'lc-embed:complete', nonce: cfg.nonce, payload: { credentialId: 'abc', consentGiven: false } };
    window.dispatchEvent(new MessageEvent('message', { data: payload, source: null as any }));

    expect(openSpy).toHaveBeenCalledWith('https://learncard.app', '_blank', 'noopener,noreferrer');
    expect(onSuccess).toHaveBeenCalledWith({ credentialId: 'abc', consentGiven: false });
    expect(getOverlay()).toBeFalsy();
  });

  test('Escape key closes modal', () => {
    setupTarget();

    init({ target: '#mount', credential: { name: 'Cred' } });
    (document.querySelector('button.lc-claim-btn') as HTMLButtonElement).click();

    expect(getOverlay()).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(getOverlay()).toBeFalsy();
  });

  test('injects styles only once across multiple inits', () => {
    setupTarget('a');
    setupTarget('b');

    init({ target: '#a', credential: { name: 'A' } });
    init({ target: '#b', credential: { name: 'B' } });

    const styles = document.querySelectorAll('style[data-learncard-embed]');
    expect(styles.length).toBe(1);
  });
});
