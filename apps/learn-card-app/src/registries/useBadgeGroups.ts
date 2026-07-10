import { useQuery } from '@tanstack/react-query';
import { BadgeGroup, useTenantConfig } from 'learn-card-base';

const bundledBadgeGroupModules = import.meta.glob<BadgeGroup[]>('./badge-groups/*.json', {
    eager: true,
    import: 'default',
});

const getBundledBadgeGroups = (name: string): BadgeGroup[] =>
    bundledBadgeGroupModules[`./badge-groups/${name}.json`] ?? [];

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

const fetchBadgeGroupUrl = async (url: string): Promise<BadgeGroup[]> => {
    const data = await (await fetch(url)).json();
    return Array.isArray(data) ? data : [];
};

export const useBadgeGroups = () => {
    const { registries } = useTenantConfig();
    const badgeGroupUrls = registries?.badgeGroupUrls ?? [];
    const badgeGroupAssets = registries?.badgeGroupAssets ?? [];

    return useQuery<BadgeGroup[]>({
        queryKey: ['badgeGroups', badgeGroupUrls, badgeGroupAssets],
        initialData: [],
        queryFn: async () => {
            const remote = await Promise.all(
                badgeGroupUrls.map(url => fetchBadgeGroupUrl(url).catch(() => []))
            );
            const bundled = badgeGroupAssets.map(getBundledBadgeGroups);

            return mergeBadgeGroups([...remote, ...bundled]);
        },
    });
};
