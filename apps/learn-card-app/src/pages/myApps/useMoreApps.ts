import { useMemo } from 'react';
import useAppStore from '../launchPad/useAppStore';

const useMoreApps = () => {
    const { useInstalledApps, useFeaturedCarouselApps, useCuratedListApps } = useAppStore();
    const { data: installedData, isLoading: loadingInstalled } = useInstalledApps({ limit: 50 });
    const { data: featured, isLoading: loadingFeatured } = useFeaturedCarouselApps();
    const { data: curated, isLoading: loadingCurated } = useCuratedListApps();

    return useMemo(() => {
        const installed = installedData?.records ?? [];
        if (installed.length > 0) {
            return { apps: installed, isSuggested: false, isLoading: loadingInstalled };
        }
        // While featured is still in-flight, return nothing rather than falling back
        // to curated — otherwise the grid flashes curated apps and then swaps to
        // featured once the fetch lands.
        const suggested = loadingFeatured
            ? []
            : (featured?.length ?? 0) > 0
            ? featured ?? []
            : curated ?? [];
        return {
            apps: suggested,
            isSuggested: true,
            isLoading: loadingInstalled || loadingFeatured || loadingCurated,
        };
    }, [installedData, featured, loadingFeatured, curated, loadingInstalled, loadingCurated]);
};

export default useMoreApps;
