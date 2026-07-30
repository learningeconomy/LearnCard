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

    const goals = usePrefetchCredentials('Goals', requestedCategories.includes('Goals'));
    const professionalTitle = usePrefetchCredentials(
        'Professional Title',
        requestedCategories.includes('Professional Title')
    );
    const roleExperience = usePrefetchCredentials(
        'Role Experience',
        requestedCategories.includes('Role Experience')
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
    const workExperience = usePrefetchCredentials(
        'Work Experience',
        requestedCategories.includes('Work Experience')
    );
    const payRate = usePrefetchCredentials('Pay Rate', requestedCategories.includes('Pay Rate'));
    const workLifeBalance = usePrefetchCredentials(
        'Work Life Balance',
        requestedCategories.includes('Work Life Balance')
    );
    const jobStability = usePrefetchCredentials(
        'Job Stability',
        requestedCategories.includes('Job Stability')
    );
    const skills = usePrefetchCredentials('Skill', requestedCategories.includes('Skill'));
    const selfAssignedSkills = usePrefetchCredentials(
        'Self-Assigned Skills',
        requestedCategories.includes('Self-Assigned Skills')
    );
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
        ...goals,
        ...professionalTitle,
        ...roleExperience,
        ...socialBadges,
        ...achievements,
        ...learningHistory,
        ...workHistory,
        ...workExperience,
        ...payRate,
        ...workLifeBalance,
        ...jobStability,
        ...skills,
        ...selfAssignedSkills,
        ...ids,
        ...memberships,
        ...verifiableData,
    ];

    const mappedCredentials: Partial<
        Record<CredentialCategory, { uri: string; vc: VC | undefined }[]>
    > = {
        Goals: mapPrefetchedCredentials(goals),
        'Professional Title': mapPrefetchedCredentials(professionalTitle),
        'Role Experience': mapPrefetchedCredentials(roleExperience),
        'Social Badge': mapPrefetchedCredentials(socialBadges),
        Achievement: mapPrefetchedCredentials(achievements),
        'Learning History': mapPrefetchedCredentials(learningHistory),
        'Work History': mapPrefetchedCredentials(workHistory),
        'Work Experience': mapPrefetchedCredentials(workExperience),
        'Pay Rate': mapPrefetchedCredentials(payRate),
        'Work Life Balance': mapPrefetchedCredentials(workLifeBalance),
        'Job Stability': mapPrefetchedCredentials(jobStability),
        Skill: mapPrefetchedCredentials(skills),
        'Self-Assigned Skills': mapPrefetchedCredentials(selfAssignedSkills),
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
