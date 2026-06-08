import { ConsentFlowContractDetails, VC } from '@learncard/types';
import { CREDENTIAL_CATEGORIES, CredentialCategory, usePrefetchCredentials } from 'learn-card-base';

type PrefetchedCredential = {
    uri?: string;
    data: VC | undefined;
};

const mapPrefetchedCredentials = (credentials: PrefetchedCredential[]) =>
    credentials
        .filter((credential): credential is PrefetchedCredential & { uri: string } =>
            Boolean(credential.uri)
        )
        .map(credential => ({
            uri: credential.uri,
            vc: credential.data,
        }));

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
    const verifiableData = usePrefetchCredentials(
        'VerifiableData',
        requestedCategories.includes('VerifiableData') as boolean
    );

    const allCredentials = [
        ...socialBadges,
        ...achievements,
        ...learningHistory,
        ...workHistory,
        ...skills,
        ...ids,
        ...memberships,
        ...verifiableData,
    ];

    const mappedCredentials: Partial<
        Record<CredentialCategory, { uri: string; vc: VC | undefined }[]>
    > = {
        'Social Badge': mapPrefetchedCredentials(socialBadges),
        Achievement: mapPrefetchedCredentials(achievements),
        'Learning History': mapPrefetchedCredentials(learningHistory),
        'Work History': mapPrefetchedCredentials(workHistory),
        Skill: mapPrefetchedCredentials(skills),
        ID: mapPrefetchedCredentials(ids),
        Membership: mapPrefetchedCredentials(memberships),
        VerifiableData: mapPrefetchedCredentials(verifiableData),
    };

    const anyLoading = allCredentials.some(credential => credential.isLoading);
    const anyDoneLoading = allCredentials.some(
        credential => !credential.isLoading && credential.data
    );

    const totalCredentialsCount = allCredentials.length;

    return { anyLoading, anyDoneLoading, totalCredentialsCount, mappedCredentials };
};
