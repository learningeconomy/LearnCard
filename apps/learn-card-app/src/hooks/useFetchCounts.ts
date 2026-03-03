import {
    CredentialCategoryEnum,
    useCountBoosts,
    useGetAllAiTopicCredentials,
    useGetCredentialsForSkills,
} from 'learn-card-base';

export const useFetchCounts = () => {
    const { data: aiTopicsCount, refetch: refetchAiTopics } = useGetAllAiTopicCredentials(true);
    const { data: skillsCount, refetch: refetchSkills } = useGetCredentialsForSkills(true);
    const { data: socialBadgesCount, refetch: refetchSocialBadges } = useCountBoosts(
        CredentialCategoryEnum.socialBadge
    );
    const { data: achievementsCount, refetch: refetchAchievements } = useCountBoosts(
        CredentialCategoryEnum.achievement
    );
    const { data: learningHistoryCount, refetch: refetchLearningHistory } = useCountBoosts(
        CredentialCategoryEnum.learningHistory
    );
    const { data: accomplishmentCount, refetch: refetchAccomplishment } = useCountBoosts(
        CredentialCategoryEnum.accomplishment
    );
    const { data: accommodationCount, refetch: refetchAccommodation } = useCountBoosts(
        CredentialCategoryEnum.accommodation
    );
    const { data: workHistoryCount, refetch: refetchWorkHistory } = useCountBoosts(
        CredentialCategoryEnum.workHistory
    );
    const { data: familyCount, refetch: refetchFamily } = useCountBoosts(
        CredentialCategoryEnum.family
    );
    const { data: idCount, refetch: refetchId } = useCountBoosts(CredentialCategoryEnum.id);

    const refetchAll = async () => {
        await refetchAiTopics();
        await refetchSkills();
        await refetchSocialBadges();
        await refetchAchievements();
        await refetchLearningHistory();
        await refetchAccomplishment();
        await refetchAccommodation();
        await refetchWorkHistory();
        await refetchFamily();
        await refetchId();
    };

    return {
        aiTopicsCount,
        skillsCount,
        socialBadgesCount,
        achievementsCount,
        learningHistoryCount,
        accomplishmentCount,
        accommodationCount,
        workHistoryCount,
        familyCount,
        idCount,
        refetchAll,
    };
};

export default useFetchCounts;
