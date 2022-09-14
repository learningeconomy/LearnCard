import { Plugin } from './wallet';

export type FilterForPlane<Plugins extends Plugin[], Plane extends keyof Plugins[number]> = {
    [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
        ? never
        : Plugins[Index]['name'];
}[number];

export type StoragePlane = {
    get: (query: string) => void;
    getMany: (query: string) => void;
    upload: (data: string) => void;
    set: (query: string, data: string) => void;
    remove: (query: string) => void;
};

export type StoragePlugin<P extends Plugin> = P & { storage: StoragePlane };

export type WalletStorage<Plugins extends Plugin[]> = { all: StoragePlane } & Record<
    FilterForPlane<Plugins, 'storage'>,
    StoragePlane
>;

export type CachePlane = {
    getLocal?: (args: { name: string; operation: 'get' | 'getMany'; query: any }) => any;
    getRemote?: (args: { name: string; operation: 'get' | 'getMany'; query: any }) => any;
    setLocal?: (args: {
        name: string;
        operation: 'upload' | 'set' | 'remove';
        query: any;
        data?: any;
    }) => void;
    setRemote?: (args: {
        name: string;
        operation: 'upload' | 'set' | 'remove';
        query: any;
        data?: any;
    }) => void;
    flush: () => void;
};

export type WalletCachePlane = {
    get: (args: { name: string; operation: 'get' | 'getMany'; query: any }) => any;
    set: (args: {
        name: string;
        operation: 'upload' | 'set' | 'remove';
        query: any;
        data?: any;
    }) => void;
    flush: () => void;
};

export type CachePlugin<P extends Plugin> = P & { cache: CachePlane };

export type WalletCache<Plugins extends Plugin[]> = { all: WalletCachePlane } & Record<
    FilterForPlane<Plugins, 'cache'>,
    WalletCachePlane
>;
