import React from 'react';
import { useLoadingLine } from '../../stores/loadingStore';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

import {
    newCredsStore,
    CredentialCategory,
    CredentialCategoryEnum,
    useGetCredentialCount,
    useGetCredentialsForSkills,
    useGetAllAiTopicCredentials,
    useAiInsightCredential,
} from 'learn-card-base';
import useAlignments from '../../hooks/useAlignments';

import WalletPageSquare from './WalletPageSquare';
import WalletPageListItem from './WalletPageListItem';

import { mapBoostsToSkills } from '../skills/skills.helpers';
import { quantifyInsights } from '../ai-insights/ai-insights.helpers';

type WalletPageItemWrapperProps = {
    handleClickSquare: (categoryType: CredentialCategoryEnum) => void;
    walletPageItem: {
        categoryId: CredentialCategoryEnum;
        labels: { singular: string; plural: string };
    };
};

const WalletPageItemWrapper: React.FC<WalletPageItemWrapperProps> = ({
    handleClickSquare,
    walletPageItem,
}) => {
    const { categoryId: categoryType } = walletPageItem;
    const viewMode = passportPageStore.use.viewMode();

    let hasNewCredentials = newCredsStore.use.hasNewCredentials(categoryType as CredentialCategory);

    const enableCategoryCount =
        categoryType !== CredentialCategoryEnum.aiInsight &&
        categoryType !== CredentialCategoryEnum.skill;
    const enableAiCount = categoryType === CredentialCategoryEnum.aiTopic;
    const enableSkillsCount = categoryType === CredentialCategoryEnum.skill;
    const enableAiInsightCount = categoryType === CredentialCategoryEnum.aiInsight;

    // normal credential count
    const { data, isLoading: loading } = useGetCredentialCount(
        categoryType as CredentialCategory,
        enableCategoryCount
    );

    // ai topic count
    const { data: aiTopicsCount, isLoading: aiTopicsLoading } =
        useGetAllAiTopicCredentials(enableAiCount);

    // skill count
    const { data: skillCreds, isLoading: skillsLoading } =
        useGetCredentialsForSkills(enableSkillsCount);

    const { data: aiInsightCredential, isLoading: aiInsightCredentialLoading } =
        useAiInsightCredential();

    const { alignments } = useAlignments();

    let categoryCount = data !== null && data !== undefined ? Number(data) : 0;
    if (enableAiCount) categoryCount = aiTopicsCount?.length ?? 0;
    if (enableSkillsCount) {
        const skillsMap = mapBoostsToSkills(skillCreds);
        // Calculate total count of skills and subskills
        const totalSkills = Object.values(skillsMap).reduce(
            (total, category) => total + category.length,
            0
        ) as number;
        const totalSubskills = Object.values(skillsMap).reduce(
            (total, category) => total + (category?.totalSubskills || 0),
            0
        ) as number;
        const skillsCount = totalSkills + totalSubskills + (alignments?.length || 0);
        categoryCount = skillsCount;
    } else if (enableAiInsightCount) {
        categoryCount = quantifyInsights(aiInsightCredential?.insights);
    }

    useLoadingLine(loading || aiTopicsLoading || skillsLoading || aiInsightCredentialLoading);

    if (viewMode === PassportPageViewMode.list) {
        return (
            <WalletPageListItem
                handleItemClick={handleClickSquare}
                walletPageItem={walletPageItem}
                count={categoryCount}
                showNewItemIndicator={hasNewCredentials}
                loading={loading}
            />
        );
    }

    return (
        <WalletPageSquare
            handleClickSquare={handleClickSquare}
            walletPageItem={walletPageItem}
            count={categoryCount}
            showNewItemIndicator={hasNewCredentials}
            loading={loading}
        />
    );
};

export default WalletPageItemWrapper;
