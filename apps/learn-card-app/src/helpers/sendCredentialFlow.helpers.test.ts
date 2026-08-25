import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), warn: vi.fn() }),
}));

import { AnalyticsEvents } from '../analytics/events';
import type { AnalyticsProvider } from '../analytics/types';
import { markClaimCompleted, setAnalyticsProvider, startFlow } from './sendCredentialFlow.helpers';

const track = vi.fn<AnalyticsProvider['track']>();
const provider: AnalyticsProvider = {
    name: 'test',
    init: vi.fn(),
    identify: vi.fn(),
    track,
    page: vi.fn(),
    reset: vi.fn(),
    setEnabled: vi.fn(),
};

describe('sendCredential flow telemetry rollout', () => {
    beforeEach(() => {
        track.mockReset();
        track.mockResolvedValue(undefined);
        setAnalyticsProvider(provider);
    });

    it('does not emit organic send-credential telemetry', async () => {
        startFlow({ runId: 'organic-flow' });

        await markClaimCompleted();

        expect(track).not.toHaveBeenCalled();
    });

    it('keeps explicitly requested bench telemetry', async () => {
        startFlow({ runId: 'bench-flow', triggeredByBench: true });

        await markClaimCompleted();

        expect(track).toHaveBeenCalledWith(
            AnalyticsEvents.FRONTEND_SENDCREDENTIAL_ITERATION,
            expect.objectContaining({
                run_id: 'bench-flow',
                triggered_by_bench: true,
            })
        );
    });
});
