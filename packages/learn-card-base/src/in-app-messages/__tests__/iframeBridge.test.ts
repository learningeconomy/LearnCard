// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { iframeMessageValidator, parseIframeMessage } from '../iframeBridge';

describe('iframe bridge boundary', () => {
    const envelope = (action: unknown) => ({
        type: 'LC_IN_APP_MESSAGE',
        event: 'runAction',
        action,
    });
    it.each([
        { type: 'capgoUpdate' },
        { type: 'externalLink', url: 'javascript:alert(1)' },
        { type: 'internalLink', path: '//example.com' },
        { type: 'internalLink', path: '/\\example.com' },
        { type: 'internalLink', path: '/\n/example.com' },
        { type: 'appStore', iosUrl: 'http://example.com' },
        { type: 'openApp', listingId: 'x' },
    ])('rejects unsafe or unsupported targets %s', action => {
        expect(iframeMessageValidator.safeParse(envelope(action)).success).toBe(false);
    });
    it.each([
        { type: 'dismiss' },
        { type: 'internalLink', path: '/wallet?tab=1' },
        { type: 'externalLink', url: 'https://example.com' },
        { type: 'appStore', webUrl: 'https://example.com' },
    ])('accepts supported safe actions %s', action => {
        expect(iframeMessageValidator.safeParse(envelope(action)).success).toBe(true);
    });
    it('requires the source window, origin, and exact envelope', () => {
        const data = { type: 'LC_IN_APP_MESSAGE', event: 'ready' };
        const event = new MessageEvent('message', {
            data,
            source: window,
            origin: 'https://example.com',
        });
        expect(parseIframeMessage(event, window, 'https://example.com/page')).toEqual(data);
        expect(parseIframeMessage(event, null, 'https://example.com/page')).toBeNull();
        expect(parseIframeMessage(event, window, 'https://other.example/page')).toBeNull();
        expect(iframeMessageValidator.safeParse({ ...data, identity: 'request' }).success).toBe(
            false
        );
    });
    it.each([
        '/request?uri=https://attacker.example',
        '/exchange?uri=https://attacker.example',
        '/consent-flow?contract=https://attacker.example',
        '/interactions/claim?token=untrusted',
        '/passport?returnTo=/request',
        '/passport#redirect',
        '/passport/../request',
        '/%70assport',
    ])('denies undeclared internal destinations even from the configured frame: %s', path => {
        const event = new MessageEvent('message', {
            source: window,
            origin: 'https://example.com',
            data: envelope({ type: 'internalLink', path }),
        });
        expect(
            parseIframeMessage(event, window, 'https://example.com/page', ['/passport'])
        ).toBeNull();
    });
    it('denies internal navigation by default and accepts only exact declared query/fragment values', () => {
        const path = '/passport?tab=skills#recent';
        const data = envelope({ type: 'internalLink', path });
        const event = new MessageEvent('message', {
            source: window,
            origin: 'https://example.com',
            data,
        });
        expect(parseIframeMessage(event, window, 'https://example.com/page')).toBeNull();
        expect(
            parseIframeMessage(event, window, 'https://example.com/page', ['/passport'])
        ).toBeNull();
        expect(parseIframeMessage(event, window, 'https://example.com/page', [path])).toEqual(data);
        expect(parseIframeMessage(event, null, 'https://example.com/page', [path])).toBeNull();
    });
});
