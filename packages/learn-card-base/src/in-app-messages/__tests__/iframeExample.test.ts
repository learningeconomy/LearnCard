import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it, vi } from 'vitest';

const html = readFileSync(new URL('../examples/iframe.html', import.meta.url), 'utf8');

const loadExample = (
    parentOrigin: string
): { dom: JSDOM; postMessage: ReturnType<typeof vi.fn> } => {
    const postMessage = vi.fn();
    const dom = new JSDOM(html, {
        url: `https://content.example/guide?parentOrigin=${encodeURIComponent(parentOrigin)}`,
        runScripts: 'dangerously',
        beforeParse: window => {
            Object.defineProperty(window, 'parent', { value: { postMessage } });
        },
    });
    return { dom, postMessage };
};

describe('hosted iframe bridge example', () => {
    it.each(['https://app.example', 'http://localhost:3000', 'capacitor://localhost'])(
        'sends ready and actions to the exact parent origin %s',
        parentOrigin => {
            const { dom, postMessage } = loadExample(parentOrigin);
            try {
                expect(postMessage).toHaveBeenCalledExactlyOnceWith(
                    { type: 'LC_IN_APP_MESSAGE', event: 'ready' },
                    parentOrigin
                );
                dom.window.document.getElementById('navigate')?.click();
                expect(postMessage).toHaveBeenLastCalledWith(
                    {
                        type: 'LC_IN_APP_MESSAGE',
                        event: 'runAction',
                        action: { type: 'internalLink', path: '/passport' },
                    },
                    parentOrigin
                );
                dom.window.document.getElementById('close')?.click();
                expect(postMessage).toHaveBeenLastCalledWith(
                    { type: 'LC_IN_APP_MESSAGE', event: 'close' },
                    parentOrigin
                );
            } finally {
                dom.window.close();
            }
        }
    );

    it.each([
        'capacitor://other-host',
        'capacitor://localhost.evil',
        'capacitor://localhost/path',
        'capacitor://localhost?extra=1',
        'file://localhost',
        'null',
    ])('rejects unsupported or decorated native origins: %s', parentOrigin => {
        const { dom, postMessage } = loadExample(parentOrigin);
        try {
            dom.window.document.getElementById('navigate')?.click();
            dom.window.document.getElementById('close')?.click();
            expect(postMessage).not.toHaveBeenCalled();
            expect(dom.window.document.getElementById('status')?.textContent).toContain(
                'Set the parentOrigin'
            );
        } finally {
            dom.window.close();
        }
    });
});
