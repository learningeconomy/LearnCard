import { IDXCredential, VC } from '@learncard/types';
import { Plugin } from './wallet';

export type FilterForPlane<Plugins extends Plugin[], Plane extends keyof Plugins[number]> = {
    [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
    ? never
    : Plugins[Index]['name'];
}[number];

// --- Read ---

export type ReadPlane = {
    get: (uri: string) => Promise<VC | undefined>;
};

export type ReadPlugin<P extends Plugin> = P & { read: ReadPlane };

// --- Store ---

export type StorePlane = {
    upload: (vc: VC) => Promise<string | undefined>;
    uploadMany?: (vcs: VC[]) => Promise<(string | undefined)[]>;
};

export type StorePlugin<P extends Plugin> = P & { store: StorePlane };

export type WalletStorePlane<Plugins extends Plugin[]> = Record<
    FilterForPlane<Plugins, 'store'>,
    StorePlane
>;

// --- Index ---

export type IndexPlane = {
    get: (query: Record<string, any>) => Promise<IDXCredential[]>;
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
