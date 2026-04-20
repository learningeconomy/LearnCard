/**
 * BuildMode — author or edit a pathway; upload evidence.
 *
 * Phase 0 stub. Phase 2 lands NodeEditor, StageEditor (the CST primitive
 * exposed), ArtifactUploader with "proof of effort" framing (docs § 5).
 */

import React from 'react';

const BuildMode: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 font-poppins">
        <div className="p-6 rounded-[20px] bg-grayscale-100 border border-grayscale-200 text-center">
            <h2 className="text-lg font-semibold text-grayscale-900 mb-2">Build</h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                Phase 2 lands the node editor, stage editor (initiation / policy / termination),
                and the artifact uploader.
            </p>
        </div>
    </div>
);

export default BuildMode;
