import React from 'react';
import * as m from '../../paraglide/messages.js';
import { getClrCreditQuantities } from 'learn-card-base/helpers/credentials/clr/credits';
import type { CourseDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

/** Shows the source-backed credit quantities and keeps absent earned credits unknown. */
export const ClrCreditValues = ({
    course,
    showMissingEarned = true,
}: {
    course: CourseDisplayModel;
    showMissingEarned?: boolean;
}) => {
    const quantities = getClrCreditQuantities(course);
    const missingEarned = showMissingEarned && !course.creditsEarned;
    if (!missingEarned && !quantities.length) return null;

    return (
        <div className="space-y-v3-1 text-xs text-grayscale-700">
            {missingEarned && (
                <p aria-label={m['clrTranscript.credits.earnedNotSuppliedAria']()}>
                    {m['clrTranscript.credits.earnedNotSupplied']()}
                </p>
            )}
            {quantities.map(quantity => {
                const value = `${quantity.amount}${quantity.unit ? ` ${quantity.unit}` : ''}`;
                const label =
                    quantity.kind === 'earned'
                        ? m['clrTranscript.credits.earnedQuantity']({ value })
                        : quantity.kind === 'available'
                          ? m['clrTranscript.credits.availableQuantity']({ value })
                          : m['clrTranscript.credits.inferredQuantity']({ value });

                return (
                    <p key={quantity.kind} className="wrap-break-word">
                        {label}
                    </p>
                );
            })}
        </div>
    );
};
