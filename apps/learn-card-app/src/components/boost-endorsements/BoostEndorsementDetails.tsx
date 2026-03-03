import React, { useState, useEffect } from 'react';

import EndorsementCard from './EndorsementCard';
import EndorsementFullView from './EndorsementsList/EndorsementFullView';

import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useGetVCInfo } from 'learn-card-base';

import { useWallet } from 'learn-card-base';

const BoostEndorsementDetails: React.FC<{
    credential: VC;
    categoryType?: CredentialCategoryEnum;
    existingEndorsements?: VC[];
}> = ({ credential, categoryType, existingEndorsements }) => {
    const { initWallet } = useWallet();
    const { endorsements } = useGetVCInfo(credential, categoryType);

    const [_endorsements, _setEndorsements] = useState(endorsements || []);

    useEffect(() => {
        if (endorsements) {
            _setEndorsements(endorsements);
        }
    }, [endorsements]);

    const handleDeleteEndorsement = async (id: string) => {
        const wallet = await initWallet();
        const deleted = await wallet?.index?.LearnCloud?.remove(id);

        if (deleted) {
            _setEndorsements(_endorsements.filter(endorsement => endorsement?.metadata?.id !== id));
        }
    };

    // owners POV
    if (_endorsements?.length > 0) {
        return (
            <>
                <EndorsementCard credential={credential} categoryType={categoryType} />
                {_endorsements?.map(({ endorsement, metadata }) => (
                    <EndorsementFullView
                        credential={credential}
                        categoryType={categoryType}
                        key={endorsement?.metadata?.id}
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
