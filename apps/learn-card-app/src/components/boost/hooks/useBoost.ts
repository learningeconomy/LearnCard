import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { LCNProfile } from '@learncard/types';

import useWallet from 'learn-card-base/hooks/useWallet';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import {
    sendAndSaveBoostCredentialSelf,
    addBoostSomeone,
    updateBoostStatus,
} from '../boostHelpers';

import { LCNBoostStatusEnum } from '../boost';

const useBoost = (history: RouteComponentProps['history']) => {
    const { initWallet, addVCtoWallet } = useWallet();
    const { presentToast } = useToast();
    const [loading, setIsLoading] = useState(false);

    const boostSomeoneElse = async (issueTo: LCNProfile[], wallet: any, boostUri: string) => {
        try {
            setIsLoading(true);

            if (boostUri) {
                const uris = await Promise.all(
                    issueTo.map(async issuee => {
                        const otherProfileId = issuee?.profileId;
                        const issuedVc = await addBoostSomeone(wallet, otherProfileId, boostUri);

                        return issuedVc;
                    })
                ).then(() => {
                    setIsLoading(false);
                    presentToast('Boost issued successfully', {
                        duration: 3000,
                        type: ToastTypeEnum.Success,
                    });
                });
            }
        } catch (e) {
            console.log('error', e);
            setIsLoading(false);
            presentToast('Error issuing boost', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleSubmitExistingBoostOther = async (
        issueTo: LCNProfile[],
        boostUri: string,
        boostStatus: LCNBoostStatusEnum
    ) => {
        const wallet = await initWallet();

        try {
            setIsLoading(true);

            if (boostStatus === LCNBoostStatusEnum.draft) {
                const updatedBoost = await updateBoostStatus(
                    wallet,
                    boostUri,
                    LCNBoostStatusEnum.live
                );
                if (updatedBoost) {
                    await boostSomeoneElse(issueTo, wallet, boostUri);
                }
            } else {
                await boostSomeoneElse(issueTo, wallet, boostUri);
            }
        } catch (e) {
            console.log('error', e);
            setIsLoading(false);
            presentToast('Error issuing boost', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const boostSelf = async (wallet: any, profileId: string, boostUri: string) => {
        try {
            setIsLoading(true);

            const vcUri = await sendAndSaveBoostCredentialSelf(wallet, profileId, boostUri);
            await addVCtoWallet({ uri: vcUri });
            setIsLoading(false);
            presentToast('Boost issued successfully', {
                duration: 3000,
                type: ToastTypeEnum.Success,
            });
        } catch (e) {
            console.log('error', e);
            setIsLoading(false);
            presentToast('Error issuing boost', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleSubmitExistingBoostSelf = async (
        profileId: string,
        boostUri: string,
        boostStatus: LCNBoostStatusEnum
    ) => {
        const wallet = await initWallet();
        try {
            setIsLoading(true);

            if (boostStatus === LCNBoostStatusEnum.draft) {
                const updatedBoost = await updateBoostStatus(
                    wallet,
                    boostUri,
                    LCNBoostStatusEnum.live
                );
                if (updatedBoost) {
                    await boostSelf(wallet, profileId, boostUri);
                }
            } else {
                await boostSelf(wallet, profileId, boostUri);
            }
        } catch (e) {
            console.log('error', e);
            setIsLoading(false);
            presentToast('Error issuing boost', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };
    return {
        handleSubmitExistingBoostSelf,
        handleSubmitExistingBoostOther,
        boostIssueLoading: loading,
    };
};

export default useBoost;
