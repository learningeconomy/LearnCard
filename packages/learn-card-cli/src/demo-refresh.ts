import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { initLearnCard } from '@learncard/init';
import { VCValidator, type UnsignedVC } from '@learncard/types';
import { generateRandomSeed } from './random';
import { out } from './out';
import { resolveServices } from './project';
import { getRefreshDemoUiConfig } from './demo-refresh-ui';

export interface RefreshDemoOptions {
    network?: string;
    yes?: boolean;
    json?: boolean;
    didkit?: Promise<Buffer>;
    ui?: boolean;
    appUrl?: string;
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
    if (options.ui && !interactive) {
        throw new Error(
            '--ui requires an interactive terminal; omit --yes, --json, and LC_YES=1 so you can claim and refresh in the app.'
        );
    }
    if (options.appUrl && !options.ui) throw new Error('--app-url requires --ui.');
    const ui = options.ui
        ? await getRefreshDemoUiConfig(options.appUrl ?? 'http://localhost:3000', network)
        : undefined;
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
        out.log(
            ui
                ? 'The recipient signs into the local app; keep this terminal open until the demo finishes.'
                : 'Account keys stay in this session; rerunning creates a fresh demonstration.'
        );
        await pause('start');
        out.log('\nSetting up the issuer and recipient...');

        // Trust the explicitly selected demo network for Boost verification.
        const config = {
            network,
            ...(ui && { cloud: { url: ui.cloud } }),
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
        const holderSeed = generateRandomSeed();
        const holder = await initLearnCard({ ...config, seed: holderSeed, network });
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
            ...(ui && { notificationsWebhook: ui.notificationsWebhook, locale: 'en' }),
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

        if (ui) {
            const login = new URL('/developer/sign-in', ui.appOrigin);
            login.searchParams.set('next', '/passport');
            login.hash = `seed=${holderSeed}`;
            out.log(`\nOpen this link to sign in as Refresh Demo Learner:\n${login.href}`);
            out.log(
                'This link controls a disposable demo account. Keep it private and use it only for test data.'
            );
            out.log('If already signed in, choose the demo account switch. Keep the app open.');
            await pause('send the certificate after signing in');
        }

        step = 'send the refreshable badge';
        out.log('\n1 / 3  SEND A BADGE');
        out.log('Sending through sendBoost with refresh enabled...');
        const boostUri = await issuer.invoke.createBoost(template, { category: 'Achievement' });
        const sent = await issuer.invoke.sendBoost(recipientProfileId, boostUri, {
            enableRefresh: true,
        });
        if (!sent?.refresh) throw new Error('The SDK did not return a refresh receipt.');
        const { credentialUri, refresh } = sent;
        if (!ui && !(await holder.invoke.acceptCredential(credentialUri))) {
            throw new Error('The recipient could not accept the badge.');
        }
        const original = VCValidator.parse(await holder.read.get(credentialUri));
        if (original.name !== BEFORE) throw new Error('The delivered badge did not match.');
        out.log(`Recipient sees: "${original.name}"`);

        const readAppCredential = async () => {
            const records = await holder.index.LearnCloud.get({});
            for (const record of records ?? []) {
                const parsed = VCValidator.safeParse(await holder.read.get(record.uri));
                if (parsed.success && parsed.data.id === refresh.credentialId) return parsed.data;
            }
        };

        if (ui) {
            out.log('\nIn the app: reload if needed, open Alerts, then Claim → Accept.');
            out.log('Find Provisional Course Certificate under Passport → Achievements.');
            let claimed = false;
            do {
                await pause('confirm the certificate is saved in the app and publish its update');
                claimed = Boolean(await readAppCredential());
                if (!claimed) {
                    out.log(
                        'The certificate is not saved in the demo account yet. Finish Claim → Accept in the app first.'
                    );
                }
            } while (!claimed);
        }

        if (!ui) await pause('publish the final certificate');
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

        if (ui) {
            step = 'confirm the app refreshed the certificate';
            out.log('\n3 / 3  REFRESH IN THE APP');
            out.log(
                'Reload the app, open Alerts, and select “Refresh Demo School updated one of your credentials.”'
            );
            out.log(
                'The app should open Final Course Certificate. Its existing Passport entry is updated.'
            );
            let appUpdated = false;
            do {
                await pause('confirm the final certificate is visible');
                const current = await readAppCredential();
                if (current?.name !== AFTER) {
                    out.log(
                        'The app still has the original copy. Tap the update notification and wait for the final certificate.'
                    );
                    continue;
                }
                const check = await holder.invoke.verifyCredential(current);
                if (
                    check.errors.length ||
                    check.warnings.length ||
                    !check.checks.includes('proof')
                ) {
                    throw new Error('The app’s updated certificate did not pass verification.');
                }
                appUpdated = true;
            } while (!appUpdated);
            out.log(
                '\nVerified: the app saved the final certificate under the same credential identity. Sent once.'
            );
            out.log(
                'You can close this terminal; the recipient stays signed in. Rerun --ui for a fresh demo.'
            );
            out.set({
                network,
                credentialUri,
                refreshId: refresh.refreshId,
                before: BEFORE,
                after: AFTER,
                version: published.version,
                status: 'updated',
                sameCredentialId: true,
                ui: true,
            });
            return;
        }

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
