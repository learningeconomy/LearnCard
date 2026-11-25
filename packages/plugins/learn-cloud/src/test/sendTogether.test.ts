import { describe, expect, it, vi } from 'vitest';
import { SEND_TOGETHER_MAX_WAIT_MS, createSendTogether } from '../sendTogether';

const later = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('createSendTogether', () => {
    it('sends requests started together in the same tick, even when one is ready later', async () => {
        const sendTogether = createSendTogether();
        const sent: string[] = [];
        const send = (name: string) => async () => {
            sent.push(name);
            return name;
        };

        const quick = sendTogether(async () => send('quick'));
        const slow = sendTogether(async () => {
            await later(20);
            return send('slow');
        });
        await later(10);
        expect(sent).toEqual([]);

        await expect(Promise.all([quick, slow])).resolves.toEqual(['quick', 'slow']);
        expect(sent).toEqual(['quick', 'slow']);
    });

    it("a request whose input fails doesn't hold the others", async () => {
        const sendTogether = createSendTogether();
        const ok = sendTogether(async () => async () => 'ok');
        const failed = sendTogether(async () => {
            await later(5);
            throw new Error('no input');
        });

        await expect(failed).rejects.toThrow('no input');
        await expect(ok).resolves.toBe('ok');
    });

    it('stops waiting for a slow input after the cap', async () => {
        vi.useFakeTimers();
        try {
            const sendTogether = createSendTogether();
            const sent = vi.fn(async () => 'quick');
            void sendTogether(async () => sent);
            void sendTogether(() => new Promise(() => undefined));

            await vi.advanceTimersByTimeAsync(SEND_TOGETHER_MAX_WAIT_MS - 1);
            expect(sent).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            expect(sent).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });
});
