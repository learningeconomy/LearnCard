import { VCValidator, type VC } from '@learncard/types';
import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { assertOwnerOperationActive } from '../services/dataErasure';
import { getLearnCard } from './index';

/** Reserve before sending: an interrupted response may still have created an artifact. */
export const createExternalArtifact = async (
    did: string,
    kind: string,
    credentialId: string,
    create: () => Promise<string>
): Promise<string> => {
    const operationId = randomUUID();
    await db.reserveExternalArtifact(did, { operationId, kind, credentialId });
    try {
        await assertOwnerOperationActive(did);
    } catch (error) {
        await db.completeExternalArtifact(did, operationId, {
            uris: [],
            status: 'failed',
        });
        throw error;
    }

    let uri: string;
    try {
        uri = await create();
    } catch (error) {
        // A network error is not evidence that the remote creation failed.
        await db.completeExternalArtifact(did, operationId, {
            uris: [],
            status: 'unknown',
        });
        throw error;
    }
    // This only completes the existing reservation, even if the owner was fenced
    // while the remote request was in flight. Never recreate owner data here.
    await db.completeExternalArtifact(did, operationId, {
        uris: [uri],
        status: 'complete',
    });
    return uri;
};

/** Read private issuances, including recoverable owner-associated legacy URIs. */
export const readOwnedBoostCredential = async (did: string, boostUri: string): Promise<VC> => {
    await assertOwnerOperationActive(did);
    const artifacts = await db.getExternalArtifacts(did);
    const boost = artifacts.find(
        entry =>
            (entry.kind === 'boost' || entry.kind === 'child-boost') &&
            entry.uris.includes(boostUri)
    );
    if (!boost) throw new Error('Private boost credential unavailable');
    const candidates = artifacts
        .filter(
            entry =>
                entry.kind === 'contract-credential' &&
                (entry.status === 'complete' || entry.status === 'unknown') &&
                entry.deletion?.status !== 'deleted'
        )
        .sort(
            (a, b) =>
                Number(b.credentialId === boost.credentialId) -
                Number(a.credentialId === boost.credentialId)
        );
    const learnCard = await getLearnCard();
    const visited = new Set<string>();
    for (const issued of candidates) {
        for (const uri of issued.uris) {
            if (visited.has(uri)) continue;
            visited.add(uri);
            await assertOwnerOperationActive(did);
            // SDK read.get decrypts JWE for this service. Historical migration may
            // know the URI without knowing the publication correlation ID; only the
            // actual credential can establish that association, never a guessed ID.
            const parsed = VCValidator.safeParse(await learnCard.read.get(uri));
            if (!parsed.success) continue;
            const credential = parsed.data;
            const subjects = Array.isArray(credential.credentialSubject)
                ? credential.credentialSubject
                : [credential.credentialSubject];
            if (credential.boostId !== boostUri || !subjects.some(subject => subject.id === did)) {
                continue;
            }
            await assertOwnerOperationActive(did);
            return credential;
        }
    }
    throw new Error('Private boost credential unavailable');
};
