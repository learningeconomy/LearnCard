import React, { useState } from 'react';

import MarkdownRenderer from '../../ai-assessment/AiAssessment/helpers/MarkdownRenderer';
import { IonSpinner } from '@ionic/react';

import {
    useCreateBoost,
    BoostCategoryOptionsEnum,
    constructCustomBoostType,
    updateArtifactClaimedStatus,
} from 'learn-card-base';
import { getDefaultDisplayType } from '../../boost/boostHelpers';
import { initialBoostCMSState, BoostCMSState } from '../../boost/boost';
import type { ChatMessage } from 'learn-card-base/types/ai-chat';

interface MessageProps {
    message: ChatMessage;
}

export const MessageWithArtifact: React.FC<MessageProps> = ({ message }) => {
    const { mutateAsync: createBoost, isPending } = useCreateBoost();

    const artifact = message?.artifact;
    const title = artifact?.title as string;
    const categoryType = artifact?.category as string;
    const narrative = artifact?.narrative as string;
    const achievementType = constructCustomBoostType(categoryType, title);

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

    const handleYes = () => {
        console.log(state);

        // Update the artifact claimed status to true
        if (artifact?.id) {
            updateArtifactClaimedStatus(artifact.id, true);
        }
    };

    const claimed = artifact?.claimed;
    const statusText = claimed ? 'Claimed' : 'Yes';

    return (
        <>
            <MarkdownRenderer>{message?.artifact?.question}</MarkdownRenderer>
            <button
                className="w-full bg-indigo-500 text-white px-4 py-2 font-semibold rounded-full"
                onClick={handleYes}
            >
                {isPending ? (
                    <IonSpinner name="crescent" color="grayscale-100" className="w-24 h-24" />
                ) : (
                    statusText
                )}
            </button>
        </>
    );
};

export default MessageWithArtifact;
