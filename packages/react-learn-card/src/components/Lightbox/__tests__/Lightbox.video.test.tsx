import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Lightbox } from '../Lightbox';
import { openExternalUrl, setExternalUrlOpener } from '../../../helpers/externalUrl.helpers';
import { canEmbedVideoIframe, getExternalVideoUrl } from '../../../helpers/video.helpers';

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const setProtocol = (protocol: string) => {
    Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { ...window.location, protocol },
    });
};

const renderLightbox = () =>
    render(
        <Lightbox
            items={[{ url: VIDEO_URL, type: 'video' }]}
            currentUrl={VIDEO_URL}
            setCurrentUrl={() => undefined}
        />
    );

describe('canEmbedVideoIframe', () => {
    afterEach(() => setProtocol('http:'));

    it('allows iframe embeds on http(s) documents', () => {
        setProtocol('https:');
        expect(canEmbedVideoIframe()).toBe(true);

        setProtocol('http:');
        expect(canEmbedVideoIframe()).toBe(true);
    });

    it("blocks iframe embeds on Capacitor iOS's custom scheme", () => {
        // WKWebView cannot send `capacitor://localhost` as an HTTP Referer, so
        // YouTube rejects the embed with "Error 153".
        setProtocol('capacitor:');
        expect(canEmbedVideoIframe()).toBe(false);
        expect(canEmbedVideoIframe('youtube')).toBe(false);
    });

    it('leaves non-YouTube platforms embedded — only YouTube checks the referrer', () => {
        setProtocol('capacitor:');
        expect(canEmbedVideoIframe('vimeo')).toBe(true);
        expect(canEmbedVideoIframe('drive')).toBe(true);
        expect(canEmbedVideoIframe('loom')).toBe(true);
    });
});

describe('openExternalUrl', () => {
    afterEach(() => setExternalUrlOpener(undefined));

    it('refuses non-web schemes from untrusted attachment data', async () => {
        const opened: string[] = [];
        setExternalUrlOpener(url => {
            opened.push(url);
        });

        await openExternalUrl('javascript:alert(1)');
        await openExternalUrl('data:text/html,<script>alert(1)</script>');
        await openExternalUrl('');
        expect(opened).toEqual([]);

        await openExternalUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(opened).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    });
});

describe('getExternalVideoUrl', () => {
    it('builds a public watch URL from YouTube metadata', () => {
        expect(
            getExternalVideoUrl(
                {
                    type: 'youtube',
                    videoId: 'dQw4w9WgXcQ',
                    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    thumbnailUrl: null,
                },
                'fallback'
            )
        ).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('falls back to the original URL for non-YouTube videos', () => {
        expect(
            getExternalVideoUrl(
                {
                    type: 'vimeo',
                    videoId: '123',
                    embedUrl: 'https://player.vimeo.com/video/123',
                    thumbnailUrl: null,
                },
                'https://vimeo.com/123'
            )
        ).toBe('https://vimeo.com/123');
    });
});

describe('Lightbox video playback', () => {
    afterEach(() => {
        setProtocol('http:');
        setExternalUrlOpener(undefined);
    });

    it('renders an inline iframe on the web', async () => {
        setProtocol('https:');
        renderLightbox();

        // Lightbox renders through a portal into document.body
        await waitFor(() => expect(document.body.querySelector('iframe')).toBeInTheDocument());
        expect(document.body.querySelector('iframe')).toHaveAttribute(
            'src',
            'https://www.youtube.com/embed/dQw4w9WgXcQ'
        );
    });

    it('hands playback to an external browser when embeds cannot work', async () => {
        setProtocol('capacitor:');
        const opened: string[] = [];
        setExternalUrlOpener(url => {
            opened.push(url);
        });

        renderLightbox();

        const button = await screen.findByRole('button', { name: 'Watch on YouTube' });
        expect(document.body.querySelector('iframe')).not.toBeInTheDocument();

        await userEvent.click(button);

        expect(opened).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']);
    });
});
