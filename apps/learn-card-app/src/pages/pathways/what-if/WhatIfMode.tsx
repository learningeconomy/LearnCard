/**
 * WhatIfMode — simulate alternative pathways with explicit tradeoffs.
 *
 * Phase 0 stub. Phase 4 lands the simulation runner + tradeoff tables
 * (docs § 5, § 17).
 */

import React from 'react';

const WhatIfMode: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 font-poppins">
        <div className="p-6 rounded-[20px] bg-grayscale-100 border border-grayscale-200 text-center">
            <h2 className="text-lg font-semibold text-grayscale-900 mb-2">What-if</h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                Phase 4 lands the simulation runner and honest cost/time/effort tradeoff
                tables. Alternative paths surface here alongside the path you're on today.
            </p>
        </div>
    </div>
);

export default WhatIfMode;
