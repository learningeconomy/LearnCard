import { useEffect, useState } from 'react';
import { getNextDeliveryCheck } from './transcriptDelivery';

/**
 * Re-renders a pending transcript's waiting UI when it changes on its own (the estimate
 * passing, recovery becoming available, a relative label ageing), independently of arrival
 * polling, which may already have stopped.
 */
export const useDeliveryClock = (
    pending: { requestedAt: string; expectedBy?: string } | undefined,
    staleAfterMs: number
): void => {
    const [tick, setTick] = useState(0);
    const requestedAt = pending?.requestedAt;
    const expectedBy = pending?.expectedBy;

    useEffect(() => {
        if (!requestedAt) return;
        const now = Date.now();
        const next = getNextDeliveryCheck(requestedAt, expectedBy, staleAfterMs, now);
        if (next === undefined) return;
        // Browsers clamp longer timeouts; re-arm in steps instead.
        const delay = Math.min(next - now, 2 ** 31 - 1);
        const timer = setTimeout(() => setTick(value => value + 1), Math.max(0, delay));
        return () => clearTimeout(timer);
    }, [requestedAt, expectedBy, staleAfterMs, tick]);
};
