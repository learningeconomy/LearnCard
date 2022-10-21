import { initLearnCard } from '@learncard/core';
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
	const { name, description, criteria, image } = template;
	return {
		'@context': [
			'https://www.w3.org/2018/credentials/v1',
			'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
		],
		type: ['VerifiableCredential', 'OpenBadgeCredential'],
		issuer,
		issuanceDate: new Date().toISOString(),
		credentialSubject: {
			type: 'AchievementSubject',
			id: didSubject,
			achievement: {
				type: 'Achievement',
				name,
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
		const issuer = await initLearnCard({ seed: issuerConfig.seed });

		const unsignedVc = constructCredentialForSubject(
			issuer.did('key'),
			credentialTemplate,
			subjectDID
		);

		const vc = await issuer.issueCredential(unsignedVc);
		const streamId = await issuer.publishCredential(vc);

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
				`Hello 👋! You have received a credential: **${credentialTemplate.name}** 🎉 \n To claim the credential, you need to setup your wallet or LearnCard. \n\n Please run \`/register-did\` to complete setup 🚧 `
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