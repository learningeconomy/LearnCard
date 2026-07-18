import React from 'react';
import { ConsentFlowTerms } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

type ConsentFlowReadSharingStatusProps = {
    term: ConsentFlowTerms['read']['credentials']['categories'][string];
};

const ConsentFlowReadSharingStatus: React.FC<ConsentFlowReadSharingStatusProps> = ({ term }) => {
    if (term.sharing === false || (!term.shareAll && (term.shared?.length ?? 0) === 0)) {
        return (
            <output className="text-grayscale-600 text-sm font-semibold">
                {m['consentFlow.status.off']()}
            </output>
        );
    }

    return (
        <output className="text-emerald-800 text-sm font-semibold">
            {term.shareAll
                ? m['consentFlow.sync.liveSyncing']()
                : m['consentFlow.sync.selectiveSharing']()}
        </output>
    );
};

export default ConsentFlowReadSharingStatus;
