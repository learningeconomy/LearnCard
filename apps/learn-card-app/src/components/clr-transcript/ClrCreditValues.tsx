import React from 'react';
import { getClrCreditQuantities } from 'learn-card-base/helpers/credentials/clr/credits';
import type { CourseDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

/** Shows the source-backed credit quantities and keeps absent earned credits unknown. */
export const ClrCreditValues = ({ course }: { course: CourseDisplayModel }) => (
    <div className="space-y-1 text-xs text-grayscale-700">
        {!course.creditsEarned && <p aria-label="Earned credits not supplied">Earned —</p>}
        {getClrCreditQuantities(course).map(quantity => (
            <p key={quantity.kind} className="break-words">
                {quantity.amount} {quantity.unit ? `${quantity.unit} ` : ''}
                {quantity.kind === 'inferred' ? 'from description' : quantity.kind}
            </p>
        ))}
    </div>
);
