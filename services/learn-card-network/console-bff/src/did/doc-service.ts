import type { KeyManagementService, ManagedKeyRef } from '@kms';

import { buildManagedDidDocument, type DidDocument } from './did-web';

export interface ManagedKeyDirectory {
    getKeyRef(did: string): Promise<ManagedKeyRef | null>;
}

export interface MutableManagedKeyDirectory extends ManagedKeyDirectory {
    put(did: string, ref: ManagedKeyRef): Promise<void>;
}

export class InMemoryKeyDirectory implements MutableManagedKeyDirectory {
    private readonly refs = new Map<string, ManagedKeyRef>();

    async put(did: string, ref: ManagedKeyRef): Promise<void> {
        this.refs.set(did, ref);
    }

    async getKeyRef(did: string): Promise<ManagedKeyRef | null> {
        return this.refs.get(did) ?? null;
    }
}

export type DidDocumentServiceDeps = {
    kms: KeyManagementService;
    directory: ManagedKeyDirectory;
};

export class DidDocumentService {
    constructor(private readonly deps: DidDocumentServiceDeps) {}

    async resolve(did: string): Promise<DidDocument | null> {
        const ref = await this.deps.directory.getKeyRef(did);

        if (!ref) return null;

        const publicKeyJwk = await this.deps.kms.getPublicKeyJwk(ref);

        return buildManagedDidDocument(did, publicKeyJwk);
    }
}
