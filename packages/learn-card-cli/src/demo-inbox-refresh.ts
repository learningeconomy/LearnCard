import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import type { AddPlugin } from '@learncard/core';
import { initLearnCard, type NetworkLearnCardFromSeed } from '@learncard/init';
import { getLCAPlugin, type LCAPlugin } from '@learncard/lca-api-plugin';
import { getClient } from '@learncard/network-brain-client';
import {
    VCValidator,
    type InboxCredentialRefreshReceipt,
    type UnsignedVC,
    type VC,
    type VP,
} from '@learncard/types';
import { generateRandomSeed } from './random';
import { out } from './out';
import { resolveServices } from './project';
import { getRefreshDemoUiConfig, requireLoopbackUrl } from './demo-refresh-ui';

export interface InboxRefreshDemoOptions {
    network?: string;
    yes?: boolean;
    json?: boolean;
    didkit?: Promise<Buffer>;
    ui?: boolean;
    appUrl?: string;
    lcaUrl?: string;
}

type InboxIssuer = AddPlugin<NetworkLearnCardFromSeed['returnValue'], LCAPlugin>;

const LOCAL_NETWORK = 'http://localhost:4000/trpc';
const DEFAULT_LCA = 'http://localhost:5100/trpc';
const BEFORE = 'Provisional Course Certificate';
const AFTER = 'Final Course Certificate';
const HONORS = 'Honors Course Certificate';
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** The generated claim link is served by the backend; the app serves the same path. */
export const mapInboxClaimPath = (claimUrl: string): string => {
    let url: URL;
    try {
        url = new URL(claimUrl);
    } catch {
        throw new Error('The inbox claim link was not a valid URL.');
    }
    if (!/^\/interactions\/inbox-claim\/[^/]+$/.test(url.pathname)) {
        throw new Error('The inbox claim link had an unexpected path; refusing to open it.');
    }
    return `${url.pathname}${url.search}`;
};

/** Sign in and claim links for the same local app, from the fragments the CLI knows. */
export const buildInboxAppLinks = (
    appOrigin: string,
    claimPath: string,
    seed: string
): { signIn: string; claim: string } => {
    const signIn = new URL('/developer/sign-in', appOrigin);
    signIn.searchParams.set('next', claimPath);
    signIn.hash = `seed=${seed}`;
    return { signIn: signIn.href, claim: new URL(claimPath, appOrigin).href };
};

const baseTemplate = (issuerDid: string): UnsignedVC => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    name: BEFORE,
    issuer: issuerDid,
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Introduction to Biology — Provisional Results',
            description: 'Coursework submitted. Final grade: Pending. Results await review.',
            criteria: {
                narrative: 'Final results require review of coursework and the final assessment.',
            },
        },
    },
});

/**
 * Rebuild a complete unsigned version from the issuer's own template and the
 * metadata-only receipt. The issuer cannot read the credential encrypted for the
 * recipient, so the receipt's identity and status descriptors are the source of truth.
 */
const buildVersion = (
    template: UnsignedVC,
    receipt: InboxCredentialRefreshReceipt,
    boostUri: string,
    input: {
        name: string;
        achievementName: string;
        achievementDescription: string;
        holderDid?: string;
    }
): UnsignedVC => {
    // The base template always carries a single AchievementSubject; narrow the
    // validator's union so updates can replace the achievement in place.
    const subject = template.credentialSubject as Record<string, unknown> & {
        achievement?: Record<string, unknown>;
    };

    return {
        ...template,
        name: input.name,
        id: receipt.credentialId,
        issuer: receipt.issuerDid,
        boostId: boostUri,
        validFrom: new Date().toISOString(),
        refreshService: receipt.refreshService,
        ...(receipt.credentialStatus && { credentialStatus: receipt.credentialStatus }),
        credentialSubject: {
            ...subject,
            ...(input.holderDid && { id: input.holderDid }),
            achievement: {
                ...subject.achievement,
                name: input.achievementName,
                description: input.achievementDescription,
            },
        },
    };
};

/**
 * Guided Universal Inbox refresh demonstration (LC-2198).
 *
 * Stage 1 issues a refreshable credential to an email address that has no account.
 * Stage 2 publishes a new version before anyone claims. UI mode then has a human claim
 * in the real app and publish an update to the now-bound holder; terminal mode makes the
 * same claim with DIDAuth and refreshes the local wallet itself.
 */
export const runInboxRefreshDemo = async (options: InboxRefreshDemoOptions): Promise<void> => {
    const { network, lcaAPI: envLca } = resolveServices({}, options.network || LOCAL_NETWORK);
    const networkUrl = new URL(network);
    if (!LOOPBACK_HOSTS.includes(networkUrl.hostname)) {
        throw new Error(
            'The inbox demo is local-only. Use a loopback --network (for example http://localhost:4000/trpc).'
        );
    }
    const interactive =
        !options.yes && !options.json && !!process.stdin.isTTY && process.env.LC_YES !== '1';
    if (options.ui && !interactive) {
        throw new Error(
            '--ui requires an interactive terminal; omit --yes, --json, and LC_YES=1 so you can claim in the app.'
        );
    }
    if (options.appUrl && !options.ui) throw new Error('--app-url requires --ui.');
    if (options.lcaUrl && options.ui)
        throw new Error(
            '--lca-url is for terminal mode; --ui reads the local LCA service from the app.'
        );
    const ui = options.ui
        ? await getRefreshDemoUiConfig(options.appUrl ?? 'http://localhost:3000', network)
        : undefined;
    const lca = ui
        ? requireLoopbackUrl(ui.lcaApi, 'App LCA service')
        : requireLoopbackUrl(options.lcaUrl ?? envLca ?? DEFAULT_LCA, '--lca-url');
    const prompts = interactive
        ? createInterface({ input: process.stdin, output: process.stdout })
        : undefined;
    const pause = async (next: string): Promise<void> => {
        if (prompts) await prompts.question(`\nPress Enter to ${next}... `);
    };
    let step = 'connect to the demo network';

    try {
        out.log('\nLearnCard: watch a credential refresh through the Universal Inbox\n');
        out.log(`Network: ${network}`);
        out.log(`Inbox claim service: ${lca.href}`);
        out.log(
            'This creates a fresh demo school and a recipient address that does not exist yet.'
        );
        out.log('No email is sent; the claim link stays in this demo.');
        await pause('start');
        out.log('\nSetting up the issuer and signing authority...');

        const config = {
            network,
            ...(options.didkit && { didkit: options.didkit }),
            trustedBoostRegistry: `data:application/json,${encodeURIComponent(
                JSON.stringify([
                    {
                        id: 'Inbox demo network',
                        url: networkUrl.origin,
                        did: `did:web:${encodeURIComponent(networkUrl.host)}`,
                    },
                ])
            )}`,
        };
        const issuerBase = await initLearnCard({ ...config, seed: generateRandomSeed(), network });
        const issuer = (await issuerBase.addPlugin(
            await getLCAPlugin(
                issuerBase as unknown as Parameters<typeof getLCAPlugin>[0],
                lca.href
            )
        )) as unknown as InboxIssuer;
        const suffix = randomUUID().slice(0, 8);
        await issuer.invoke.createProfile({
            profileId: `inbox-issuer-${suffix}`,
            displayName: 'Inbox Demo School',
            bio: '',
            shortBio: '',
        });

        step = 'register a signing authority';
        const authority = await issuer.invoke.createSigningAuthority(`inbox-demo-${suffix}`);
        if (!authority || !authority.endpoint || !authority.did) {
            throw new Error('The LCA service did not return a signing authority.');
        }
        if (
            !(await issuer.invoke.registerSigningAuthority(
                authority.endpoint,
                authority.name,
                authority.did
            ))
        ) {
            throw new Error('Could not register the signing authority.');
        }
        if (
            !(await issuer.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint,
                authority.name
            ))
        ) {
            throw new Error('Could not select the signing authority.');
        }
        const signingAuthority = { endpoint: authority.endpoint, name: authority.name };
        const template = baseTemplate(issuer.id.did());
        const boostUri = await issuer.invoke.createBoost(template, { category: 'Achievement' });

        const demoEmail = `inbox-demo-${suffix}@example.com`;
        step = 'issue the provisional certificate into the inbox';
        out.log('\n1 / 4  ISSUE PROVISIONAL RESULTS');
        out.log(`Queuing a provisional certificate for ${demoEmail}.`);
        out.log('This address has no LearnCard account yet, so there is nobody to notify.');
        const issued = await issuer.invoke.sendCredentialViaInbox({
            recipient: { type: 'email', value: demoEmail },
            templateUri: boostUri,
            refresh: true,
            idempotencyKey: `inbox-demo-issue-${suffix}`,
            configuration: {
                signingAuthority,
                delivery: { suppress: true },
            },
        });
        const receipt = issued.refresh;
        if (issued.status !== 'PENDING')
            throw new Error(`Expected a PENDING inbox credential, received ${issued.status}.`);
        if (!receipt) throw new Error('The SDK did not return an inbox refresh receipt.');
        if (receipt.holderDid) throw new Error('A holder was bound before anyone claimed.');
        if (!issued.claimUrl) throw new Error('The SDK did not return a claim link.');
        out.log(
            'Provisional results are queued for the demo address. The recipient has not joined.'
        );

        step = 'publish final results before claim';
        out.log('\n2 / 4  PUBLISH FINAL RESULTS (BEFORE ANY CLAIM)');
        out.log('The school finalizes the certificate while the recipient still has no account...');
        const finalVersion = buildVersion(template, receipt, boostUri, {
            name: AFTER,
            achievementName: 'Introduction to Biology — Final Results',
            achievementDescription:
                'Course completed. Final grade: A. Coursework and final assessment reviewed.',
        });
        const finalPublication = await issuer.invoke.publishCredentialRefresh({
            refreshId: receipt.refreshId,
            mode: 'signing-authority',
            credential: finalVersion,
            signingAuthority: { type: 'http', ...signingAuthority },
            updateSummary: 'Final results are ready. Final grade: A.',
            idempotencyKey: `inbox-demo-final-${suffix}`,
        });
        if (finalPublication.version !== 2)
            throw new Error(`Expected version 2, received ${finalPublication.version}.`);
        if (finalPublication.notification !== 'not-applicable')
            throw new Error(
                `Expected no pre-claim notification, received ${finalPublication.notification}.`
            );
        out.log('Version 2 is queued. Claiming will deliver the newest content, not the original.');

        if (ui) {
            step = 'prepare the recipient app session';
            out.log('\n3 / 4  CLAIM IN THE APP');
            out.log(
                'Creating the recipient demo account now that the pre-claim update is published...'
            );
            const holderSeed = generateRandomSeed();
            const holder = await initLearnCard({
                ...config,
                seed: holderSeed,
                network,
                cloud: { url: ui.cloud },
            });
            await holder.invoke.createProfile({
                profileId: `inbox-learner-${suffix}`,
                displayName: 'Inbox Demo Learner',
                bio: '',
                shortBio: '',
                notificationsWebhook: ui.notificationsWebhook,
                locale: 'en',
            });
            const claimPath = mapInboxClaimPath(issued.claimUrl);
            const links = buildInboxAppLinks(ui.appOrigin, claimPath, holderSeed);
            out.log(`\nOpen this link to sign in as Inbox Demo Learner:\n${links.signIn}`);
            out.log(`Claim link for the same app:\n${links.claim}`);
            out.log(
                'This link controls a disposable demo account. Keep it private and use it only for test data.'
            );
            out.log(
                'This first delivery arrives as a claim link, not an alert: the recipient did not exist when it was issued.'
            );
            out.log('If already signed in, choose the demo account switch. Keep the app open.');

            const readAppCredentials = async (): Promise<VC[]> => {
                const records = await holder.index.LearnCloud.get({});
                const matches: VC[] = [];
                for (const record of records ?? []) {
                    const parsed = VCValidator.safeParse(await holder.read.get(record.uri));
                    if (parsed.success && parsed.data.id === receipt.credentialId)
                        matches.push(parsed.data);
                }
                return matches;
            };
            const verifySaved = async (credential: VC, expected: string): Promise<void> => {
                if (credential.name !== expected)
                    throw new Error('The app saved a different version than expected.');
                const proof = await holder.invoke.verifyCredential(credential);
                if (
                    proof.errors.length ||
                    proof.warnings.length ||
                    !proof.checks.includes('proof')
                ) {
                    throw new Error('The app’s certificate did not pass verification.');
                }
            };

            let claimed = false;
            do {
                await pause('open the claim link, sign in, and confirm the certificate is claimed');
                const matches = await readAppCredentials();
                if (matches.length === 0) {
                    out.log(
                        'The credential is not saved in the demo account yet. Finish the claim first.'
                    );
                    continue;
                }
                if (matches.length > 1) {
                    out.log(
                        'The app has more than one copy of this credential. Remove extras first.'
                    );
                    continue;
                }
                const saved = matches[0]!;
                if (saved.name !== AFTER) {
                    out.log('The app still shows an older version. Finish the claim, then retry.');
                    continue;
                }
                await verifySaved(saved, AFTER);
                claimed = true;
            } while (!claimed);
            out.log('Final results are saved under the credential ID from the receipt.');

            step = 'publish honors results to the claimed holder';
            out.log('\n4 / 4  PUBLISH HONORS RESULTS');
            const metadata = await issuer.invoke.getInboxCredential(issued.issuanceId);
            const holderDid = metadata?.refresh?.holderDid;
            if (!holderDid)
                throw new Error('The claim did not bind a holder DID to the refresh receipt.');
            const honorsVersion = buildVersion(template, receipt, boostUri, {
                name: HONORS,
                achievementName: 'Introduction to Biology — Honors Results',
                achievementDescription:
                    'Outstanding work. Final grade: A+. Coursework and final assessment reviewed with distinction.',
                holderDid,
            });
            const honorsPublication = await issuer.invoke.publishCredentialRefresh({
                refreshId: receipt.refreshId,
                mode: 'signing-authority',
                credential: honorsVersion,
                signingAuthority: { type: 'http', ...signingAuthority },
                updateSummary: 'Honors results are ready. Final grade: A+.',
                idempotencyKey: `inbox-demo-honors-${suffix}`,
            });
            if (honorsPublication.version !== 3)
                throw new Error(`Expected version 3, received ${honorsPublication.version}.`);
            out.log('The update is queued to the claimed holder.');

            let updated = false;
            do {
                await pause(
                    'tap the update notification in the app, then confirm the honors certificate'
                );
                const matches = await readAppCredentials();
                if (matches.length === 0) {
                    out.log(
                        'The update is not saved in the app yet. Tap the notification and wait.'
                    );
                    continue;
                }
                if (matches.length > 1) {
                    out.log('The app created a duplicate instead of updating the existing entry.');
                    continue;
                }
                const saved = matches[0]!;
                if (saved.name !== HONORS) {
                    out.log('The app still shows final results. Tap the update notification.');
                    continue;
                }
                await verifySaved(saved, HONORS);
                updated = true;
            } while (!updated);
            out.log(
                '\nVerified: the app replaced the same credential entry with the honors certificate.'
            );
            out.log('You can close this terminal; the recipient stays signed in.');
            out.set({
                network,
                issuanceId: issued.issuanceId,
                refreshId: receipt.refreshId,
                before: AFTER,
                after: HONORS,
                version: honorsPublication.version,
                status: 'updated',
                sameCredentialId: true,
                ui: true,
            });
            return;
        }

        step = 'claim the provisional certificate with DIDAuth';
        out.log('\n3 / 4  CLAIM THE PROVISIONAL CERTIFICATE');
        out.log('Claiming with a fresh local wallet, exactly as the app does...');
        const holder = await initLearnCard({ ...config, seed: generateRandomSeed(), network });
        const client = await getClient(
            network,
            async (challenge?: string) =>
                (await holder.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge })) as string
        );
        const localExchangeId = new URL(issued.claimUrl).pathname.split('/').pop();
        if (!localExchangeId) throw new Error('The claim link did not include an exchange id.');
        const challenge = await client.workflows.participateInExchange.mutate({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const vp = (await holder.invoke.getDidAuthVp({
            challenge: challenge.verifiablePresentationRequest?.challenge,
            domain: challenge.verifiablePresentationRequest?.domain,
        })) as VP;
        const claim = await client.workflows.participateInExchange.mutate({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });
        const claimedCredentials = claim.verifiablePresentation?.verifiableCredential;
        const claimed = (
            Array.isArray(claimedCredentials) ? claimedCredentials[0] : claimedCredentials
        ) as VC | undefined;
        if (!claimed) throw new Error('The claim did not return a credential.');
        if (claimed.id !== receipt.credentialId)
            throw new Error('The claim returned a different credential identity.');
        if (claimed.name !== AFTER)
            throw new Error(`The claim returned an unexpected version: ${claimed.name}.`);
        await holder.invoke.resolveDid(receipt.issuerDid, { noCache: true });
        const proof = await holder.invoke.verifyCredential(claimed);
        if (proof.errors.length || proof.warnings.length || !proof.checks.includes('proof')) {
            throw new Error('The claimed certificate did not pass verification.');
        }
        out.log('Claimed and verified: same credential ID, final grade A, valid proof.');

        step = 'publish honors results to the bound holder';
        out.log('\n4 / 4  PUBLISH HONORS RESULTS');
        const metadata = await issuer.invoke.getInboxCredential(issued.issuanceId);
        const holderDid = metadata?.refresh?.holderDid;
        if (!holderDid)
            throw new Error('The claim did not bind a holder DID to the refresh receipt.');
        if (holderDid !== holder.id.did())
            throw new Error('The bound holder DID did not match the claiming wallet.');
        const honorsVersion = buildVersion(template, receipt, boostUri, {
            name: HONORS,
            achievementName: 'Introduction to Biology — Honors Results',
            achievementDescription:
                'Outstanding work. Final grade: A+. Coursework and final assessment reviewed with distinction.',
            holderDid,
        });
        const honorsPublication = await issuer.invoke.publishCredentialRefresh({
            refreshId: receipt.refreshId,
            mode: 'signing-authority',
            credential: honorsVersion,
            signingAuthority: { type: 'http', ...signingAuthority },
            updateSummary: 'Honors results are ready. Final grade: A+.',
            idempotencyKey: `inbox-demo-honors-${suffix}`,
        });
        if (honorsPublication.version !== 3)
            throw new Error(`Expected version 3, received ${honorsPublication.version}.`);

        out.log('Refreshing the recipient’s copy...');
        const refreshed = await holder.invoke.refreshCredential(claimed, {
            allowInsecureHttp: true,
            allowPrivateAddresses: true,
            maxRedirects: 0,
        });
        if (refreshed.status !== 'updated')
            throw new Error(`Refresh did not return an update (${refreshed.status}).`);
        if (refreshed.credential.name !== HONORS || refreshed.credential.id !== claimed.id) {
            throw new Error('The refreshed certificate did not match the published update.');
        }
        out.log(`\nBefore: "${claimed.name}"`);
        out.log(`After:  "${refreshed.credential.name}"`);
        out.log('Verified update. Same credential identity. Claimed once.');
        out.set({
            network,
            issuanceId: issued.issuanceId,
            refreshId: receipt.refreshId,
            before: BEFORE,
            after: refreshed.credential.name,
            version: honorsPublication.version,
            notification: honorsPublication.notification,
            status: refreshed.status,
            sameCredentialId: true,
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message.split('\n')[0] : 'Please try again.';
        throw Object.assign(
            new Error(
                `Could not ${step}: ${detail} Use a running local network with managed refresh and LC-2198 deployed.`
            ),
            { cause: error }
        );
    } finally {
        prompts?.close();
    }
};
