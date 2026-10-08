import React, { useState } from 'react';

import EndorsementCard from './EndorsementCard';
import EndorsementFullView from './EndorsementsList/EndorsementFullView';

import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useGetVCInfo, useWallet } from 'learn-card-base';
const EMPTY_DELETED_IDS = new Set<string>();

const BoostEndorsementDetails: React.FC<{
    credential: VC;
    categoryType?: CredentialCategoryEnum;
    existingEndorsements?: VC[];
}> = ({ credential, categoryType, existingEndorsements }) => {
    const { initWallet } = useWallet();
    const { endorsements } = useGetVCInfo(credential, categoryType);

    const credentialId = credential.id ?? '';
    const [deletedState, setDeletedState] = useState<{
        credentialId: string;
        ids: Set<string>;
    }>({ credentialId, ids: EMPTY_DELETED_IDS });
    const deletedIds =
        deletedState.credentialId === credentialId ? deletedState.ids : EMPTY_DELETED_IDS;
    const visibleEndorsements = (endorsements ?? []).filter(
        endorsement => !deletedIds.has(endorsement?.metadata?.id)
    );

    const handleDeleteEndorsement = async (id: string) => {
        const wallet = await initWallet();
        const deleted = await wallet?.index?.LearnCloud?.remove(id);
        if (!deleted) return;

        setDeletedState(previous => {
            const ids =
                previous.credentialId === credentialId ? new Set(previous.ids) : new Set<string>();
            ids.add(id);
            return { credentialId, ids };
        });
    };

    // owners POV
    if (visibleEndorsements.length > 0) {
        return (
            <>
                <EndorsementCard credential={credential} categoryType={categoryType} />
                {visibleEndorsements.map(({ endorsement, metadata }) => (
                    <EndorsementFullView
                        credential={credential}
                        categoryType={categoryType}
                        key={metadata?.id}
                        endorsement={endorsement}
                        metadata={metadata}
                        showDeleteButton
                        handleDeleteEndorsement={handleDeleteEndorsement}
                    />
                ))}
            </>
        );
    }

    // endorsers POV | Viewers POV
    return (
        <>
            <EndorsementCard
                credential={credential}
                categoryType={categoryType}
                existingEndorsements={existingEndorsements}
            />
            {existingEndorsements?.map(endorsement => (
                <EndorsementFullView
                    credential={credential}
                    categoryType={categoryType}
                    key={endorsement.id}
                    endorsement={endorsement}
                />
            ))}
        </>
    );
};

export default BoostEndorsementDetails;
