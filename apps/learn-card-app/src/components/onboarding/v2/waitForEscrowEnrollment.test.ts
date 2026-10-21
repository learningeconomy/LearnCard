import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitForEscrowEnrollment, type EscrowEnrollmentSnapshot } from './waitForEscrowEnrollment';

afterEach(() => vi.useRealTimers());

describe('waitForEscrowEnrollment', () => {
    it('waits for background enrollment that lands after the profile step', async () => {
        vi.useFakeTimers();
        let state: EscrowEnrollmentSnapshot = { status: 'ready' };
        const result = waitForEscrowEnrollment(() => state, { escrowEnabled: true });
        await vi.advanceTimersByTimeAsync(3_000);
        state = { status: 'ready', escrowEnrollment: 'enrolled' };
        await vi.advanceTimersByTimeAsync(250);
        await expect(result).resolves.toBe(true);
    });

    it('reads live state, so an already-finished enrollment is used immediately', async () => {
        await expect(
            waitForEscrowEnrollment(() => ({ status: 'ready', escrowEnrollment: 'enrolled' }), {
                escrowEnabled: true,
            })
        ).resolves.toBe(true);
    });

    it('never waits when escrow is off', async () => {
        const getState = vi.fn(() => ({ status: 'ready' }));
        await expect(waitForEscrowEnrollment(getState, { escrowEnabled: false })).resolves.toBe(
            false
        );
    });

    it('gives up after the timeout without offering a PIN', async () => {
        vi.useFakeTimers();
        const result = waitForEscrowEnrollment(() => ({ status: 'ready' }), {
            escrowEnabled: true,
            timeoutMs: 1_000,
        });
        await vi.advanceTimersByTimeAsync(1_500);
        await expect(result).resolves.toBe(false);
    });

    it('does not offer a PIN when enrollment settles as anything but enrolled', async () => {
        await expect(
            waitForEscrowEnrollment(() => ({ status: 'ready', escrowEnrollment: 'opted-out' }), {
                escrowEnabled: true,
            })
        ).resolves.toBe(false);
    });
});
