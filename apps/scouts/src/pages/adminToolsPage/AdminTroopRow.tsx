import React from 'react';

import { useGetCredentialWithEdits, useModal, ModalTypes } from 'learn-card-base';

import TroopPage from '../troop/TroopPage';
import ShareTroopIdModal from '../troop/ShareTroopIdModal';

import {
    getImageUrlFromCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { VC } from '@learncard/types';

type AdminTroopRowProps = {
    credential: VC;
};

const AdminTroopRow: React.FC<AdminTroopRowProps> = ({ credential }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    let cred = credential && unwrapBoostCredential(credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(cred);
    cred = credentialWithEdits ?? cred;

    const thumbImage = cred && getImageUrlFromCredential(cred);

    const handleShare = () => {
        newModal(
            <ShareTroopIdModal
                credential={cred.boostCredential ?? cred}
                uri={credential.boostId}
            />,
            { sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const openTroopModal = () => {
        newModal(<TroopPage credential={cred.boostCredential ?? cred} handleShare={handleShare} />);
    };

    /* if (isLoading) {
        return <BoostSkeleton containerClassName="w-full min-w-[400px] h-[46px] rounded-[10px]" />;
    } */

    return (
        <div
            role="button"
            onClick={openTroopModal}
            className="bg-sp-green-light text-black px-[10px] py-[5px] rounded-[10px] w-full flex gap-[10px] items-center"
        >
            <img src={thumbImage} className="h-[36px] w-[36px] rounded-full" />
            {cred?.name}
        </div>
    );
};

export default AdminTroopRow;
