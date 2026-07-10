import { useQuery } from '@tanstack/react-query';
import { LCAStylesPackRegistryEntry, useTenantConfig } from 'learn-card-base';

const bundledStylePackModules = import.meta.glob<LCAStylesPackRegistryEntry[]>(
    './style-packs/*.json',
    { eager: true, import: 'default' }
);

const getBundledStylePack = (name: string): LCAStylesPackRegistryEntry[] =>
    bundledStylePackModules[`./style-packs/${name}.json`] ?? [];

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

const fetchStylePackUrl = async (url: string): Promise<LCAStylesPackRegistryEntry[]> => {
    const data = await (await fetch(url)).json();
    return Array.isArray(data) ? data : [];
};

export const useStylePackRegistry = () => {
    const { registries } = useTenantConfig();
    const stylePackUrls = registries?.stylePackUrls ?? [];
    const stylePackAssets = registries?.stylePackAssets ?? [];

    return useQuery<LCAStylesPackRegistryEntry[]>({
        queryKey: ['stylePackRegistry', stylePackUrls, stylePackAssets],
        initialData: [],
        queryFn: async () => {
            const remote = await Promise.all(
                stylePackUrls.map(url => fetchStylePackUrl(url).catch(() => []))
            );
            const bundled = stylePackAssets.map(getBundledStylePack);

            return mergeStylePackEntries([...remote, ...bundled]);
        },
    });
};
