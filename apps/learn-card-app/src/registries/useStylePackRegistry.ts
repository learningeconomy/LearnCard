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

// Some registries (e.g. peerbadges.com) publish a single combined document
// shaped like `{ categories: [...], badges: [...] }` instead of a bare array,
// so `useBadgeGroups` and `useStylePackRegistry` can both point at the same
// URL. `category` there is a fine-grained persona label (e.g. "Bold &
// Adventurous"), which doesn't match the picker's coarse `PICKER_BADGE_CATEGORIES`
// gate — normalize it the same way the bundled `badge-summit.json` snapshot of
// this same catalog does, so entries also dedupe/enrich against it instead of
// appearing as duplicate tiles.
type PeerBadgeDocumentEntry = {
    category: string;
    type: string;
    title?: string;
    url: string;
    backgroundColor?: string;
    description?: string;
    criteria?: string;
};

const fromCombinedDocument = (data: unknown): LCAStylesPackRegistryEntry[] => {
    const badges = (data as { badges?: PeerBadgeDocumentEntry[] })?.badges;
    if (!Array.isArray(badges)) return [];

    return badges.map(badge => ({
        category: badge.category === 'Standards & Specs' ? 'Standards Badge' : 'Social Badge',
        type: badge.type,
        url: badge.url,
        backgroundColor: badge.backgroundColor,
        title: badge.title,
        description: badge.description,
        criteria: badge.criteria,
    }));
};

const fetchStylePackUrl = async (url: string): Promise<LCAStylesPackRegistryEntry[]> => {
    const data = await (await fetch(url)).json();
    if (Array.isArray(data)) return data;
    return fromCombinedDocument(data);
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
