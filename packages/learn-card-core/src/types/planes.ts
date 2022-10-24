import { IDXCredential, VC, JWK } from '@learncard/types';
import { Plugin } from './wallet';
import { OmitNevers } from './helpers';

export type ControlPlane = 'read' | 'store' | 'index' | 'cache' | 'id';

export type FilterForPlane<Plugins extends Plugin[], Plane extends ControlPlane> = {
    [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
        ? never
        : Plugins[Index]['name'];
}[number];

export type GetPlanesForPlugins<Plugins extends Plugin[]> = any[] extends Plugins
    ? never
    : {
          [Index in keyof Plugins]: {
              [Key in ControlPlane]: undefined extends Plugins[Index][Key] ? never : Key;
          }[ControlPlane];
      }[number];

export type GetPlaneProviders<
    Plugins extends Plugin[],
    Plane extends ControlPlane
> = any[] extends Plugins
    ? any
    : {
          [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
              ? never
              : OmitNevers<{
                    [Name in Plugins[number]['name']]: Name extends Plugins[Index]['name']
                        ? { name: Name }
                        : never;
                }>;
      }[number];

// --- Read ---

export type ReadPlane = {
    get: (uri?: string) => Promise<VC | undefined>;
};

export type ReadPlugin<P extends Plugin> = P & { read: ReadPlane };

export type WalletReadPlane<Plugins extends Plugin[]> = ReadPlane & {
    providers: GetPlaneProviders<Plugins, 'read'>;
};

// --- Store ---

export type StorePlane = {
    upload: (vc: VC) => Promise<string>;
    uploadMany?: (vcs: VC[]) => Promise<string[]>;
};

export type StorePlugin<P extends Plugin> = P & { store: StorePlane };

export type WalletStorePlane<Plugins extends Plugin[]> = Record<
    FilterForPlane<Plugins, 'store'>,
    StorePlane
> & {
    providers: GetPlaneProviders<Plugins, 'store'>;
};

// --- Index ---

export type IndexPlane = {
    get: (query?: Record<string, any>) => Promise<IDXCredential[]>;
    add: (obj: IDXCredential) => Promise<boolean>;
    update: (id: string, updates: Record<string, any>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
};

export type IndexPlugin<P extends Plugin> = P & { index: IndexPlane };

export type WalletIndexPlane<Plugins extends Plugin[]> = {
    all: Pick<IndexPlane, 'get'>;
    providers: GetPlaneProviders<Plugins, 'index'>;
} & Record<FilterForPlane<Plugins, 'index'>, IndexPlane>;

// --- Cache ---

export type CachePlane = {
    getIndex: (query: Record<string, any>) => Promise<IDXCredential[] | undefined>;
    setIndex: (query: Record<string, any>, value: IDXCredential[]) => Promise<boolean>;
    getVc: (uri: string) => Promise<VC | undefined>;
    setVc: (uri: string, value: VC) => Promise<boolean>;
};

export type CachePlugin<P extends Plugin> = P & { cache: CachePlane };

export type WalletCachePlane<Plugins extends Plugin[]> = CachePlane & {
    providers: GetPlaneProviders<Plugins, 'cache'>;
};

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
    did: <T extends string | undefined = DidMethod>(method?: T) => string;
    keypair: <T extends string | undefined = Algorithm>(algorithm?: T) => JWK;
};

export type IdPlugin<P extends Plugin, DidMethod extends string, Algorithm extends string> = P & {
    id: IdPlane<DidMethod, Algorithm>;
};

export type WalletIdPlane<Plugins extends Plugin[]> = (any[] extends Plugins
    ? IdPlane<any, any>
    : IdPlane<GetDidMethodFromPlugin<Plugins[number]>, GetAlgorithmFromPlugin<Plugins[number]>>) & {
    providers: GetPlaneProviders<Plugins, 'id'>;
};
