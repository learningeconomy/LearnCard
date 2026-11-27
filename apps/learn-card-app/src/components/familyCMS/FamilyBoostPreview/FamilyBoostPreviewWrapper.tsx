import React from 'react';
import { useNavigate } from 'react-router';

import FamilyPreview from './FamilyBoostPreview';
import BoostLoader from '../../boost/boostLoader/BoostLoader';
import * as m from '../../../paraglide/messages.js';

import { useGetCredentialWithEdits, useGetResolvedCredential, useModal } from 'learn-card-base';

import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export const FamilyBoostPreviewWrapper: React.FC<{ uri: string }> = ({ uri }) => {
    const { closeModal } = useModal();
    const navigate = useNavigate();

    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(uri);
    const credential = resolvedCredential;

    let cred = credential && unwrapBoostCredential(credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(cred);
    cred = credentialWithEdits ?? cred;

    if (credentialLoading) return <BoostLoader darkBackground text={m['common.loading']()} />;

    return (
        <FamilyPreview
            credential={cred}
            boostUri={uri}
            handleCloseModal={() => {
                navigate('/families', { replace: true });
                closeModal();
            }}
        />
    );
};

export default FamilyBoostPreviewWrapper;
