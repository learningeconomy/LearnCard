import React, { useState } from 'react';

import { IonPage, IonSpinner } from '@ionic/react';
import ModalLayout from 'learn-card-base/components/modals/ionic-modals/CancelModalLayout';
import TroopIDTypeSelectorListItem from './TroopIDTypeSelectorListItem';
import TroopsCMSWrapper from '../TroopsCMSWrapper';

import { useFlags } from 'launchdarkly-react-client-sdk';

import { troopsCMSViewModeDefaults, TroopsCMSViewModeEnum } from '../troopCMSState';
import { CredentialCategoryEnum } from 'learn-card-base';
import { Boost } from '@learncard/types';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

const TroopIDTypeSelectorModal: React.FC<{
    handleCloseModal: () => void;
    earnedBoostIDs: Boost[];
    isLoading?: boolean;
    onSuccess?: (boostUri?: string) => void;
}> = ({ handleCloseModal, earnedBoostIDs = [], isLoading, onSuccess }) => {
    // oxlint-disable-next-line no-unused-vars
    const flags = useFlags();
    const canCreateGlobalIDs =true;

    const [_viewMode, _setViewMode] = useState<TroopsCMSViewModeEnum | null>(null);

    // this assumes a single global admin ID exists per user, this will use the first one avilable
    const globalAdminId = earnedBoostIDs?.find(
        cred => getDefaultCategoryForCredential(cred) === CredentialCategoryEnum.globalAdminId
    );

    // a user can have multiple national networks, this uses the first one available
    // can later be changed in the networks selector inside the troop cms
    const nationalAdminId = earnedBoostIDs?.find(
        cred =>
            getDefaultCategoryForCredential(cred) === CredentialCategoryEnum.nationalNetworkAdminId
    );

    const allowedIDTypesToCreate = [];

    console.log('//canCreateGlobalIds', canCreateGlobalIDs);
    if (!globalAdminId && canCreateGlobalIDs) {
        allowedIDTypesToCreate.push(troopsCMSViewModeDefaults?.global);
    }
    if (globalAdminId) allowedIDTypesToCreate.push(troopsCMSViewModeDefaults?.network);
    if (nationalAdminId) allowedIDTypesToCreate.push(troopsCMSViewModeDefaults?.troop);

    return (
        <div>
            <div className="w-full">
                {isLoading ? (
                    <div className="w-full flex flex-col items-center justify-center ion-padding">
                        <IonSpinner
                            name="crescent"
                            color="grayscale-900"
                            className="scale-[2] mb-8 mt-6"
                        />
                        <p className="font-notoSans text-grayscale-800">Loading...</p>
                    </div>
                ) : (
                    <>
                        {allowedIDTypesToCreate?.map((idType, index) => {
                            const isFirst = index === 0;
                            const isLast = index === allowedIDTypesToCreate.length - 1;

                            let parentUri;
                            if (idType?.type === TroopsCMSViewModeEnum.network) {
                                parentUri = globalAdminId?.boostId;
                            } else if (idType?.type === TroopsCMSViewModeEnum.troop) {
                                parentUri = nationalAdminId?.boostId;
                            }

                            return (
                                <TroopIDTypeSelectorListItem
                                    key={index}
                                    idType={idType}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    parentUri={parentUri}
                                    handleCloseModal={handleCloseModal}
                                    onSuccess={onSuccess}
                                />
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default TroopIDTypeSelectorModal;
