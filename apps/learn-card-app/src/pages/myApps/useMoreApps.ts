import { useMemo } from 'react';
import useAppStore from '../launchPad/useAppStore';

const useMoreApps = () => {
    const { useInstalledApps, useFeaturedCarouselApps, useCuratedListApps } = useAppStore();
    const { data: installedData, isLoading: loadingInstalled } = useInstalledApps({ limit: 50 });
    const { data: featured } = useFeaturedCarouselApps();
    const { data: curated, isLoading: loadingCurated } = useCuratedListApps();

    const installed = installedData?.records ?? [];

    return useMemo(() => {
        if (installed.length > 0) {
            return { apps: installed, isSuggested: false, isLoading: loadingInstalled };
        }
        const suggested = (featured?.length ?? 0) > 0 ? featured ?? [] : curated ?? [];
        return {
            apps: suggested,
            isSuggested: true,
            isLoading: loadingInstalled || loadingCurated,
        };
    }, [installed, featured, curated, loadingInstalled, loadingCurated]);
};

export default useMoreApps;
