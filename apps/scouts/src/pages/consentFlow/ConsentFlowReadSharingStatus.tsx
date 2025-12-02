import React from 'react';
import { ConsentFlowTerms } from '@learncard/types';

type ConsentFlowReadSharingStatusProps = {
    term: ConsentFlowTerms['read']['credentials']['categories'][string];
};

const ConsentFlowReadSharingStatus: React.FC<ConsentFlowReadSharingStatusProps> = ({ term }) => {
    if (term.sharing === false || (!term.shareAll && (term.shared?.length ?? 0) === 0)) {
        return <output className="text-grayscale-600 text-sm font-semibold">Off</output>;
    }

    return (
        <output className="text-emerald-800 text-sm font-semibold">
            {term.shareAll ? 'Live Syncing' : 'Selective Sharing'}
        </output>
    );
};

export default ConsentFlowReadSharingStatus;
