import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-boost');

import useWallet from 'learn-card-base/hooks/useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { useQueryClient } from '@tanstack/react-query';
import { useToast, ToastTypeEnum, invalidateBoostRecipientQueries } from 'learn-card-base';

import {
    sendAndSaveBoostCredentialSelf,
    addBoostSomeone,
    updateBoostStatus,
} from '../boostHelpers';

import { BoostCMSIssueTo, LCNBoostStatusEnum } from '../boost';
import * as m from '../../../paraglide/messages.js';

const useBoost = (history: RouteComponentProps['history']) => {
    const { initWallet, addVCtoWallet } = useWallet();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const [loading, setIsLoading] = useState(false);

    const boostSomeoneElse = async (
        issueTo: BoostCMSIssueTo[],
        wallet: BespokeLearnCard,
        boostUri: string
    ) => {
        try {
            setIsLoading(true);

            if (boostUri) {
                const uris = await Promise.all(
                    issueTo.map(async issuee => {
                        const otherProfileId = issuee?.profileId;
                        const issuedVc = await addBoostSomeone(wallet, otherProfileId, boostUri, {
                            mediaAttachments: issuee.mediaAttachments,
                        });

                        return issuedVc;
                    })
                ).then(() => {
                    void invalidateBoostRecipientQueries(queryClient, boostUri);
                    setIsLoading(false);
                    presentToast(m['toasts.boost.boostIssuedSuccess'](), {
                        duration: 3000,
                        type: ToastTypeEnum.Success,
                    });
                });
            }
        } catch (e) {
            log.info('error', e);
            setIsLoading(false);
            presentToast(m['toasts.boost.boostIssuedError'](), {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const handleSubmitExistingBoostOther = async (
        issueTo: BoostCMSIssueTo[],
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
            log.info('error', e);
            setIsLoading(false);
            presentToast(m['toasts.boost.boostIssuedError'](), {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        }
    };

    const boostSelf = async (wallet: BespokeLearnCard, profileId: string, boostUri: string) => {
        try {
            setIsLoading(true);

            const vcUri = await sendAndSaveBoostCredentialSelf(wallet, profileId, boostUri);
            await addVCtoWallet({ uri: vcUri });
            void invalidateBoostRecipientQueries(queryClient, boostUri);
            setIsLoading(false);
            presentToast(m['toasts.boost.boostIssuedSuccess'](), {
                duration: 3000,
                type: ToastTypeEnum.Success,
            });
        } catch (e) {
            log.info('error', e);
            setIsLoading(false);
            presentToast(m['toasts.boost.boostIssuedError'](), {
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
            log.info('error', e);
            setIsLoading(false);
            presentToast(m['toasts.boost.boostIssuedError'](), {
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
