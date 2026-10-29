#!/usr/bin/env bun
/**
 * RETIRED: superseded by the EducationOS scenario runner (scenario/cli.ts), whose wallet
 * steps (consent, withdraw, accept and verify, offer claim) run in
 *
 *   bun run scenario mvp --driver live      # repo root
 *   bun run scenario:in-process             # repo root
 *
 * The runner has no per-command wallet CLI, so this script keeps its body for the manual
 * flow (--register, --consent, --withdraw, --consent-exchange, --claim, --claim-offer).
 * Kept, not deleted; no longer maintained.
 *
 * Headless learner wallet for the EducationOS MVP walkthrough. A real LearnCard wallet
 * (seed-derived keys) on the local network, so issuance can encrypt to it and the learner
 * side of the flow can be proven without the app UI. It does not exercise the app's screens.
 *
 *   bun run prove:demo-learner -- --register   # create the `demo-learner` profile
 *   bun run prove:demo-learner -- --consent <contract uri>   # consent, as the app does
 *   bun run prove:demo-learner -- --withdraw <contract uri>  # withdraw that consent
 *   bun run prove:demo-learner -- --consent-exchange <url>   # consent via the hosted page's VC-API link
 *   bun run prove:demo-learner -- --claim [--issuer <did>]  # accept, decrypt and verify
 *   bun run prove:demo-learner -- --claim-offer <offer uri> [--issuer <did>]  # redeem an offer
 *
 * --claim-offer takes the raw VC-API exchange URL from submitRecord's issuance.offerUri, or
 * the LearnCard wrapper link (<app>/request?vc_request_url=<encoded uri>), and redeems it
 * over plain VC-API DID authentication, as any wallet would. It verifies the credential but
 * does not store it in the wallet.
 *
 * Standalone wallet: does not import Brain's database environment.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { ConsentFlowTermsValidator, VCValidator } from '@learncard/types';
import { warnRetired } from './retired-demo-script';

const network = process.env.LCN_NETWORK ?? 'http://localhost:4000/trpc';
const profileId = process.env.DEMO_LEARNER_PROFILE_ID ?? 'demo-learner';
// Dev-only fixed seed so the learner identity is stable across runs.
const seed = process.env.DEMO_LEARNER_SEED ?? 'd'.repeat(64);
const issuerArg = process.argv.indexOf('--issuer');
// The district's issuing identity DID, as printed by seed:demo-lms.
const expectedIssuer = issuerArg >= 0 ? process.argv[issuerArg + 1] : undefined;

const log = (message: string): void => console.log(`${new Date().toISOString()} ${message}`);

/** Accepts the raw exchange URL or the LearnCard /request?vc_request_url= wrapper. */
const exchangeUrlFrom = (link: string): string => {
    const wrapped = new URL(link).searchParams.get('vc_request_url');
    return wrapped ?? link;
};

/** Plain VC-API: POST to the exchange URL, failing loudly on a non-2xx answer. */
const postExchange = async (exchangeUrl: string, body: unknown): Promise<unknown> => {
    const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Exchange HTTP ${response.status}: ${await response.text()}`);
    return response.json();
};

const DidAuthRequestValidator = z.object({
    verifiablePresentationRequest: z.object({ challenge: z.string(), domain: z.string() }),
});

const main = async (): Promise<void> => {
    const { initLearnCard } = await import('@learncard/init');
    const require = createRequire(import.meta.url);
    const didkit = await readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
    );
    const wallet = await initLearnCard({ seed, network, didkit });

    if (process.argv.includes('--register')) {
        const existing = await wallet.invoke.getProfile();
        if (!existing) {
            await wallet.invoke.createProfile({
                profileId,
                displayName: 'Demo Learner',
                shortBio: 'EducationOS demo learner (dev fixture)',
                bio: '',
            });
        }
        log(`LEARNER ${profileId} key=${wallet.id.did()} (${existing ? 'exists' : 'registered'})`);
        return;
    }

    const consentIndex = process.argv.indexOf('--consent');
    if (consentIndex >= 0) {
        // The same network route the LearnCard app's /consent-flow screen uses.
        const contractUri = process.argv[consentIndex + 1];
        if (!contractUri) throw new Error('Pass --consent <contract uri>.');
        // Grant exactly the categories the contract requires, as the app's consent screen does.
        const details = await wallet.invoke.getContract(contractUri);
        const { contract } = details;
        const required = (categories: Record<string, { required: boolean }>) =>
            Object.fromEntries(
                Object.entries(categories)
                    .filter(([, category]) => category.required)
                    .map(([name]) => [name, true])
            );
        const terms = ConsentFlowTermsValidator.parse({
            read: { credentials: { categories: {} } },
            write: { credentials: { categories: required(contract.write.credentials.categories) } },
        });
        // Bind consent to the audience version reviewed; governance changes bump it.
        const { termsUri } = await wallet.invoke.consentToContract(contractUri, {
            terms,
            audienceVersion: details.audienceVersion,
        });
        log(`CONSENTED to ${contractUri} (terms ${termsUri})`);
        return;
    }

    const exchangeIndex = process.argv.indexOf('--consent-exchange');
    if (exchangeIndex >= 0) {
        // Wallet-neutral path: plain VC-API, as any wallet would drive the hosted page's link.
        const exchangeUrl = process.argv[exchangeIndex + 1];
        if (!exchangeUrl) throw new Error('Pass --consent-exchange <exchange url>.');
        const post = (body: unknown): Promise<unknown> => postExchange(exchangeUrl, body);
        const request = DidAuthRequestValidator.parse(await post({}));
        const vp = await wallet.invoke.getDidAuthVp({
            challenge: request.verifiablePresentationRequest.challenge,
            domain: request.verifiablePresentationRequest.domain,
            proofPurpose: 'authentication',
        });
        await post({ verifiablePresentation: vp });
        log('CONSENTED via VC-API exchange (DID authentication)');
        return;
    }

    const withdrawIndex = process.argv.indexOf('--withdraw');
    if (withdrawIndex >= 0) {
        const contractUri = process.argv[withdrawIndex + 1];
        const consented = z
            .object({
                records: z.array(
                    z
                        .object({ uri: z.string(), contract: z.object({ uri: z.string() }) })
                        .passthrough()
                ),
            })
            .parse(await wallet.invoke.getConsentedContracts());
        const terms = consented.records.find(record => record.contract.uri === contractUri);
        if (!terms) throw new Error(`No consent to ${contractUri} found for this learner.`);
        await wallet.invoke.withdrawConsent(terms.uri);
        log(`WITHDREW consent to ${contractUri}`);
        return;
    }

    /** Logs the credential's issuer and subject and verifies it; flags anything unexpected. */
    const report = async (vc: z.infer<typeof VCValidator>): Promise<void> => {
        const issuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id;
        const subject = z
            .object({ id: z.string() })
            .parse(
                Array.isArray(vc.credentialSubject) ? vc.credentialSubject[0] : vc.credentialSubject
            );
        log(`CREDENTIAL ${vc.type.join(',')} name="${String(vc.name ?? '')}"`);
        log(
            `ISSUER ${issuer} ${!expectedIssuer ? '(not checked; pass --issuer)' : issuer === expectedIssuer ? '(district identity)' : '(UNEXPECTED)'}`
        );
        log(`SUBJECT ${subject.id}`);

        const verification = await wallet.invoke.verifyCredential(vc, {}, true);
        const failures = verification.filter(item => item.status === 'Failed');
        log(
            `VERIFY ${failures.length ? `FAILED: ${JSON.stringify(failures)}` : 'all checks passed'}`
        );
        if ((expectedIssuer && issuer !== expectedIssuer) || failures.length) process.exitCode = 1;
    };

    const claimOfferIndex = process.argv.indexOf('--claim-offer');
    if (claimOfferIndex >= 0) {
        const link = process.argv[claimOfferIndex + 1];
        if (!link) throw new Error('Pass --claim-offer <offer uri>.');
        const exchangeUrl = exchangeUrlFrom(link);
        const request = DidAuthRequestValidator.parse(await postExchange(exchangeUrl, {}));
        const vp = await wallet.invoke.getDidAuthVp({
            challenge: request.verifiablePresentationRequest.challenge,
            domain: request.verifiablePresentationRequest.domain,
            proofPurpose: 'authentication',
        });
        const response = z
            .object({
                verifiablePresentation: z.object({ verifiableCredential: z.unknown() }),
            })
            .parse(await postExchange(exchangeUrl, { verifiablePresentation: vp }));
        const vcs = response.verifiablePresentation.verifiableCredential;
        const vc = VCValidator.parse(Array.isArray(vcs) ? vcs[0] : vcs);
        log(`CLAIMED offer via VC-API exchange as ${wallet.id.did()}`);
        await report(vc);
        const subject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        if (subject?.id !== wallet.id.did()) {
            log('SUBJECT is not this wallet (UNEXPECTED)');
            process.exitCode = 1;
        }
        return;
    }

    if (!process.argv.includes('--claim')) {
        throw new Error(
            'Pass --register, --consent <uri>, --withdraw <uri>, --claim or --claim-offer <uri>.'
        );
    }

    const incoming = await wallet.invoke.getIncomingCredentials();
    const pending = incoming.filter(entry => entry.metadata?.educationOsRecordId);
    log(`INCOMING ${incoming.length} credential(s), ${pending.length} from Platform Issuance`);
    // Newest first: earlier unclaimed offers (e.g. from a previous issuer) must not be picked.
    const offer = [...pending].sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent))[0];
    if (!offer) throw new Error('No Platform Issuance credential is waiting for this learner.');

    await wallet.invoke.acceptCredential(offer.uri);
    log('ACCEPTED credential into the wallet');

    // The stored credential is a JWE encrypted to the learner; read() decrypts it.
    const vc = VCValidator.parse(await wallet.read.get(offer.uri));
    log('DECRYPTED the accepted credential');
    await report(vc);
};

warnRetired(
    'prove:demo-learner',
    'bun run scenario mvp --driver live (repo root); this manual wallet still runs'
);
main().catch(error => {
    console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
