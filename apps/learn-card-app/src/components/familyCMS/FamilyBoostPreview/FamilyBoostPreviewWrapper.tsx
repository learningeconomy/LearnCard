import React from 'react';
import { useHistory } from 'react-router-dom';

import FamilyPreview from './FamilyBoostPreview';
import BoostLoader from '../../boost/boostLoader/BoostLoader';

import { useGetCredentialWithEdits, useGetResolvedCredential, useModal } from 'learn-card-base';

import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export const FamilyBoostPreviewWrapper: React.FC<{ uri: string }> = ({ uri }) => {
    const { closeModal } = useModal();
    const history = useHistory();

    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(uri);
    const credential = resolvedCredential;

    let cred = credential && unwrapBoostCredential(credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(cred);
    cred = credentialWithEdits ?? cred;

    if (credentialLoading) return <BoostLoader darkBackground text={'Loading...'} />;

    return (
        <FamilyPreview
            credential={cred}
            boostUri={uri}
            handleCloseModal={() => {
                history.replace('/families');
                closeModal();
            }}
        />
    );
};

export default FamilyBoostPreviewWrapper;
