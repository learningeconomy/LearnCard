import { IDXCredential, VC, JWK } from '@learncard/types';
import { Plugin } from './wallet';

export type FilterForPlane<Plugins extends Plugin[], Plane extends keyof Plugins[number]> = {
    [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
    ? never
    : Plugins[Index]['name'];
}[number];

// --- Read ---

export type ReadPlane = {
    get: (uri?: string) => Promise<VC | undefined>;
};

export type ReadPlugin<P extends Plugin> = P & { read: ReadPlane };

// --- Store ---

export type StorePlane = {
    upload: (vc: VC) => Promise<string>;
    uploadMany?: (vcs: VC[]) => Promise<string[]>;
};

export type StorePlugin<P extends Plugin> = P & { store: StorePlane };

export type WalletStorePlane<Plugins extends Plugin[]> = Record<
    FilterForPlane<Plugins, 'store'>,
    StorePlane
>;

// --- Index ---

export type IndexPlane = {
    get: (query?: Record<string, any>) => Promise<IDXCredential[]>;
    add: (obj: IDXCredential) => Promise<boolean>;
    update: (id: string, updates: Record<string, any>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
};

export type IndexPlugin<P extends Plugin> = P & { index: IndexPlane };

export type WalletIndexPlane<Plugins extends Plugin[]> = { all: Pick<IndexPlane, 'get'> } & Record<
    FilterForPlane<Plugins, 'index'>,
    IndexPlane
>;

// --- Cache ---

export type CachePlane = {
    getIndex: (query: Record<string, any>) => Promise<IDXCredential[] | undefined>;
    setIndex: (query: Record<string, any>, value: IDXCredential[]) => Promise<boolean>;
    getVc: (uri: string) => Promise<VC | undefined>;
    setVc: (uri: string, value: VC) => Promise<boolean>;
};

export type CachePlugin<P extends Plugin> = P & { cache: CachePlane };

// --- Identity ---

export type GetDidMethodFromPlugin<P extends Plugin> = any extends P
    ? never
    : P['id'] extends undefined
    ? never
    : Parameters<NonNullable<P['id']>['did']>[0];

export type GetAlgorithmFromPlugin<P extends Plugin> = any extends P
    ? never
    : P['id'] extends undefined
    ? never
    : Parameters<NonNullable<P['id']>['keypair']>[0];

export type IdPlane<DidMethod extends string | undefined, Algorithm extends string | undefined> = {
    did: (method?: DidMethod) => string;
    keypair: (algorithm?: Algorithm) => JWK;
};

export type IdPlugin<P extends Plugin, DidMethod extends string, Algorithm extends string> = P & {
    id: IdPlane<DidMethod, Algorithm>;
};

export type WalletIdPlane<Plugins extends Plugin[]> = any[] extends Plugins
    ? any
    : IdPlane<GetDidMethodFromPlugin<Plugins[number]>, GetAlgorithmFromPlugin<Plugins[number]>>;
