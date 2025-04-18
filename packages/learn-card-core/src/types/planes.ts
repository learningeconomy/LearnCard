import { CredentialRecord, VC, VP, JWKWithPrivateKey } from '@learncard/types';
import { Query } from 'sift';
import { Plugin } from './wallet';
import { OmitNevers } from './helpers';
import { DeepPartial } from './utilities';

export type CacheStrategy = 'cache-only' | 'cache-first' | 'skip-cache';

export type PlaneOptions = {
    cache?: CacheStrategy;
};

export type ControlPlane = 'read' | 'store' | 'index' | 'cache' | 'id' | 'context';

export type FilterForPlane<Plugins extends Plugin[], Plane extends ControlPlane> = [
    Plugins
] extends [1 & Plugins]
    ? any
    : {
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

// --- Read --- \\

export type ReadPlane = {
    get: (uri?: string, options?: PlaneOptions) => Promise<VC | VP | undefined>;
};

export type PluginReadPlane = ReadPlane;

export type LearnCardReadPlane<Plugins extends Plugin[]> = ReadPlane & {
    providers: GetPlaneProviders<Plugins, 'read'>;
};

// --- Store --- \\

export type EncryptionParams = {
    recipients: string[];
};

export type StorePlane = {
    upload: (vc: VC | VP, options?: PlaneOptions) => Promise<string>;
    uploadMany?: (vcs: (VC | VP)[], options?: PlaneOptions) => Promise<string[]>;
    uploadEncrypted?: (
        vc: VC | VP,
        params?: EncryptionParams,
        options?: PlaneOptions
    ) => Promise<string>;
};

export type PluginStorePlane = StorePlane;

export type LearnCardStorePlane<Plugins extends Plugin[]> = Record<
    FilterForPlane<Plugins, 'store'>,
    StorePlane
> & {
    providers: GetPlaneProviders<Plugins, 'store'>;
};

// --- Index --- \\

export type IndexPlane = {
    get: <Metadata extends Record<string, any> = Record<never, never>>(
        query?: Partial<Query<CredentialRecord<Metadata>>>,
        options?: PlaneOptions
    ) => Promise<CredentialRecord<Metadata>[]>;
    getPage?: <Metadata extends Record<string, any> = Record<never, never>>(
        query?: Partial<Query<CredentialRecord<Metadata>>>,
        paginationOptions?: { limit?: number; cursor?: string; sort?: string },
        options?: PlaneOptions
    ) => Promise<{ records: CredentialRecord<Metadata>[]; hasMore: boolean; cursor?: string }>;
    getCount?: <Metadata extends Record<string, any> = Record<never, never>>(
        query?: Partial<Query<CredentialRecord<Metadata>>>,
        options?: PlaneOptions
    ) => Promise<number>;
    add: <Metadata extends Record<string, any> = Record<never, never>>(
        record: CredentialRecord<Metadata>,
        options?: PlaneOptions
    ) => Promise<boolean>;
    addMany?: <Metadata extends Record<string, any> = Record<never, never>>(
        records: CredentialRecord<Metadata>[],
        options?: PlaneOptions
    ) => Promise<boolean>;
    update: <Metadata extends Record<string, any> = Record<never, never>>(
        id: string,
        updates: DeepPartial<CredentialRecord<Metadata>>,
        options?: PlaneOptions
    ) => Promise<boolean>;
    remove: (id: string, options?: PlaneOptions) => Promise<boolean>;
    removeAll?: (options?: PlaneOptions) => Promise<boolean>;
};

export type PluginIndexPlane = IndexPlane;

export type LearnCardIndexPlane<Plugins extends Plugin[]> = {
    all: Pick<IndexPlane, 'get'>;
    providers: GetPlaneProviders<Plugins, 'index'>;
} & Record<FilterForPlane<Plugins, 'index'>, IndexPlane>;

// --- Cache --- \\

export type CachePlane = {
    getIndex: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>
    ) => Promise<CredentialRecord<Metadata>[] | undefined>;
    setIndex: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>,
        value: CredentialRecord<Metadata>[]
    ) => Promise<boolean>;
    getIndexPage: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>,
        paginationOptions?: { limit?: number; cursor?: string; sort?: string }
    ) => Promise<
        { records: CredentialRecord<Metadata>[]; hasMore: boolean; cursor?: string } | undefined
    >;
    setIndexPage: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>,
        value: { records: CredentialRecord<Metadata>[]; hasMore: boolean; cursor?: string },
        paginationOptions?: { limit?: number; cursor?: string }
    ) => Promise<boolean>;
    getIndexCount?: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>
    ) => Promise<number | undefined>;
    setIndexCount?: <Metadata extends Record<string, any> = Record<never, never>>(
        name: string,
        query: Partial<Query<CredentialRecord<Metadata>>>,
        value: number
    ) => Promise<boolean>;
    flushIndex: () => Promise<boolean>;
    getVc: (uri: string) => Promise<VC | VP | undefined>;
    setVc: (uri: string, value: VC | VP | undefined) => Promise<boolean>;
    flushVc: () => Promise<boolean>;
};
export type PluginCachePlane = CachePlane;

export type LearnCardCachePlane<Plugins extends Plugin[]> = CachePlane & {
    providers: GetPlaneProviders<Plugins, 'cache'>;
};

// --- Identity --- \\

export type IdPlane = {
    did: (method?: string, options?: PlaneOptions) => string;
    keypair: (algorithm?: string, options?: PlaneOptions) => JWKWithPrivateKey;
};

export type PluginIdPlane = IdPlane;

export type LearnCardIdPlane<Plugins extends Plugin[]> = IdPlane & {
    providers: GetPlaneProviders<Plugins, 'id'>;
};

// --- Contexts --- \\

export type ContextPlane = {
    resolveDocument: (
        uri: string,
        allowRemote?: boolean
    ) => Promise<Record<string, any> | undefined>;
};

export type PluginContextPlane = {
    resolveStaticDocument: (uri: string) => Promise<Record<string, any> | undefined>;
    resolveRemoteDocument?: (uri: string) => Promise<Record<string, any> | undefined>;
};

export type LearnCardContextPlane<Plugins extends Plugin[]> = ContextPlane & {
    providers: GetPlaneProviders<Plugins, 'context'>;
};
