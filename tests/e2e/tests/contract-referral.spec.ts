import { describe, expect, it } from 'vitest';
import { runReferralLab } from '../../../scripts/lc-2226/referral-lab';

describe('Generic consent referrals through signed HTTP', () => {
    it('claims and encrypts partner outcomes with audience isolation and correlated webhooks', async () => {
        const result = await runReferralLab({
            webhookHost: process.env.LC2226_WEBHOOK_HOST ?? 'host.docker.internal',
        });
        expect(result.result).toBe('PASS');
        expect(result.contracts).toHaveLength(2);
        expect(result.webhookCount).toBeGreaterThan(0);
    }, 180_000);
});
