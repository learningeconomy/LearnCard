import React from 'react';

export interface FlowStepsProps {
    /** 1-indexed current step. Must be in `[1, total]`. */
    current: number;

    /**
     * Total number of steps (default 3 \u2014 Review \u2192 Add \u2192 Done).
     * Auth-code flows visually have 4 phases (Review \u2192 Sign in \u2192 Add \u2192
     * Done) but we collapse "Sign in" + "Add" into one filling dot
     * because the user perceives them as a single waiting state.
     */
    total?: number;

    /**
     * Optional caption rendered next to the dots, e.g. "Step 1 of 3".
     * Off by default \u2014 the dots alone are usually enough orientation
     * and a literal step count adds visual noise.
     */
    showCount?: boolean;

    /** Tailwind class extension for the wrapper. */
    className?: string;
}

/**
 * Tiny horizontal step indicator for the OID4VCI / OID4VP exchange
 * flows. Shows N dots with the current one filled and the prior ones
 * marked complete (slightly smaller, emerald). Stylistically tuned
 * to match Airbnb / Apple step indicators \u2014 unobtrusive, never the
 * dominant element on the screen.
 *
 * Usage:
 *
 *   <FlowSteps current={1} />   {* on the consent screen   *}
 *   <FlowSteps current={2} />   {* during issuer redirect /
 *                                  storing                 *}
 *   <FlowSteps current={3} />   {* on the finished screen  *}
 */
const FlowSteps: React.FC<FlowStepsProps> = ({
    current,
    total = 3,
    showCount = false,
    className = '',
}) => {
    // Defensive clamp so callers can't accidentally render an
    // out-of-bounds dot.
    const safeCurrent = Math.max(1, Math.min(current, total));

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            {Array.from({ length: total }).map((_, i) => {
                const step = i + 1;
                const isCurrent = step === safeCurrent;
                const isComplete = step < safeCurrent;

                return (
                    <span
                        key={step}
                        aria-label={
                            isCurrent
                                ? `Step ${step} of ${total} (current)`
                                : isComplete
                                ? `Step ${step} of ${total} (complete)`
                                : `Step ${step} of ${total} (upcoming)`
                        }
                        className={[
                            'rounded-full transition-all duration-300',
                            isCurrent
                                ? 'w-6 h-1.5 bg-grayscale-900'
                                : isComplete
                                ? 'w-1.5 h-1.5 bg-emerald-500'
                                : 'w-1.5 h-1.5 bg-grayscale-200',
                        ].join(' ')}
                    />
                );
            })}

            {showCount && (
                <span className="ml-1.5 text-xs text-grayscale-500 font-medium">
                    Step {safeCurrent} of {total}
                </span>
            )}
        </div>
    );
};

export default FlowSteps;
