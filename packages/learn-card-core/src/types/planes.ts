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
                        ? { name: Name; displayName?: string; description?: string }
                        : never;
                }>;
      }[number];

// --- Read ---

export type ReadPlane = {
    get: (uri?: string) => Promise<VC | undefined>;
};

export type WalletReadPlane<Plugins extends Plugin[]> = ReadPlane & {
    providers: GetPlaneProviders<Plugins, 'read'>;
};

// --- Store ---

export type StorePlane = {
    upload: (vc: VC) => Promise<string>;
    uploadMany?: (vcs: VC[]) => Promise<string[]>;
};

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

export type WalletCachePlane<Plugins extends Plugin[]> = CachePlane & {
    providers: GetPlaneProviders<Plugins, 'cache'>;
};

// --- Identity ---

export type IdPlane = {
    did: (method?: string) => string;
    keypair: (algorithm?: string) => JWK;
};

export type WalletIdPlane<Plugins extends Plugin[]> = IdPlane & {
    providers: GetPlaneProviders<Plugins, 'id'>;
};
