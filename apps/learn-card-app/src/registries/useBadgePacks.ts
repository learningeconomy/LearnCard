import { useQuery } from '@tanstack/react-query';
import {
    BadgePack,
    BadgeGroup,
    LCAStylesPackRegistryEntry,
    useTenantConfig,
} from 'learn-card-base';

export interface BadgePackRegistry {
    badges: LCAStylesPackRegistryEntry[];
    categories: BadgeGroup[];
}

const bundledBadgePackModules = import.meta.glob<BadgePack>('./badge-packs/*.json', {
    eager: true,
    import: 'default',
});

const getBundledBadgePack = (name: string): BadgePack =>
    bundledBadgePackModules[`./badge-packs/${name}.json`] ?? {};

const entryKey = (entry: LCAStylesPackRegistryEntry) => `${entry.category}::${entry.type}`;

const definedFields = (
    entry: Partial<LCAStylesPackRegistryEntry>
): Partial<LCAStylesPackRegistryEntry> =>
    Object.fromEntries(
        Object.entries(entry).filter(([, value]) => value !== undefined && value !== '')
    );

export const mergeStylePackEntries = (
    sources: LCAStylesPackRegistryEntry[][]
): LCAStylesPackRegistryEntry[] => {
    const merged = new Map<string, LCAStylesPackRegistryEntry>();

    for (const source of sources) {
        if (!Array.isArray(source)) continue;
        for (const entry of source) {
            if (!entry?.category || !entry?.type) continue;
            const key = entryKey(entry);
            const prev = merged.get(key);
            merged.set(key, { ...(prev ?? entry), ...definedFields(entry) });
        }
    }

    return [...merged.values()];
};

export const mergeBadgeGroups = (sources: BadgeGroup[][]): BadgeGroup[] => {
    const merged = new Map<string, BadgeGroup>();

    for (const source of sources) {
        if (!Array.isArray(source)) continue;
        for (const group of source) {
            if (!group?.id) continue;
            const prev = merged.get(group.id);
            merged.set(group.id, { ...(prev ?? {}), ...group });
        }
    }

    return [...merged.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const fetchBadgePackUrl = async (url: string): Promise<BadgePack> => {
    const data = await (await fetch(url)).json();
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as BadgePack) : {};
};

const useBadgePackQueryOptions = () => {
    const { registries } = useTenantConfig();
    const badgePackUrls = registries?.badgePackUrls ?? [];
    const badgePackAssets = registries?.badgePackAssets ?? [];

    return {
        queryKey: ['badgePackRegistry', badgePackUrls, badgePackAssets] as const,
        queryFn: async (): Promise<BadgePackRegistry> => {
            const remote = await Promise.all(
                badgePackUrls.map(url => fetchBadgePackUrl(url).catch(() => ({} as BadgePack)))
            );
            const bundled = badgePackAssets.map(getBundledBadgePack);
            const packs = [...remote, ...bundled];

            return {
                badges: mergeStylePackEntries(packs.map(pack => pack.badges ?? [])),
                categories: mergeBadgeGroups(packs.map(pack => pack.categories ?? [])),
            };
        },
        initialData: { badges: [], categories: [] } as BadgePackRegistry,
    };
};

export const useBadgePackRegistry = () => useQuery(useBadgePackQueryOptions());

export const useStylePacks = () =>
    useQuery({ ...useBadgePackQueryOptions(), select: data => data.badges });

export const useBadgeGroupsFromPacks = () =>
    useQuery({ ...useBadgePackQueryOptions(), select: data => data.categories });
