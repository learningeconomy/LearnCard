import React, { useState } from 'react';
import { useStore } from '@nanostores/react';

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
import {
    claimedArtifacts,
    claimArtifact,
    dismissedArtifacts,
    dismissArtifact,
} from 'learn-card-base/stores/nanoStores/artifactsStore';

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

    const $claimedArtifacts = useStore(claimedArtifacts);
    const $dismissedArtifacts = useStore(dismissedArtifacts);
    const claimed = artifact?.id ? $claimedArtifacts.has(artifact.id) : artifact?.claimed ?? false;
    const dismissed = artifact?.id ? $dismissedArtifacts.has(artifact.id) : false;
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
                currentLCNUser?.profileId || '',
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

            // Update the artifact claimed status to true
            if (artifact?.id) claimArtifact(artifact.id);

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
    const isDisabled = isSaving || claimed || dismissed;

    return (
        <>
            <MarkdownRenderer>{message?.artifact?.question}</MarkdownRenderer>
            <div className="flex gap-2 w-full">
                {!claimed && !dismissed && artifact?.id && (
                    <button
                        className="flex-1 px-4 py-2 font-semibold rounded-full bg-grayscale-200 text-grayscale-900"
                        onClick={() => dismissArtifact(artifact.id!)}
                        disabled={isSaving}
                    >
                        Dismiss
                    </button>
                )}
                <button
                    className={`flex-1 gap-2 flex items-center justify-center px-4 py-2 font-semibold rounded-full ${
                        isDisabled
                            ? 'bg-grayscale-200 text-grayscale-500'
                            : 'bg-indigo-500 text-white'
                    }`}
                    onClick={handleYes}
                    disabled={isDisabled}
                >
                    {isSaving ? (
                        <>
                            <IonSpinner name="crescent" /> Claiming...
                        </>
                    ) : (
                        statusText
                    )}
                </button>
            </div>
        </>
    );
};

export default MessageWithArtifact;
