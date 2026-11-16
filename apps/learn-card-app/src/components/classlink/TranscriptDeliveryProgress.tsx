import React, { useEffect, useState } from 'react';

import * as m from '../../paraglide/messages.js';
import { getDeliveryProgress, getTimeLeftLabel } from './transcriptDelivery';

const TICK_MS = 1_000;

export type TranscriptDeliveryProgressProps = {
    requestedAt: string;
    expectedBy: string;
    /** The transcript has reached the student; the bar completes. */
    received: boolean;
    /** What is happening now, shown under the bar. */
    stage: string;
};

/** Time-to-delivery bar for transcripts the issuer expects within a few minutes. */
export const TranscriptDeliveryProgress: React.FC<TranscriptDeliveryProgressProps> = ({
    requestedAt,
    expectedBy,
    received,
    stage,
}) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (received) return;
        const timer = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(timer);
    }, [received]);

    const progress = received ? 1 : getDeliveryProgress(requestedAt, expectedBy, now);
    const timeLeft = getTimeLeftLabel(expectedBy, now);
    const percent = Math.round(progress * 100);

    return (
        <div data-testid="transcript-delivery-progress" className="w-full text-left">
            <p
                aria-live="polite"
                className="mb-3 text-sm font-semibold text-grayscale-900 tabular-nums"
                data-testid="transcript-delivery-time-left"
            >
                {received ? m['transcriptOptIn.flow.adding']() : timeLeft}
            </p>
            <div
                role="progressbar"
                aria-label={m['transcriptOptIn.delivery.timeLeftLabel']()}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={received ? m['transcriptOptIn.flow.adding']() : timeLeft}
                className="relative h-2 w-full overflow-hidden rounded-full bg-grayscale-100"
            >
                <div
                    className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                >
                    {!received && (
                        <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-safe:animate-transcript-sheen motion-reduce:hidden"
                        />
                    )}
                </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-grayscale-600">
                <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 motion-safe:animate-pulse-dot"
                />
                {stage}
            </p>
        </div>
    );
};

export default TranscriptDeliveryProgress;
