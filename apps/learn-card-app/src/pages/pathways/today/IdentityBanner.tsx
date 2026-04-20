/**
 * IdentityBanner — "You are becoming..."
 *
 * Docs § 5: "The top of Today should remind the learner of the identity
 * they are growing into, not the task list they are grinding through."
 */

import React from 'react';

interface IdentityBannerProps {
    goal: string;
    pathwayTitle: string;
}

const IdentityBanner: React.FC<IdentityBannerProps> = ({ goal, pathwayTitle }) => (
    <section className="space-y-1">
        <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
            You are becoming
        </p>

        <p className="text-base text-grayscale-800 leading-relaxed">{goal}</p>

        <p className="text-xs text-grayscale-500">
            on the pathway <span className="text-grayscale-700 font-medium">{pathwayTitle}</span>
        </p>
    </section>
);

export default IdentityBanner;
