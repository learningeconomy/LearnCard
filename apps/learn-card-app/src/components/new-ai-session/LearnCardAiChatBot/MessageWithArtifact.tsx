import React, { useState } from 'react';

import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/MarkdownRenderer';
import { IonSpinner } from '@ionic/react';

import {
    useCreateBoost,
    BoostCategoryOptionsEnum,
    constructCustomBoostType,
    useWallet,
    useGetCurrentLCNUser,
    newCredsStore,
} from 'learn-card-base';

import { useAddCredentialToWallet } from '../../boost/mutations';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { getDefaultDisplayType, sendBoostCredential } from '../../boost/boostHelpers';
import { initialBoostCMSState, BoostCMSState, LCNBoostStatusEnum } from '../../boost/boost';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithArtifact: React.FC<MessageProps> = ({ message }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { mutateAsync: createBoost, isPending } = useCreateBoost();
    const { mutate: addCredentialToWallet } = useAddCredentialToWallet();

    const artifact = message?.artifact;
    const title = artifact?.title as string;
    const categoryType = artifact?.category as string;
    const narrative = artifact?.narrative as string;
    const achievementType = constructCustomBoostType(categoryType, title);

    const [claimed, setClaimed] = useState<boolean>(artifact?.claimed ?? false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [state, setState] = useState<BoostCMSState>({
        ...initialBoostCMSState,
        basicInfo: {
            ...initialBoostCMSState.basicInfo,
            name: artifact?.title || '',
            description: artifact?.summary || '',
            type: categoryType as BoostCategoryOptionsEnum,
            achievementType: achievementType,
            narrative: narrative,
        },
        appearance: {
            ...initialBoostCMSState.appearance,
            displayType: getDefaultDisplayType(categoryType as BoostCategoryOptionsEnum),
        },
    });

    const handleYes = async () => {
        try {
            setIsSaving(true);
            const { boostUri } = await createBoost({
                state: state,
                status: LCNBoostStatusEnum.live,
            });

            const wallet = await initWallet();

            const { sentBoost } = await sendBoostCredential(
                wallet,
                currentLCNUser?.profileId,
                boostUri
            );
            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);

            await addCredentialToWallet({ uri: issuedVcUri });

            // sync new creds state
            const addNewCreds = newCredsStore.set.addNewCreds;
            if (issuedVcUri && categoryType) {
                addNewCreds({
                    [categoryType]: [issuedVcUri],
                });
            }

            // Update the artfact claimed status to true
            if (artifact?.id) setClaimed(true);

            presentToast(`Credential added to LearnCard`, {
                duration: 3000,
                type: ToastTypeEnum.Success,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const statusText = claimed ? 'Claimed' : 'Yes';

    return (
        <>
            <MarkdownRenderer>{message?.artifact?.question}</MarkdownRenderer>
            <button
                className={`w-full gap-2 flex items-center justify-center px-4 py-2 font-semibold rounded-full ${
                    claimed ? 'bg-grayscale-200 text-grayscale-500' : 'bg-indigo-500 text-white'
                }`}
                onClick={handleYes}
                disabled={isSaving || claimed}
            >
                {isSaving ? (
                    <>
                        <IonSpinner name="crescent" /> Claiming...
                    </>
                ) : (
                    statusText
                )}
            </button>
        </>
    );
};

export default MessageWithArtifact;
