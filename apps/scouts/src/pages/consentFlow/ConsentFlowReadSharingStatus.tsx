import React from 'react';
import { ConsentFlowTerms } from '@learncard/types';

type ConsentFlowReadSharingStatusProps = {
    term: ConsentFlowTerms['read']['credentials']['categories'][string];
};

import * as m from '../../paraglide/messages.js';

const ConsentFlowReadSharingStatus: React.FC<ConsentFlowReadSharingStatusProps> = ({ term }) => {
    if (term.sharing === false || (!term.shareAll && (term.shared?.length ?? 0) === 0)) {
        return (
            <output className="text-grayscale-600 text-sm font-semibold">
                {m['consentFlow.off']()}
            </output>
        );
    }

    return (
        <output className="text-emerald-800 text-sm font-semibold">
            {m['consentFlow.' + (term.shareAll ? 'liveSyncing' : 'selectiveSharing')]()}
        </output>
    );
};

export default ConsentFlowReadSharingStatus;
