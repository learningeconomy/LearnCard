import { ConsentFlowContractDetails, VC } from '@learncard/types';
import { CREDENTIAL_CATEGORIES, CredentialCategory, usePrefetchCredentials } from 'learn-card-base';

export const useConsentFlowCredentials = (contractDetails?: ConsentFlowContractDetails) => {
    const requestedCategories = CREDENTIAL_CATEGORIES.filter(category =>
        Object.keys(contractDetails?.contract.read.credentials.categories ?? {}).includes(category)
    );

    const socialBadges = usePrefetchCredentials(
        'Social Badge',
        requestedCategories.includes('Social Badge')
    );
    const achievements = usePrefetchCredentials(
        'Achievement',
        requestedCategories.includes('Achievement')
    );
    const learningHistory = usePrefetchCredentials(
        'Learning History',
        requestedCategories.includes('Learning History')
    );
    const workHistory = usePrefetchCredentials(
        'Work History',
        requestedCategories.includes('Work History')
    );
    const skills = usePrefetchCredentials('Skill', requestedCategories.includes('Skill'));
    const ids = usePrefetchCredentials('ID', requestedCategories.includes('ID'));
    const memberships = usePrefetchCredentials(
        'Membership',
        requestedCategories.includes('Membership')
    );

    const allCredentials = [
        ...socialBadges,
        ...achievements,
        ...learningHistory,
        ...workHistory,
        ...skills,
        ...ids,
        ...memberships,
    ];

    const mappedCredentials: Record<CredentialCategory, { uri: string; vc: VC | undefined }[]> = {
        'Social Badge': socialBadges.map(credential => ({
            uri: credential.uri,
            vc: credential.data,
        })),
        Achievement: achievements.map(credential => ({ uri: credential.uri, vc: credential.data })),
        'Learning History': learningHistory.map(credential => ({
            uri: credential.uri,
            vc: credential.data,
        })),
        'Work History': workHistory.map(credential => ({
            uri: credential.uri,
            vc: credential.data,
        })),
        Skill: skills.map(credential => ({ uri: credential.uri, vc: credential.data })),
        ID: ids.map(credential => ({ uri: credential.uri, vc: credential.data })),
        Membership: memberships.map(credential => ({ uri: credential.uri, vc: credential.data })),
        Hidden: [],
    };

    const anyLoading = allCredentials.some(credential => credential.isLoading);
    const anyDoneLoading = allCredentials.some(
        credential => !credential.isLoading && credential.data
    );

    const totalCredentialsCount = allCredentials.length;

    return { anyLoading, anyDoneLoading, totalCredentialsCount, mappedCredentials };
};
