import { renderHook } from '@testing-library/react';

let installed: any[] = [];
let featured: any[] = [];
let curated: any[] = [];
let browse: any[] = [];
let featuredLoading = false;
let browseLoading = false;

vi.mock('../launchPad/useAppStore', () => ({
    default: () => ({
        useInstalledApps: () => ({ data: { records: installed }, isLoading: false }),
        useFeaturedCarouselApps: () => ({ data: featured, isLoading: featuredLoading }),
        useCuratedListApps: () => ({ data: curated, isLoading: false }),
        useBrowseAppStore: () => ({ data: { records: browse }, isLoading: browseLoading }),
    }),
}));

import useMoreApps from './useMoreApps';

describe('useMoreApps', () => {
    beforeEach(() => {
        installed = [];
        featured = [];
        curated = [];
        browse = [];
        featuredLoading = false;
        browseLoading = false;
    });

    it('returns installed apps when the user has some', () => {
        installed = [{ listing_id: 'a' }];
        featured = [{ listing_id: 'f' }];
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps.map(a => a.listing_id)).toEqual(['a']);
        expect(result.current.isSuggested).toBe(false);
    });

    it('falls back to featured when nothing is installed', () => {
        featured = [{ listing_id: 'f' }];
        curated = [{ listing_id: 'c' }];
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps.map(a => a.listing_id)).toEqual(['f']);
        expect(result.current.isSuggested).toBe(true);
    });

    it('falls back to curated when nothing is installed and no featured', () => {
        curated = [{ listing_id: 'c' }];
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps.map(a => a.listing_id)).toEqual(['c']);
        expect(result.current.isSuggested).toBe(true);
    });

    it('does not flash curated while featured is still loading', () => {
        featuredLoading = true;
        curated = [{ listing_id: 'c' }];
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps).toEqual([]);
        expect(result.current.isSuggested).toBe(true);
        expect(result.current.isLoading).toBe(true);
    });

    it('falls back to all browsed apps when installed, featured, and curated are all empty', () => {
        browse = [{ listing_id: 'b1' }, { listing_id: 'b2' }];
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps.map(a => a.listing_id)).toEqual(['b1', 'b2']);
        expect(result.current.isSuggested).toBe(true);
    });

    it('does not flash all-apps while browse is still loading', () => {
        browseLoading = true;
        const { result } = renderHook(() => useMoreApps());
        expect(result.current.apps).toEqual([]);
        expect(result.current.isSuggested).toBe(true);
    });
});
