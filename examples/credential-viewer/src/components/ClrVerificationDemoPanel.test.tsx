// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { context, sendDemo, environmentError } = vi.hoisted(() => ({
    context: {
        wallet: {},
        status: 'connected',
        profile: { profileId: 'publisher' },
        envKey: 'local',
        envConfig: {},
    },
    sendDemo: vi.fn(),
    environmentError: vi.fn((): string | null => null),
}));

vi.mock('../context/WalletContext', () => ({ useWallet: () => context }));
vi.mock('../lib/clr-verification-demo', () => ({
    sendClrVerificationDemo: sendDemo,
    getClrDemoEnvironmentError: environmentError,
}));

import { ClrVerificationDemoPanel } from './ClrVerificationDemoPanel';

describe('ClrVerificationDemoPanel', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        environmentError.mockReturnValue(null);
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const render = async () => {
        await act(async () => root.render(<ClrVerificationDemoPanel onClose={onClose} />));
    };

    const enterRecipient = async () => {
        const input = container.querySelector('input')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
                input,
                'recipient'
            );
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    };

    it('keeps partial deliveries visible after failure and prevents closing or resubmitting while sending', async () => {
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<never>((_resolve, rejectPromise) => {
            reject = rejectPromise;
        });
        sendDemo.mockImplementation(({ onProgress }) => {
            onProgress({
                message: 'Sending transcripts',
                delivery: { name: 'First transcript', expected: 'Verified', uri: 'secret-receipt' },
            });
            return promise;
        });
        await render();
        await enterRecipient();
        const form = container.querySelector('form')!;
        await act(async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        expect(sendDemo).toHaveBeenCalledTimes(1);
        expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(
            true
        );
        expect(
            container.querySelector<HTMLButtonElement>(
                'button[aria-label="Close CLR verification demo"]'
            )!.disabled
        ).toBe(true);
        await act(async () => {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        expect(sendDemo).toHaveBeenCalledTimes(1);
        await act(async () => {
            reject(new Error('secret error'));
        });
        expect(container.textContent).toContain('First transcript');
        expect(container.textContent).toContain('could not finish');
        expect(container.textContent).not.toContain('secret-receipt');
        expect(container.textContent).not.toContain('secret error');
        expect(container.textContent).not.toContain('Demo sent.');
    });

    it('blocks sending in an unsupported environment', async () => {
        environmentError.mockReturnValue('Production is disabled.');
        await render();
        await enterRecipient();
        expect(container.textContent).toContain('Production is disabled.');
        expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(
            true
        );
        expect(sendDemo).not.toHaveBeenCalled();
    });
});
