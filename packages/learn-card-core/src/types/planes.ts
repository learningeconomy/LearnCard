import { Plugin } from './wallet';

export type FilterForPlane<Plugins extends Plugin[], Plane extends keyof Plugins[number]> = {
    [Index in keyof Plugins]: undefined extends Plugins[Index][Plane]
        ? never
        : Plugins[Index]['name'];
}[number];

export type StoragePlane = {
    get: () => void;
    getMany: () => void;
    upload: () => void;
    set: () => void;
    remove: () => void;
};

export type StoragePlugin<P extends Plugin> = P & { storage: StoragePlane };

export type WalletStorage<Plugins extends Plugin[]> = { all: StoragePlane } & Record<
    FilterForPlane<Plugins, 'storage'>,
    StoragePlane
>;

export type CachingPlane =
    | { getLocal: () => void; setLocal: () => void }
    | { getRemote: () => void; setRemote: () => void }
    | { getLocal: () => void; getRemote: () => void; setLocal: () => void; setRemote: () => void };

export type WalletCachingPlane = {
    get: () => void;
    set: () => void;
};

export type CachingPlugin<P extends Plugin> = P & { caching: CachingPlane };

export type WalletCaching<Plugins extends Plugin[]> = { all: WalletCachingPlane } & Record<
    FilterForPlane<Plugins, 'caching'>,
    WalletCachingPlane
>;
