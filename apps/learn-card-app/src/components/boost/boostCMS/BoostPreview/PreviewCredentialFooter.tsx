import React from 'react';
import * as m from '../../../../paraglide/messages.js';

/** Unsigned authoring previews must not imply successful or failed verification. */
const PreviewCredentialFooter: React.FC = () => (
    <div className="w-full flex flex-col items-center gap-1 py-2 font-poppins text-center">
        <span className="rounded-full bg-grayscale-100 px-3 py-1 text-xs font-medium text-grayscale-700">
            {m['common.preview']()}
        </span>
        <span className="text-xs text-grayscale-600">
            {m['issueFlow.preview.verificationPending']()}
        </span>
    </div>
);

export default PreviewCredentialFooter;
