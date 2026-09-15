import { describe, expect, it } from 'vitest';
import { impliesNoBrowser, openPath, signInUrl } from './open';
import { appUrlFor, PRODUCTION_NETWORK, STAGING_NETWORK } from './project';

describe('open', () => {
    it('maps networks to their app', () => {
        expect(appUrlFor(PRODUCTION_NETWORK)).toBe('https://learncard.app');
        expect(appUrlFor(STAGING_NETWORK)).toBe('https://staging.learncard.ai');
        expect(appUrlFor('http://localhost:4000/trpc', 'http://localhost:3000/')).toBe(
            'http://localhost:3000'
        );
    });

    it('needs the matching .env value for resource targets', () => {
        expect(openPath('portal', {})).toBe('/app-store/developer');
        expect(openPath('template', {})).toBeNull();
        expect(openPath('template', { TEMPLATE_URI: 'lc:network:x/trpc:boost:1' })).toBe(
            '/app-store/developer?template=lc%3Anetwork%3Ax%2Ftrpc%3Aboost%3A1'
        );
    });

    it('builds the sign-in URL with next as an app path, seed only in the fragment when asked', () => {
        const plain = signInUrl('https://learncard.app', '/wallet');
        expect(plain).toBe('https://learncard.app/developer/sign-in?next=%2Fwallet');
        const withSeed = new URL(signInUrl('https://learncard.app', '/wallet', 'ab'.repeat(32)));
        expect(withSeed.hash).toBe(`#seed=${'ab'.repeat(32)}`);
        expect(withSeed.search).not.toContain('ab'.repeat(32));
    });

    it('never launches a browser when headless, --json, or --no-browser', () => {
        // A real TTY with no flags: fine to launch.
        expect(impliesNoBrowser({}, true)).toBe(false);
        // --json always implies headless, even at a real TTY.
        expect(impliesNoBrowser({ json: true }, true)).toBe(true);
        // No TTY (piped/CI) implies headless regardless of flags.
        expect(impliesNoBrowser({}, false)).toBe(true);
        // Explicit --no-browser (commander's `browser: false`) always wins.
        expect(impliesNoBrowser({ browser: false }, true)).toBe(true);
    });
});
