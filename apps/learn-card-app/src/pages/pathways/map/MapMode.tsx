/**
 * MapMode — zoomed-out graph view. Phase 0 stub.
 *
 * Phase 2 lands the React Flow viewport + depth-2 progressive disclosure
 * (docs § 10). Also where the 2-hour spike comparing React Flow vs custom
 * SVG happens.
 */

import React from 'react';

const MapMode: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 font-poppins">
        <div className="p-6 rounded-[20px] bg-grayscale-100 border border-grayscale-200 text-center">
            <h2 className="text-lg font-semibold text-grayscale-900 mb-2">Map</h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                The graph viewport arrives in Phase 2 with depth-2 progressive disclosure
                around the focus node. Zooming out will reveal more of the graph.
            </p>
        </div>
    </div>
);

export default MapMode;
