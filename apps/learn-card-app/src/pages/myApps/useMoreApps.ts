import { useMemo } from 'react';
import type { AppStoreListing } from '@learncard/types';
import useAppStore from '../launchPad/useAppStore';

/**
 * Apps shown in the "More Apps" section of the My Apps landing.
 *
 * Priority: the user's installed apps → curated promos (featured, then curated)
 * → the full app-store list ("all apps", same as the browse page). The final
 * all-apps fallback ensures the section is never empty for a user with nothing
 * installed and no promos configured. `isSuggested` is true whenever we're
 * showing anything other than the user's own installed apps.
 */
const useMoreApps = () => {
    const { useInstalledApps, useFeaturedCarouselApps, useCuratedListApps, useBrowseAppStore } =
        useAppStore();
    const { data: installedData, isLoading: loadingInstalled } = useInstalledApps({ limit: 50 });
    const { data: featured, isLoading: loadingFeatured } = useFeaturedCarouselApps();
    const { data: curated, isLoading: loadingCurated } = useCuratedListApps();

    // Only run the full (50-item) all-apps scan when the user has no installed
    // apps — otherwise its result is never read. Gating avoids a network request
    // on every My Apps load for the common (has-installed-apps) case.
    const hasNoInstalled = !loadingInstalled && (installedData?.records?.length ?? 0) === 0;
    const { data: browseData, isLoading: loadingBrowse } = useBrowseAppStore({
        limit: 50,
        enabled: hasNoInstalled,
    });

    return useMemo(() => {
        const installed = installedData?.records ?? [];
        if (installed.length > 0) {
            return { apps: installed, isSuggested: false, isLoading: loadingInstalled };
        }

        // No installed apps → suggest. Walk the fallback tiers, waiting for each
        // in-flight fetch to resolve before falling through, so the grid doesn't
        // flash a lower-priority list and then swap.
        let suggested: AppStoreListing[] = [];
        if (loadingFeatured) {
            suggested = [];
        } else if ((featured?.length ?? 0) > 0) {
            suggested = featured ?? [];
        } else if (loadingCurated) {
            suggested = [];
        } else if ((curated?.length ?? 0) > 0) {
            suggested = curated ?? [];
        } else if (!loadingBrowse) {
            suggested = browseData?.records ?? [];
        }

        return {
            apps: suggested,
            isSuggested: true,
            isLoading: loadingInstalled || loadingFeatured || loadingCurated || loadingBrowse,
        };
    }, [
        installedData,
        featured,
        loadingFeatured,
        curated,
        loadingCurated,
        browseData,
        loadingBrowse,
        loadingInstalled,
    ]);
};

export default useMoreApps;
