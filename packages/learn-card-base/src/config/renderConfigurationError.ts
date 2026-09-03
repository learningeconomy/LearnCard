import { getLogger } from '../logging/logger';

const log = getLogger('configuration-error');

/** Render a dependency-free startup failure before React or tenant subsystems initialize. */
export const renderConfigurationError = (error: unknown, rootId = 'root'): void => {
    const message = error instanceof Error ? error.message : String(error);

    log.error('Application configuration failed', error);

    if (typeof document === 'undefined') return;

    const root = document.getElementById(rootId) ?? document.body;
    const container = document.createElement('main');
    const card = document.createElement('section');
    const heading = document.createElement('h1');
    const guidance = document.createElement('p');
    const details = document.createElement('pre');

    container.style.cssText =
        'min-height:100vh;display:grid;place-items:center;padding:24px;background:#eff0f5;font-family:Poppins,sans-serif';
    card.style.cssText =
        'width:min(100%,640px);padding:32px;border-radius:20px;background:white;box-shadow:0 8px 32px rgba(24,34,78,.16)';
    heading.style.cssText = 'margin:0 0 8px;color:#18224e;font-size:20px;font-weight:600';
    guidance.style.cssText = 'margin:0 0 20px;color:#6f7590;font-size:14px;line-height:1.6';
    details.style.cssText =
        'margin:0;padding:16px;overflow:auto;border-radius:12px;background:#fbfbfc;color:#353e64;font-size:12px;white-space:pre-wrap';

    heading.textContent = 'Configuration error';
    guidance.textContent =
        'The application could not start because its deployment configuration is invalid. Correct the settings below and restart the application.';
    details.textContent = message;

    card.append(heading, guidance, details);
    container.append(card);
    root.replaceChildren(container);
};
