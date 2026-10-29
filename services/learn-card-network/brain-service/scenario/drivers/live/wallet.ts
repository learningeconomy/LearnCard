/**
 * Headless learner wallets on the running network (the prove-demo-learner flows, keyed by
 * a fixed seed per role). Each wallet is a real LearnCard, so issuance can encrypt to it.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { ConsentFlowTermsValidator, VCValidator } from '@learncard/types';
import { initLearnCard } from '@learncard/init';
import { ScenarioError } from '../../core/expect';
import {
    SCENARIO_PROFILE_IDS,
    SCENARIO_SEEDS,
    type ScenarioWallet,
    type WalletRole,
} from '../../core/ids';
import type { ClaimedCredentialView, IncomingCredentialView } from '../../port';

const initWallet = (seed: string, network: string, didkit: Buffer) =>
    initLearnCard({ seed, network, didkit });

type LearnCardWallet = Awaited<ReturnType<typeof initWallet>>;

const DidAuthRequestValidator = z.object({
    verifiablePresentationRequest: z.object({ challenge: z.string(), domain: z.string() }),
});

/** Accepts the raw exchange URL or the LearnCard /request?vc_request_url= wrapper. */
const exchangeUrlFrom = (link: string): string =>
    new URL(link).searchParams.get('vc_request_url') ?? link;

const postExchange = async (exchangeUrl: string, body: unknown): Promise<unknown> => {
    const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
        const text = await response.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = undefined;
        }
        const message =
            parsed && typeof parsed === 'object' && 'message' in parsed
                ? String(parsed.message)
                : text.slice(0, 300);
        throw new ScenarioError({
            code: `HTTP_${response.status}`,
            message,
            httpStatus: response.status,
        });
    }
    return response.json();
};

const SEED_BY_ROLE: Record<WalletRole, string> = {
    learnerA: SCENARIO_SEEDS.learnerA,
    learnerB: SCENARIO_SEEDS.learnerB,
    otherWallet: SCENARIO_SEEDS.otherWallet,
};

const DISPLAY_NAME: Record<WalletRole, string> = {
    learnerA: 'Demo Learner',
    learnerB: 'Demo Learner B',
    otherWallet: 'Demo Other Wallet',
};

export class WalletPool {
    private readonly wallets = new Map<WalletRole, Promise<LearnCardWallet>>();
    private didkit: Promise<Buffer> | undefined;

    constructor(private readonly network: string) {}

    private loadDidkit(): Promise<Buffer> {
        // Under --conditions=development this resolves to the plugin's src copy, not dist.
        this.didkit ??= readFile(
            createRequire(import.meta.url).resolve(
                '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'
            )
        );
        return this.didkit;
    }

    private wallet(role: WalletRole): Promise<LearnCardWallet> {
        let wallet = this.wallets.get(role);
        if (!wallet) {
            wallet = this.loadDidkit().then(didkit =>
                initWallet(SEED_BY_ROLE[role], this.network, didkit)
            );
            this.wallets.set(role, wallet);
        }
        return wallet;
    }

    async ensure(role: WalletRole): Promise<ScenarioWallet> {
        const wallet = await this.wallet(role);
        const existing = await wallet.invoke.getProfile();
        if (existing) return { role, profileId: existing.profileId, did: wallet.id.did() };
        await wallet.invoke.createProfile({
            profileId: SCENARIO_PROFILE_IDS[role],
            displayName: DISPLAY_NAME[role],
            shortBio: 'EducationOS scenario wallet (dev fixture)',
            bio: '',
        });
        return { role, profileId: SCENARIO_PROFILE_IDS[role], did: wallet.id.did() };
    }

    /** Consents with exactly the contract's required write categories, as the app does. */
    async consent(role: WalletRole, contractUri: string): Promise<string> {
        const wallet = await this.wallet(role);
        const details = await wallet.invoke.getContract(contractUri);
        const categories = z
            .record(z.string(), z.object({ required: z.boolean() }).passthrough())
            .parse(details.contract.write?.credentials?.categories ?? {});
        const required = Object.fromEntries(
            Object.entries(categories)
                .filter(([, category]) => category.required)
                .map(([name]) => [name, true])
        );
        const terms = ConsentFlowTermsValidator.parse({
            read: { credentials: { categories: {} } },
            write: { credentials: { categories: required } },
        });
        const { termsUri } = await wallet.invoke.consentToContract(contractUri, {
            terms,
            audienceVersion: details.audienceVersion,
        });
        return termsUri;
    }

    /** Consents through a VC-API consent exchange URL (the hosted consent page's link). */
    async consentViaExchange(role: WalletRole, exchangeUrl: string): Promise<void> {
        const wallet = await this.wallet(role);
        const request = DidAuthRequestValidator.parse(await postExchange(exchangeUrl, {}));
        const vp = await wallet.invoke.getDidAuthVp({
            challenge: request.verifiablePresentationRequest.challenge,
            domain: request.verifiablePresentationRequest.domain,
            proofPurpose: 'authentication',
        });
        await postExchange(exchangeUrl, { verifiablePresentation: vp });
    }

    async withdraw(role: WalletRole, termsUri: string): Promise<void> {
        const wallet = await this.wallet(role);
        await wallet.invoke.withdrawConsent(termsUri);
    }

    async incoming(role: WalletRole): Promise<IncomingCredentialView[]> {
        const wallet = await this.wallet(role);
        const incoming = await wallet.invoke.getIncomingCredentials();
        return [...incoming]
            .sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent))
            .map(entry => {
                const recordId = entry.metadata?.educationOsRecordId;
                return {
                    uri: entry.uri,
                    from: entry.from,
                    recordId: typeof recordId === 'string' ? recordId : undefined,
                };
            });
    }

    private async describe(wallet: LearnCardWallet, raw: unknown): Promise<ClaimedCredentialView> {
        const vc = VCValidator.parse(raw);
        const issuer = typeof vc.issuer === 'string' ? vc.issuer : (vc.issuer.id ?? '');
        const subject = Array.isArray(vc.credentialSubject)
            ? vc.credentialSubject[0]
            : vc.credentialSubject;
        const verification: { status: string }[] = await wallet.invoke.verifyCredential(
            vc,
            {},
            true
        );
        return {
            issuer,
            subjectDid: typeof subject?.id === 'string' ? subject.id : undefined,
            verified: !verification.some(item => item.status === 'Failed'),
        };
    }

    async accept(role: WalletRole, uri: string): Promise<ClaimedCredentialView> {
        const wallet = await this.wallet(role);
        await wallet.invoke.acceptCredential(uri);
        // The stored credential is a JWE encrypted to the learner; read() decrypts it.
        return this.describe(wallet, await wallet.read.get(uri));
    }

    async claimOffer(role: WalletRole, link: string): Promise<ClaimedCredentialView> {
        const wallet = await this.wallet(role);
        const exchangeUrl = exchangeUrlFrom(link);
        const request = DidAuthRequestValidator.parse(await postExchange(exchangeUrl, {}));
        const vp = await wallet.invoke.getDidAuthVp({
            challenge: request.verifiablePresentationRequest.challenge,
            domain: request.verifiablePresentationRequest.domain,
            proofPurpose: 'authentication',
        });
        const response = z
            .object({ verifiablePresentation: z.object({ verifiableCredential: z.unknown() }) })
            .parse(await postExchange(exchangeUrl, { verifiablePresentation: vp }));
        const vcs = response.verifiablePresentation.verifiableCredential;
        return this.describe(wallet, Array.isArray(vcs) ? vcs[0] : vcs);
    }
}
