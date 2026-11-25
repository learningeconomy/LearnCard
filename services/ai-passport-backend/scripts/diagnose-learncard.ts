// LearnCard service-identity diagnosis. Run it inside the API container:
//
//   bun run scripts/diagnose-learncard.ts <learnerDid> [contractId]
//
// It repeats the backend's LearnCard init, a signed getProfile and the learner's
// AI consent read, and prints one JSON line per step:
//
//   {"step","ok","ms","name","code","httpStatus","causeErrno"}
//
// then a final {"didMatches","keyControlsDidWeb"} line. It never prints SEED,
// any other secret or env value, the DIDs, the contract, error messages or
// response bodies: only step names, timings, allowlisted class names, tRPC
// codes, HTTP statuses, errno-style codes and booleans. Read-only: no writes.
import { initLearnCard } from '@learncard/init';

import { LEARNCARD_DID_WEB } from '../src/constants/env';
import { describeLearnCardFailure } from '../src/learncard/errors';
import { boundLearnCardCall } from '../src/learncard/requestScope';

export const DIAGNOSIS_STEPS = [
    'init',
    'getProfile',
    'getConsentFlowDataForDid',
    'resolveDidWeb',
] as const;
export type DiagnosisStep = (typeof DIAGNOSIS_STEPS)[number];

export type DiagnosisLine = {
    step: DiagnosisStep;
    ok: boolean;
    ms: number;
    name: string | null;
    code: string | null;
    httpStatus: number | null;
    causeErrno: string | null;
    skipped?: true;
};

export type DiagnosisResult = {
    didMatches: boolean | null;
    keyControlsDidWeb: boolean | null;
};

/** The slice of the SDK this script touches, so tests can pass a fake. */
export type DiagnosableLearnCard = {
    id: {
        did: (method?: string) => string;
        keypair?: (type?: string) => { x?: unknown } | undefined;
    };
    invoke: {
        getProfile: () => Promise<unknown>;
        getConsentFlowDataForDid: (
            did: string,
            options: { query: { id: string | undefined } }
        ) => Promise<unknown>;
        resolveDid?: (did: string) => Promise<unknown>;
    };
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;

/**
 * True when the seed's did:key is the did:web document's controller, or its
 * Ed25519 key appears in the document. network.learncard.com serves the
 * profile's did:key as `controller` (see network-brain-service dids.ts).
 */
export const keyControlsDocument = (
    document: unknown,
    keyDid: string,
    publicKeyX: unknown
): boolean => {
    const doc = asRecord(document);
    if (!doc) return false;
    const controllers = Array.isArray(doc.controller) ? doc.controller : [doc.controller];
    if (controllers.includes(keyDid)) return true;
    const methods = Array.isArray(doc.verificationMethod) ? doc.verificationMethod : [];
    return (
        typeof publicKeyX === 'string' &&
        methods.some(method => asRecord(asRecord(method)?.publicKeyJwk)?.x === publicKeyX)
    );
};

export const runDiagnosis = async ({
    init,
    learnerDid,
    contractId,
    didWeb,
    stepTimeoutMs,
    write,
}: {
    init: () => Promise<DiagnosableLearnCard>;
    learnerDid: string;
    contractId: string | undefined;
    didWeb: string;
    stepTimeoutMs: number;
    write: (line: DiagnosisLine | DiagnosisResult) => void;
}): Promise<DiagnosisResult> => {
    const step = async <T>(
        name: DiagnosisStep,
        run: () => Promise<T>
    ): Promise<{ ok: true; value: T } | { ok: false }> => {
        const startedAt = performance.now();
        try {
            const value = await boundLearnCardCall(Promise.resolve().then(run), {
                timeoutMs: stepTimeoutMs,
            });
            write({
                step: name,
                ok: true,
                ms: Math.round(performance.now() - startedAt),
                name: null,
                code: null,
                httpStatus: null,
                causeErrno: null,
            });
            return { ok: true, value };
        } catch (error) {
            const detail = describeLearnCardFailure(error);
            write({
                step: name,
                ok: false,
                ms: Math.round(performance.now() - startedAt),
                name: detail.errorClass ?? null,
                code: detail.trpcCode ?? null,
                httpStatus: detail.httpStatus ?? null,
                causeErrno: detail.causeErrno ?? null,
            });
            return { ok: false };
        }
    };

    const initialized = await step('init', init);
    if (!initialized.ok) {
        for (const skipped of DIAGNOSIS_STEPS.slice(1))
            write({
                step: skipped,
                ok: false,
                ms: 0,
                name: null,
                code: null,
                httpStatus: null,
                causeErrno: null,
                skipped: true,
            });
        const result = { didMatches: null, keyControlsDidWeb: null };
        write(result);
        return result;
    }
    const learnCard = initialized.value;

    // Each step runs even if an earlier one failed: a 401 on both signed calls
    // points at the service identity, a 401 on only one points elsewhere.
    await step('getProfile', () => learnCard.invoke.getProfile());
    await step('getConsentFlowDataForDid', () =>
        learnCard.invoke.getConsentFlowDataForDid(learnerDid, {
            query: { id: contractId },
        })
    );
    const resolved = await step('resolveDidWeb', async () => {
        if (!learnCard.invoke.resolveDid) throw new TypeError('resolveDid missing');
        return learnCard.invoke.resolveDid(didWeb);
    });

    let keyControlsDidWeb: boolean | null = null;
    if (resolved.ok) {
        try {
            keyControlsDidWeb = keyControlsDocument(
                resolved.value,
                learnCard.id.did('key'),
                learnCard.id.keypair?.('ed25519')?.x
            );
        } catch {
            keyControlsDidWeb = null;
        }
    }
    const result = {
        // As asked: the configured did:web is what the SDK reports as its DID.
        didMatches: learnCard.id.did() === didWeb,
        // The real check: does SEED's key control that did:web?
        keyControlsDidWeb,
    };
    write(result);
    return result;
};

const silenceConsole = (): void => {
    // The SDK logs on failure and those lines can include URLs or DIDs. Only
    // this script's own JSON lines reach stdout.
    for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const)
        console[method] = () => undefined;
};

if (import.meta.main) {
    const [learnerDid, contractIdArg] = process.argv.slice(2);
    if (!learnerDid) {
        process.stderr.write(
            'usage: bun run scripts/diagnose-learncard.ts <learnerDid> [contractId]\n'
        );
        process.exit(2);
    }
    const parsedTimeout = Number(process.env.DIAGNOSE_STEP_TIMEOUT_MS);
    const stepTimeoutMs =
        Number.isInteger(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 15_000;
    const write = (line: DiagnosisLine | DiagnosisResult) =>
        process.stdout.write(`${JSON.stringify(line)}\n`);
    silenceConsole();
    // A timed-out SDK request may reject later; it has already been reported.
    process.on('unhandledRejection', () => undefined);

    const { contractId: configuredContractId } = await import('../src/learncard/constants');
    const { serviceLearnCardInitOptions } = await import('../src/learncard');
    await runDiagnosis({
        // Same options and call shape as initServiceLearnCard, minus getProfile,
        // which runs as its own step.
        init: async () => {
            const { seed, didkit, network, didWeb, cloud } = serviceLearnCardInitOptions();
            return (await initLearnCard({
                seed,
                didkit,
                network,
                didWeb,
                cloud,
            })) as unknown as DiagnosableLearnCard;
        },
        learnerDid,
        contractId: contractIdArg || configuredContractId,
        didWeb: LEARNCARD_DID_WEB,
        stepTimeoutMs,
        write,
    }).catch(() => {
        process.stdout.write(`${JSON.stringify({ step: 'script', ok: false })}\n`);
        process.exitCode = 1;
    });
    // Network clients keep sockets open; the diagnosis is complete.
    process.exit(process.exitCode ?? 0);
}
