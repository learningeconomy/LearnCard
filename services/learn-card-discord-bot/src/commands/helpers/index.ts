import { initLearnCard } from '@learncard/init';
import { getDIDForSource } from '../../accesslayer/didregistry/read';
import {
    getCredentialTemplates,
    getCredentialTemplateById,
} from '../../accesslayer/credentialtemplates/read';

import {
    CredentialTemplate,
    IssuerConfig,
    SendCredentialResponse,
    SendCredentialData,
} from '../../types';
import { getIssuerConfigById, getIssuerConfigs } from '../../accesslayer/issuers/read';
import { createPendingVc } from '../../accesslayer/pendingvcs/create';
import { getPendingVcs } from '../../accesslayer/pendingvcs/read';

export const constructCredentialForSubject = (
    issuer: string | object,
    template: CredentialTemplate,
    didSubject: string
) => {
    const { _id, name, description, criteria, image, type } = template;
    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://imsglobal.github.io/openbadges-specification/context.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name,
        issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            type: ['AchievementSubject'],
            id: didSubject,
            achievement: {
                type: ['Achievement'],
                achievementType: type,
                name,
                id: _id,
                description,
                criteria: {
                    type: 'Criteria',
                    narrative: criteria,
                },
                image,
            },
        },
    };
};

export const sendCredentialToSubject = async (
    issuerConfigId: string,
    subjectId: string,
    templateId: string,
    interaction: Interaction,
    context: Context,
    guildId?: string
): Promise<SendCredentialResponse> => {
    if (!guildId) guildId = interaction.guildId;

    const issuerConfig = await getIssuerConfigById(issuerConfigId, context, guildId);
    const credentialTemplate = await getCredentialTemplateById(templateId, context, guildId);
    const subjectDID = await getDIDForSource(subjectId, context);

    console.log('Issuing credential for subject.', credentialTemplate, subjectDID);

    let data: SendCredentialData = {
        credentialTemplate,
        subjectDID,
    };
    let error;

    if (!subjectDID) {
        data.pendingVc = {
            guildId: interaction.guildId,
            issuerConfigId,
            subjectId,
            credentialTemplateId: templateId,
        };

        await createPendingVc(data.pendingVc, context, subjectId);
    } else {
        const issuerLC = await initLearnCard({ seed: issuerConfig.seed });

        const issuerProfile = issuerConfig.issuer;
        const issuer = {
            type: 'Profile',
            id: issuerLC.id.did('key'),
            name: issuerProfile.name,
            url: issuerProfile.url,
            image: issuerProfile.image,
        };

        const unsignedVc = constructCredentialForSubject(issuer, credentialTemplate, subjectDID);

        const vc = await issuerLC.invoke.issueCredential(unsignedVc);
        const streamId = await issuerLC.store.Ceramic.upload(vc);

        data.claimCredentialLink = `https://learncard.app/claim-credential/${streamId}`;
    }

    let subjectUser;
    try {
        subjectUser = await context.client.users.fetch(subjectId);
        data.subjectUserName = subjectUser.username;

        if (data.claimCredentialLink) {
            subjectUser.send(
                `Hello 👋! You have received a credential: **${credentialTemplate.name}** 🎉 \n\n Click this link to claim: ${data.claimCredentialLink}`
            );
        } else {
            subjectUser.send(
                `Hello 👋! You have received a credential: **${credentialTemplate.name}** 🎉 \n To claim the credential, you need to setup your wallet or LearnCard. \n\n Please run \`/start-connect-id\` to complete setup 🚧\n\n*Need help?* Check out the guide: https://docs.learncard.com/learncard-services/discord-bot/register-learncard-did  `
            );
        }
    } catch (e: object | undefined) {
        console.error('Error sending message to user.', e);
        error = e;
    }

    return {
        data,
        error,
    };
};

export const sendPendingVCsToSubject = async (
    subjectId: string,
    interaction: Interaction,
    context: Context
): Promise<SendCredentialResponse[]> => {
    const pendingVCs = await getPendingVcs(context, subjectId);

    return Promise.all(
        pendingVCs.map(async pendingVC =>
            sendCredentialToSubject(
                pendingVC.issuerConfigId,
                subjectId,
                pendingVC.credentialTemplateId,
                interaction,
                context,
                pendingVC.guildId
            )
        )
    );
};

export const getCredentialTypeOptions = () => {
    return [
        {
            label: 'Generic Achievement',
            description: 'Achievements',
            value: 'Achievement',
        },
        {
            label: 'Formal Award',
            description: 'Achievements',
            value: 'Award',
        },
        {
            label: 'Badge',
            description: 'Achievements',
            value: 'Badge',
        },
        {
            label: 'Community Service',
            description: 'Achievements',
            value: 'CommunityService',
        },
        {
            label: 'License',
            description: 'IDs',
            value: 'License',
        },
        {
            label: 'Membership',
            description: 'IDs',
            value: 'Membership',
        },
        {
            label: 'Assessment',
            description: 'Skills',
            value: 'Assessment',
        },
        {
            label: 'Certificate',
            description: 'Skills',
            value: 'Certificate',
        },
        {
            label: 'Certification',
            description: 'Skills',
            value: 'Certification',
        },
        {
            label: 'Competency',
            description: 'Skills',
            value: 'Competency',
        },
        {
            label: 'Micro-Credential',
            description: 'Skills',
            value: 'MicroCredential',
        },
        {
            label: 'Assignment',
            description: 'Learning History',
            value: 'Assignment',
        },
        {
            label: 'Course',
            description: 'Learning History',
            value: 'Course',
        },
        {
            label: 'Degree',
            description: 'Learning History',
            value: 'Degree',
        },
        {
            label: 'Diploma',
            description: 'Learning History',
            value: 'Diploma',
        },
        {
            label: 'Learning Program',
            description: 'Learning History',
            value: 'LearningProgram',
        },
        {
            label: 'Apprenticeship Certificate',
            description: 'Work History',
            value: 'ApprenticeshipCertificate',
        },
        {
            label: 'Fieldwork',
            description: 'Work History',
            value: 'Fieldwork',
        },
        {
            label: 'Journeyman Certificate',
            description: 'Work History',
            value: 'JourneymanCertificate',
        },
        {
            label: 'Master Certificate',
            description: 'Work History',
            value: 'MasterCertificate',
        },
    ];
};
