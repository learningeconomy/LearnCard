import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import type { AddPlugin } from '@learncard/core';
import { initLearnCard, type NetworkLearnCardFromSeed } from '@learncard/init';
import { getLCAPlugin, type LCAPlugin } from '@learncard/lca-api-plugin';
import { getClient } from '@learncard/network-brain-client';
import {
    ContactMethodQueryValidator,
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
    /**
     * Opt-in real-email mode. A string is the address to use; `true` means the address
     * was requested without a value and must be prompted for. Requires `--inbox --ui`
     * and an interactive terminal.
     */
    email?: string | boolean;
}

type InboxIssuer = AddPlugin<NetworkLearnCardFromSeed['returnValue'], LCAPlugin>;

const LOCAL_NETWORK = 'http://localhost:4000/trpc';
const DEFAULT_LCA = 'http://localhost:5100/trpc';
const BEFORE = 'Provisional Course Certificate';
const AFTER = 'Final Course Certificate';
const HONORS = 'Honors Course Certificate';

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

/** Build the LearnCard config shared by the issuer and disposable holder wallets. */
const buildInboxDemoConfig = (network: string, networkUrl: URL, didkit?: Promise<Buffer>) => ({
    network,
    ...(didkit && { didkit }),
    trustedBoostRegistry: `data:application/json,${encodeURIComponent(
        JSON.stringify([
            {
                id: 'Inbox demo network',
                url: networkUrl.origin,
                did: `did:web:${encodeURIComponent(networkUrl.host)}`,
            },
        ])
    )}`,
});

interface InboxDemoEnvironment {
    network: string;
    networkUrl: URL;
    ui?: Awaited<ReturnType<typeof getRefreshDemoUiConfig>>;
    lca: URL;
    interactive: boolean;
    prompts?: ReturnType<typeof createInterface>;
    pause: (next: string) => Promise<void>;
}

/** Validate local-only options and open the app/LCA services before any account is created. */
const prepareInboxDemoEnvironment = async (
    options: InboxRefreshDemoOptions
): Promise<InboxDemoEnvironment> => {
    const { network, lcaAPI: envLca } = resolveServices({}, options.network || LOCAL_NETWORK);
    const networkUrl = requireLoopbackUrl(network, '--network (inbox demo is local-only)');
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
    return { network, networkUrl, ui, lca, interactive, prompts, pause };
};

interface InboxIssuerSetup {
    issuer: InboxIssuer;
    signingAuthority: { endpoint: string; name: string };
    template: UnsignedVC;
    boostUri: string;
    suffix: string;
}

/** Create the throwaway demo school and register a real signing authority on the local network. */
const setupInboxIssuer = async (
    config: ReturnType<typeof buildInboxDemoConfig>,
    lcaHref: string
): Promise<InboxIssuerSetup> => {
    const issuerBase = await initLearnCard({ ...config, seed: generateRandomSeed() });
    const issuer = (await issuerBase.addPlugin(
        await getLCAPlugin(issuerBase as unknown as Parameters<typeof getLCAPlugin>[0], lcaHref)
    )) as unknown as InboxIssuer;
    const suffix = randomUUID().slice(0, 8);
    await issuer.invoke.createProfile({
        profileId: `inbox-issuer-${suffix}`,
        displayName: 'Inbox Demo School',
        bio: '',
        shortBio: '',
    });

    const authority = await issuer.invoke.createSigningAuthority(`inbox-${suffix}`);
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
    return { issuer, signingAuthority, template, boostUri, suffix };
};

/** Mask the local part of an address before writing it to machine-readable output. */
const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    const visible = local.slice(0, 1);
    return `${visible}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
};

/**
 * Real-email Universal Inbox walkthrough (LC-2198 opt-in).
 *
 * Unlike {@link runInboxRefreshDemo}, this never creates or reads a recipient wallet. The
 * operator's delivery service is asked to email a provisional claim link to an address the
 * presenter owns; after a human claims it, the school publishes exactly one visible update
 * (version 2, final grade A) to the holder DID the issuer reports. The CLI confirms only
 * what the issuer reports, never the recipient's wallet contents or email delivery.
 */
export const runEmailInboxRefreshDemo = async (options: InboxRefreshDemoOptions): Promise<void> => {
    const provided = typeof options.email === 'string' ? options.email.trim() : '';
    if (provided) {
        const parsed = ContactMethodQueryValidator.safeParse({ type: 'email', value: provided });
        if (!parsed.success) throw new Error('Enter a valid email address you own.');
    }

    const env = await prepareInboxDemoEnvironment(options);
    let step = 'start the real-email walkthrough';

    try {
        if (!env.ui) {
            throw new Error(
                '--email requires --ui so you can sign in with the address that receives the claim.'
            );
        }
        const prompts = env.prompts;
        if (!prompts) {
            throw new Error(
                '--email requires an interactive terminal; omit --yes, --json, and LC_YES=1 so you can claim in the app.'
            );
        }
        const pause = env.pause;
        out.log('\nLearnCard: receive and update a certificate by email\n');
        out.log('1. Enter your email. The demo school sends a provisional certificate.');
        out.log('2. Open the email, sign in or create an account with that address, and claim it.');
        out.log('3. Return here to publish final results. See the update in the app and by email.');
        out.log('Open email links on this computer, where the local app is running.');

        let email = provided;
        if (!email) {
            out.log('\nEnter an email address you own and can open right now.');
            email = (await prompts.question('Email address: ')).trim();
        }
        const parsed = ContactMethodQueryValidator.safeParse({ type: 'email', value: email });
        if (!parsed.success) throw new Error('Enter a valid email address you own.');
        email = parsed.data.value;

        out.log(`Network: ${env.network}`);
        out.log(`Inbox claim service: ${env.lca.href}`);
        out.log(`Real email requested for: ${email}`);
        out.log('Email delivery uses your local Postmark configuration; check your mailbox.');
        await pause('start');

        out.log('\nSetting up the issuer and signing authority...');
        step = 'register a signing authority';
        const config = buildInboxDemoConfig(env.network, env.networkUrl, options.didkit);
        const { issuer, signingAuthority, template, boostUri, suffix } = await setupInboxIssuer(
            config,
            env.lca.href
        );

        step = 'request provisional delivery';
        out.log('\n1 / 3  ISSUE PROVISIONAL RESULTS');
        out.log(`Requesting delivery of a provisional claim link for ${email}.`);
        const issued = await issuer.invoke.sendCredentialViaInbox({
            recipient: { type: 'email', value: email },
            templateUri: boostUri,
            refresh: true,
            idempotencyKey: `inbox-email-issue-${suffix}`,
            configuration: {
                signingAuthority,
                // Real-email mode never suppresses; the operator's adapter decides delivery.
                delivery: { suppress: false },
            },
        });
        const receipt = issued.refresh;
        if (!receipt) throw new Error('The SDK did not return an inbox refresh receipt.');
        if (!['PENDING', 'ISSUED', 'DELIVERED'].includes(issued.status)) {
            throw new Error(
                `Expected a pending or delivered inbox credential, received ${issued.status}.`
            );
        }
        const alreadyKnown = !!receipt.holderDid;
        if (alreadyKnown) {
            out.log(
                'That address already has a LearnCard account. Open the email, sign in, then claim the provisional certificate in Alerts.'
            );
        } else {
            out.log(
                'The provisional certificate is ready. Open the claim email to sign in or create your account.'
            );
            if (issued.claimUrl) {
                out.log(
                    `If the email does not arrive, the local inbox service reported this claim link:\n${issued.claimUrl}`
                );
            }
        }

        await pause(
            alreadyKnown
                ? 'open the email, sign in with that address, and claim the provisional certificate'
                : 'open the mailbox link, sign in or create an account with that address, and claim the provisional credential'
        );

        step = 'detect the claim';
        out.log('\n2 / 3  CLAIM THE PROVISIONAL RESULTS');
        let holderDid = receipt.holderDid;
        let status: string = issued.status;
        do {
            const metadata = await issuer.invoke.getInboxCredential(issued.issuanceId);
            holderDid = metadata?.refresh?.holderDid ?? holderDid;
            status = metadata?.currentStatus ?? status;
            if (!holderDid) {
                out.log(
                    'The claim is not bound yet. Finish claiming with that address, then press Enter.'
                );
                await pause('check the inbox credential again');
            }
        } while (!holderDid);
        out.log(
            `The issuer reports the claim as bound (${status}). This CLI did not read the recipient wallet.`
        );

        step = 'publish final results';
        out.log('\n3 / 3  PUBLISH FINAL RESULTS');
        out.log('Publishing grade-A final results as the single visible update (version 2)...');
        const finalVersion = buildVersion(template, receipt, boostUri, {
            name: AFTER,
            achievementName: 'Introduction to Biology — Final Results',
            achievementDescription:
                'Course completed. Final grade: A. Coursework and final assessment reviewed.',
            holderDid,
        });
        const publication = await issuer.invoke.publishCredentialRefresh({
            refreshId: receipt.refreshId,
            mode: 'signing-authority',
            credential: finalVersion,
            signingAuthority: { type: 'http', ...signingAuthority },
            updateSummary: 'Final results are ready. Final grade: A.',
            idempotencyKey: `inbox-email-final-${suffix}`,
        });
        if (publication.version !== 2) {
            throw new Error(`Expected version 2, received ${publication.version}.`);
        }
        if (publication.notification === 'not-applicable') {
            throw new Error('The claim bound a holder but the update had no notification target.');
        }
        out.log(`Final results published. In-app notification: ${publication.notification}.`);
        out.log(
            'Check your email for the school and certificate name. Choose View Updates to open Notifications, then view Final Results / Final grade: A.'
        );
        out.set({
            network: env.network,
            issuanceId: issued.issuanceId,
            refreshId: receipt.refreshId,
            recipient: maskEmail(email),
            before: BEFORE,
            after: AFTER,
            version: publication.version,
            status,
            notification: publication.notification,
            realEmail: true,
            deliveryRequested: true,
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
        env.prompts?.close();
    }
};

/**
 * Guided Universal Inbox refresh demonstration (LC-2198).
 *
 * Stage 1 issues a refreshable credential to an email address that has no account.
 * Stage 2 publishes a new version before anyone claims. UI mode then has a human claim
 * in the real app and publish an update to the now-bound holder; terminal mode makes the
 * same claim with DIDAuth and refreshes the local wallet itself.
 *
 * Pass `--email` to opt into {@link runEmailInboxRefreshDemo} instead.
 */
export const runInboxRefreshDemo = async (options: InboxRefreshDemoOptions): Promise<void> => {
    if (options.email !== undefined) {
        return runEmailInboxRefreshDemo(options);
    }
    const { network, networkUrl, ui, lca, prompts, pause } =
        await prepareInboxDemoEnvironment(options);
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

        step = 'register a signing authority';
        const config = buildInboxDemoConfig(network, networkUrl, options.didkit);
        const { issuer, signingAuthority, template, boostUri, suffix } = await setupInboxIssuer(
            config,
            lca.href
        );

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

        await pause('publish final results before anyone claims');
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

        await pause(
            ui
                ? 'create the recipient demo account and show the claim link'
                : 'claim the final certificate'
        );
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
                // The CLI shares a resolver with issuer setup, which can predate delegate registration.
                await holder.invoke.resolveDid(receipt.issuerDid, { noCache: true });
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
            if (holderDid !== holder.id.did())
                throw new Error('The bound recipient did not match the demo account.');
            await pause('publish the honors update to the claimed certificate');
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

        step = 'claim the final certificate with DIDAuth';
        out.log('\n3 / 4  CLAIM THE FINAL CERTIFICATE');
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

        await pause('publish honors and refresh the claimed certificate');
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
            // Terminal-only recipients have no app profile/webhook; refresh directly below.
            notifyHolder: false,
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
            before: AFTER,
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
