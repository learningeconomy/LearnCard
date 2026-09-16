import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { initLearnCard } from '@learncard/init';
import { VCValidator, type UnsignedVC } from '@learncard/types';
import { generateRandomSeed } from './random';
import { out } from './out';
import { resolveServices } from './project';

export interface RefreshDemoOptions {
    network?: string;
    yes?: boolean;
    json?: boolean;
    didkit?: Promise<Buffer>;
}

const LOCAL_NETWORK = 'http://localhost:4000/trpc';
const BEFORE = 'Provisional Course Certificate';
const AFTER = 'Final Course Certificate';

/** A real sendBoost lifecycle, narrated for a presenter with no SDK setup required. */
export const runRefreshDemo = async (options: RefreshDemoOptions): Promise<void> => {
    // Use fresh demo identities, independent of the presenter's .env and account.
    const { network } = resolveServices({}, options.network || LOCAL_NETWORK, {});
    const networkUrl = new URL(network);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(networkUrl.hostname);
    const interactive =
        !options.yes && !options.json && !!process.stdin.isTTY && process.env.LC_YES !== '1';
    const prompts = interactive
        ? createInterface({ input: process.stdin, output: process.stdout })
        : undefined;
    const pause = async (next: string): Promise<void> => {
        if (prompts) await prompts.question(`\nPress Enter to ${next}... `);
    };
    let step = 'connect to the demo network';

    try {
        out.log('\nLearnCard: watch a credential refresh\n');
        out.log(`Network: ${network}`);
        out.log('This creates two demo accounts and a badge on this network.');
        out.log('Account keys stay in this session; rerunning creates a fresh demonstration.');
        await pause('start');
        out.log('\nSetting up the issuer and recipient...');

        // Trust the explicitly selected demo network for Boost verification.
        const config = {
            network,
            ...(options.didkit && { didkit: options.didkit }),
            trustedBoostRegistry: `data:application/json,${encodeURIComponent(
                JSON.stringify([
                    {
                        id: 'Refresh demo network',
                        url: networkUrl.origin,
                        did: `did:web:${encodeURIComponent(networkUrl.host)}`,
                    },
                ])
            )}`,
        };
        const issuer = await initLearnCard({ ...config, seed: generateRandomSeed(), network });
        const holder = await initLearnCard({ ...config, seed: generateRandomSeed(), network });
        const suffix = randomUUID().slice(0, 8);
        const recipientProfileId = `refresh-learner-${suffix}`;
        await issuer.invoke.createProfile({
            profileId: `refresh-issuer-${suffix}`,
            displayName: 'Refresh Demo School',
            bio: '',
            shortBio: '',
        });
        await holder.invoke.createProfile({
            profileId: recipientProfileId,
            displayName: 'Refresh Demo Learner',
            bio: '',
            shortBio: '',
        });

        const template: UnsignedVC = {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                'https://ctx.learncard.com/boosts/1.0.1.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
            name: BEFORE,
            issuer: issuer.id.did(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${randomUUID()}`,
                    type: ['Achievement'],
                    name: 'Introduction to Biology',
                    description: 'Completion of Introduction to Biology.',
                    criteria: { narrative: 'Complete the course and final assessment.' },
                },
            },
        };

        step = 'send the refreshable badge';
        out.log('\n1 / 3  SEND A BADGE');
        out.log('Sending through sendBoost with refresh enabled...');
        const boostUri = await issuer.invoke.createBoost(template);
        const sent = await issuer.invoke.sendBoost(recipientProfileId, boostUri, {
            enableRefresh: true,
        });
        if (!sent?.refresh) throw new Error('The SDK did not return a refresh receipt.');
        const { credentialUri, refresh } = sent;
        if (!(await holder.invoke.acceptCredential(credentialUri))) {
            throw new Error('The recipient could not accept the badge.');
        }
        const original = VCValidator.parse(await holder.read.get(credentialUri));
        if (original.name !== BEFORE) throw new Error('The delivered badge did not match.');
        out.log(`Recipient sees: "${original.name}"`);

        await pause('publish the final certificate');
        step = 'publish the updated certificate';
        out.log('\n2 / 3  PUBLISH AN UPDATE');
        out.log('The school finalizes the certificate...');
        // Rebuild solely from the issuer's own claims and the sendBoost receipt.
        // The issuer cannot read the credential encrypted for the recipient.
        const updated = await issuer.invoke.issueCredential({
            ...template,
            name: AFTER,
            id: refresh.credentialId,
            issuer: refresh.issuerDid,
            boostId: boostUri,
            validFrom: new Date().toISOString(),
            refreshService: refresh.refreshService,
            ...(refresh.credentialStatus && { credentialStatus: refresh.credentialStatus }),
            credentialSubject: { ...template.credentialSubject, id: refresh.holderDid },
        });
        const published = await issuer.invoke.publishCredentialRefresh({
            mode: 'issuer-signed',
            refreshId: refresh.refreshId,
            signedCredential: updated,
            updateSummary: 'Final course certificate is ready.',
            idempotencyKey: `demo-final-${suffix}`,
        });
        if (published.version !== 2) throw new Error('Expected to publish version 2.');
        out.log('Version 2 is available. No second badge was sent.');
        out.log(`Recipient's existing copy still says: "${original.name}"`);

        await pause('refresh the recipient’s copy');
        step = 'refresh the recipient’s copy';
        out.log('\n3 / 3  REFRESH THE RECIPIENT’S COPY');
        out.log('Checking for an update and verifying the new credential...');
        // Local HTTP is allowed only for this generated credential on the selected
        // loopback origin. Hosted demos retain the SDK's default transport guards.
        if (local && new URL(refresh.refreshService.id).origin !== networkUrl.origin) {
            throw new Error('The refresh service does not match the selected local network.');
        }
        const refreshed = await holder.invoke.refreshCredential(
            original,
            local
                ? { allowInsecureHttp: true, allowPrivateAddresses: true, maxRedirects: 0 }
                : undefined
        );
        if (refreshed.status !== 'updated') {
            throw new Error(`Refresh did not return an update (${refreshed.status}).`);
        }
        if (refreshed.credential.name !== AFTER || refreshed.credential.id !== original.id) {
            throw new Error('The refreshed certificate did not match the published update.');
        }
        out.log(`\nBefore: "${original.name}"`);
        out.log(`After:  "${refreshed.credential.name}"`);
        out.log('Verified update. Same credential identity. Sent once.');
        out.log(
            'The updated copy is shown in this session; this demo does not save it in the app.'
        );
        out.set({
            network,
            credentialUri,
            refreshId: refresh.refreshId,
            before: original.name,
            after: refreshed.credential.name,
            version: published.version,
            status: refreshed.status,
            sameCredentialId: true,
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message.split('\n')[0] : 'Please try again.';
        throw Object.assign(
            new Error(
                `Could not ${step}: ${detail} Use a running network with managed refresh and LC-2198 deployed.`
            ),
            { cause: error }
        );
    } finally {
        prompts?.close();
    }
};
