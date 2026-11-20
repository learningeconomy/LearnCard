import type { VerificationCheck } from '@learncard/types';
import { getSingleClrSubject } from './selectors';
import type { ClrJsonObject, ClrNormalizedModel } from './types';
import type {
    ClrCredentialVerification,
    ClrCredentialVerifier,
    ClrSubjectBinding,
    ClrVerificationSnapshot,
    VerificationBudget,
} from './verification.types';

export * from './verification.types';
export const VERIFICATION_TOTAL_BUDGET_MS = 30_000;
const VERIFY_CONCURRENCY = 4;

/** One deadline for an entire pass, including a share's holder and all its members. */
export const createVerificationBudget = (
    totalMs = VERIFICATION_TOTAL_BUDGET_MS,
    now: () => number = () => Date.now()
): VerificationBudget => {
    const deadline = now() + totalMs;
    let cancelled = false;
    // The browser contract is ES2022; Promise.withResolvers requires ES2024.
    let rejectCancelled!: (error: Error) => void;
    const cancellation = new Promise<never>((_, reject) => {
        rejectCancelled = reject;
    });
    void cancellation.catch(() => {});
    return {
        remaining: () => Math.max(0, deadline - now()),
        expired: () => cancelled || now() >= deadline,
        cancelled: () => cancelled,
        cancel: () => {
            if (cancelled) return;
            cancelled = true;
            rejectCancelled(new Error('verification cancelled'));
        },
        whenCancelled: () => cancellation,
    };
};

/** The SDK has no abort parameter. Ignore late results without scheduling further work. */
export const boundedVerification = async <T>(
    verification: Promise<T>,
    budget: VerificationBudget
): Promise<T> => {
    if (budget.expired()) throw new Error('verification budget exhausted');
    let rejectTimeout!: (error: Error) => void;
    const timeout = new Promise<never>((_, reject) => {
        rejectTimeout = reject;
    });
    const timer = setTimeout(
        () => rejectTimeout(new Error('verification budget exhausted')),
        budget.remaining()
    );
    try {
        const result = await Promise.race([verification, budget.whenCancelled(), timeout]);
        if (budget.expired()) throw new Error('verification budget exhausted');
        return result;
    } finally {
        clearTimeout(timer);
    }
};

const object = (value: unknown): value is ClrJsonObject =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const issuerId = (credential: ClrJsonObject): string | undefined => {
    const issuer = credential.issuer;
    return typeof issuer === 'string'
        ? issuer
        : object(issuer) && typeof issuer.id === 'string'
          ? issuer.id
          : undefined;
};
const subjectId = (credential: ClrJsonObject): string | undefined => {
    const id = getSingleClrSubject(credential)?.id;
    return typeof id === 'string' && id.length > 0 ? id : undefined;
};
const bindingTo = (
    credential: ClrJsonObject,
    outerId: string | undefined,
    parent: ClrSubjectBinding
): ClrSubjectBinding => {
    const id = subjectId(credential);
    if (parent === 'mismatch') return 'mismatch';
    if (!id || !outerId || parent === 'unknown') return 'unknown';
    return id === outerId ? 'matched' : 'mismatch';
};

const initialNode = (
    credential: ClrJsonObject,
    occurrencePath: string,
    binding: ClrSubjectBinding
): ClrCredentialVerification => {
    const proofs = Array.isArray(credential.proof) ? credential.proof : [credential.proof];
    const profile = object(credential.issuer) ? credential.issuer : undefined;
    const image =
        typeof profile?.image === 'string'
            ? profile.image
            : object(profile?.image)
              ? profile.image.id
              : undefined;
    return {
        occurrencePath,
        issuerDid: issuerId(credential),
        issuerName: typeof profile?.name === 'string' ? profile.name : undefined,
        issuerImage: typeof image === 'string' ? image : undefined,
        verificationMethods: proofs.flatMap(proof =>
            object(proof) && typeof proof.verificationMethod === 'string'
                ? [proof.verificationMethod]
                : []
        ),
        proof: credential.proof === undefined ? 'unsigned' : 'checking',
        lifecycle:
            credential.proof === undefined || credential.credentialStatus === undefined
                ? 'unchecked'
                : 'unavailable',
        binding,
        checks: [],
        warnings: [],
        errors: [],
        status: [],
        descendants: [],
    };
};

interface Occurrence {
    credential: ClrJsonObject;
    node: ClrCredentialVerification;
    parent?: Occurrence;
    children: Occurrence[];
}

/** Preserve every source occurrence, including duplicate IDs and descendants outside direct rows. */
const discover = (model: ClrNormalizedModel): { outer: Occurrence; all: Occurrence[] } => {
    const credential = model.collection.sourceCredential;
    const outer: Occurrence = {
        credential,
        node: initialNode(credential, '', 'not-applicable'),
        children: [],
    };
    const all = [outer];
    const outerId = subjectId(credential);
    const ancestors = new WeakSet<object>();
    const visit = (value: unknown, path: string, owner: Occurrence): void => {
        if (!value || typeof value !== 'object' || ancestors.has(value)) return;
        ancestors.add(value);
        for (const [key, child] of Object.entries(value)) {
            const childPath = path ? `${path}.${key}` : key;
            if (key === 'verifiableCredential') {
                const members = Array.isArray(child) ? child : [child];
                members.forEach((member, index) => {
                    const memberPath = Array.isArray(child) ? `${childPath}[${index}]` : childPath;
                    if (!object(member)) {
                        const node = initialNode({}, memberPath, 'unknown');
                        node.proof = 'unavailable';
                        const occurrence: Occurrence = {
                            credential: {},
                            node,
                            parent: owner,
                            children: [],
                        };
                        owner.children.push(occurrence);
                        all.push(occurrence);
                        return;
                    }
                    const occurrence: Occurrence = {
                        credential: member,
                        node: initialNode(
                            member,
                            memberPath,
                            bindingTo(member, outerId, owner.node.binding)
                        ),
                        parent: owner,
                        children: [],
                    };
                    owner.children.push(occurrence);
                    all.push(occurrence);
                    visit(member, memberPath, occurrence);
                });
            } else if (Array.isArray(child)) {
                child.forEach((item, index) => visit(item, `${childPath}[${index}]`, owner));
            } else visit(child, childPath, owner);
        }
        ancestors.delete(value);
    };
    visit(credential, '', outer);
    return { outer, all };
};

const snapshotOf = (
    model: ClrNormalizedModel,
    outer: Occurrence,
    all: Occurrence[],
    complete: boolean
): ClrVerificationSnapshot => {
    const nodes = new Map<string, ClrCredentialVerification>();
    for (let index = all.length - 1; index >= 0; index--) {
        const occurrence = all[index];
        nodes.set(occurrence.node.occurrencePath, {
            ...occurrence.node,
            descendants: occurrence.children.map(child => nodes.get(child.node.occurrencePath)!),
        });
    }
    const records: Record<string, ClrCredentialVerification> = Object.create(null);
    for (const record of model.records) {
        const origin = record.origins.find(
            item => item.kind === 'embeddedCredential' && !item.definitionOnly
        );
        const node = origin && nodes.get(origin.path);
        if (node) records[record.id] = node;
    }
    return { outer: nodes.get(outer.node.occurrencePath)!, records, complete };
};

export const createClrVerificationSnapshot = (
    model: ClrNormalizedModel,
    hasCertification = false
): ClrVerificationSnapshot => {
    const { outer, all } = discover(model);
    const snapshot = snapshotOf(model, outer, all, false);
    if (hasCertification) snapshot.certification = 'checking';
    return snapshot;
};

/** Settle a pass that could not initialize a verifier, without leaving checking badges behind. */
export const createUnavailableClrVerificationSnapshot = (
    model: ClrNormalizedModel,
    hasCertification = false
): ClrVerificationSnapshot => {
    const { outer, all } = discover(model);
    for (const occurrence of all) {
        if (occurrence.node.proof === 'checking')
            occurrence.node = { ...occurrence.node, proof: 'unavailable' };
    }
    const snapshot = snapshotOf(model, outer, all, true);
    if (hasCertification) snapshot.certification = 'unavailable';
    return snapshot;
};

// Only positive cryptographic failure evidence is red. Resolver/status errors can also
// arrive in errors[] instead of throwing; unknown error text remains inconclusive.
const INVALID_PROOF =
    /invalid signature|signature verification (?:failed|error)|verification equation was not satisfied|proof verification failed|invalid proof|invalid jws|invalid jwt signature|signature mismatch|not authorized|unauthorized verification method|issuer.*(?:does not match|mismatch)/i;
const INCONCLUSIVE_PROOF = /resolv|network|fetch|timed? out|timeout|connection|http [45]\d\d/i;
const EXPIRED = /^expiration error: Credential is (?:expired|no longer valid)$/i;
const NOT_YET_VALID = /^expiration error: Credential is not valid yet$/i;
const STATUS_ERROR =
    /status list|credentialstatus|revocation|suspension|credential (?:is |has been )?(?:revoked|suspended)/i;

const hasActiveStatusEvidence = (
    credential: ClrJsonObject,
    result: VerificationCheck,
    allowAdditionalEntries = false
): boolean => {
    const status = result.status;
    if (
        !status?.length ||
        !result.checks.some(check => check === 'credentialStatus' || check === 'status')
    )
        return false;
    const declaredStatus = Array.isArray(credential.credentialStatus)
        ? credential.credentialStatus
        : [credential.credentialStatus];
    // The VerifyBoost plugin may append inner status evidence to the wrapper result.
    // Do not accept a bare flag or status evidence for a different entry.
    return (
        declaredStatus.length > 0 &&
        (allowAdditionalEntries || status.length === declaredStatus.length) &&
        declaredStatus.every(declared => {
            if (!object(declared)) return false;
            const legacy = declared.type === 'RevocationList2020Status';
            const purpose = legacy ? 'revocation' : declared.statusPurpose;
            const url = legacy ? declared.revocationListCredential : declared.statusListCredential;
            const index = legacy ? declared.revocationListIndex : declared.statusListIndex;
            return (
                typeof url === 'string' &&
                (typeof index === 'string' || typeof index === 'number') &&
                status.some(
                    entry =>
                        entry.entryType === declared.type &&
                        entry.statusPurpose === purpose &&
                        entry.statusListCredential === url &&
                        entry.statusListIndex === String(index) &&
                        !entry.isSet
                )
            );
        })
    );
};

const certificationVerdict = (credential: ClrJsonObject, result: VerificationCheck) => {
    if (result.errors.length || result.status?.some(entry => entry.isSet)) return 'failed';
    if (
        !result.checks.includes('proof') ||
        result.warnings.length ||
        (credential.credentialStatus !== undefined &&
            !hasActiveStatusEvidence(credential, result, true))
    )
        return 'unavailable';
    return 'verified';
};

export const classifyClrVerification = (
    initial: ClrCredentialVerification,
    credential: ClrJsonObject,
    result: VerificationCheck
): ClrCredentialVerification => {
    const status = result.status ?? [];
    const revoked = status.some(entry => entry.statusPurpose === 'revocation' && entry.isSet);
    const suspended = status.some(entry => entry.statusPurpose === 'suspension' && entry.isSet);
    const legacyRevoked = result.errors.some(error =>
        /^credential (?:is |has been )?revoked\b/i.test(error)
    );
    const legacySuspended = result.errors.some(error =>
        /^credential (?:is |has been )?suspended\b/i.test(error)
    );
    const validity = result.errors.some(error => EXPIRED.test(error))
        ? 'expired'
        : result.errors.some(error => NOT_YET_VALID.test(error))
          ? 'not-yet-valid'
          : undefined;
    const proofErrors = result.errors.filter(
        error => !STATUS_ERROR.test(error) && !EXPIRED.test(error) && !NOT_YET_VALID.test(error)
    );
    const lifecycle =
        revoked || legacyRevoked
            ? 'revoked'
            : suspended || legacySuspended
              ? 'suspended'
              : credential.credentialStatus === undefined
                ? 'unchecked'
                : !result.errors.some(error => STATUS_ERROR.test(error)) &&
                    !result.warnings.length &&
                    hasActiveStatusEvidence(credential, result)
                  ? 'active'
                  : 'unavailable';
    const invalid = proofErrors.some(
        error => INVALID_PROOF.test(error) && !INCONCLUSIVE_PROOF.test(error)
    );
    const proof = invalid
        ? 'invalid'
        : result.checks.includes('proof') && !proofErrors.length && !result.warnings.length
          ? 'verified'
          : 'unavailable';
    return {
        ...initial,
        proof,
        lifecycle,
        validity,
        checks: result.checks,
        warnings: result.warnings,
        errors: result.errors,
        status,
    };
};

/** Signature presence, including signed descendants beneath otherwise unsigned containers. */
export const hasSignedClrCredentials = (snapshot: ClrVerificationSnapshot): boolean => {
    const occurrences = [snapshot.outer];
    while (occurrences.length) {
        const node = occurrences.pop()!;
        if (node.proof !== 'unsigned') return true;
        occurrences.push(...node.descendants);
    }
    return false;
};

/** The publisher's own required checks, independent of any district/descendant verdict. */
export const isClrPublisherVerified = (snapshot?: ClrVerificationSnapshot): boolean =>
    Boolean(
        snapshot?.complete &&
        snapshot.outer.proof === 'verified' &&
        snapshot.outer.lifecycle !== 'revoked' &&
        !snapshot.outer.validity &&
        snapshot.outer.lifecycle !== 'suspended' &&
        snapshot.outer.lifecycle !== 'unavailable'
    );

/** Whether this occurrence and all signed descendants have a complete, attributable all-clear. */
export const isClrRecordConfirmed = (node: ClrCredentialVerification): boolean =>
    node.proof === 'verified' &&
    node.lifecycle !== 'revoked' &&
    !node.validity &&
    node.lifecycle !== 'suspended' &&
    node.lifecycle !== 'unavailable' &&
    node.binding !== 'mismatch' &&
    node.binding !== 'unknown' &&
    node.descendants.every(confirmedDescendant);

const confirmedDescendant = (node: ClrCredentialVerification): boolean =>
    node.proof === 'unsigned'
        ? node.descendants.every(confirmedDescendant)
        : isClrRecordConfirmed(node);

/** Shared wallet/share verifier. Signature checks are per occurrence, resolution caching stays in DIDKit. */
export const verifyClrCredentialTree = async (
    model: ClrNormalizedModel,
    verify: ClrCredentialVerifier,
    budget: VerificationBudget = createVerificationBudget(),
    onUpdate?: (snapshot: ClrVerificationSnapshot) => void,
    certifiedWrapper?: ClrJsonObject
): Promise<ClrVerificationSnapshot> => {
    const { outer, all } = discover(model);
    const signed = all.filter(occurrence => occurrence.node.proof === 'checking');
    // The wrapper and signed records share the same four worker slots and deadline.
    let cursor = certifiedWrapper ? -1 : 0;
    let certification: ClrVerificationSnapshot['certification'] = certifiedWrapper
        ? 'checking'
        : undefined;
    const publish = (complete: boolean): ClrVerificationSnapshot => {
        const snapshot = snapshotOf(model, outer, all, complete);
        if (certification) snapshot.certification = certification;
        if (!budget.cancelled()) onUpdate?.(snapshot);
        return snapshot;
    };
    publish(false);
    const workCount = signed.length + (certifiedWrapper ? 1 : 0);
    await Promise.all(
        Array.from({ length: Math.min(VERIFY_CONCURRENCY, workCount) }, async () => {
            while (cursor < signed.length && !budget.expired()) {
                const index = cursor++;
                if (index === -1 && certifiedWrapper) {
                    try {
                        const result = await boundedVerification(verify(certifiedWrapper), budget);
                        certification = certificationVerdict(certifiedWrapper, result);
                    } catch {
                        certification = 'unavailable';
                    }
                    publish(false);
                    continue;
                }
                const occurrence = signed[index];
                try {
                    const result = await boundedVerification(verify(occurrence.credential), budget);
                    occurrence.node = classifyClrVerification(
                        occurrence.node,
                        occurrence.credential,
                        result
                    );
                } catch {
                    occurrence.node = { ...occurrence.node, proof: 'unavailable' };
                }
                publish(false);
            }
        })
    );
    for (const occurrence of signed) {
        if (occurrence.node.proof === 'checking')
            occurrence.node = { ...occurrence.node, proof: 'unavailable' };
    }
    if (certification === 'checking') certification = 'unavailable';
    return publish(true);
};
