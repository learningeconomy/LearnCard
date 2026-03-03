import { LCNProfile } from '@learncard/types';
import { QueryClient, InfiniteData } from '@tanstack/react-query';
// Helper to insert an object and update the react infinite query cache
export const insertItem = <GenericObject extends Record<string, any>>(
    queryClient: QueryClient,
    queryKey: string[],
    newItem: GenericObject
) => {
    queryClient.setQueryData<
        InfiniteData<
            { records: GenericObject[]; hasMore: boolean; cursor?: string },
            string | undefined
        >
    >(queryKey, old => {
        // perhaps this case where no existing data could be better handled
        if (!old) {
            return { pageParams: [undefined], pages: [{ records: [newItem], hasMore: false }] };
        }

        // Insert the new item at the start
        const firstPageResults = [newItem, ...old.pages[0].records];

        // Adjust all pages to respect the page size
        let carryOverItem = firstPageResults.pop(); // Item to move to the next page
        const newPages = old.pages.map((page, pageIndex) => {
            if (pageIndex === 0) return { ...page, records: firstPageResults };

            const newResults = carryOverItem ? [carryOverItem, ...page.records] : page.records;
            carryOverItem = newResults.pop(); // Update carryOverItem for the next iteration

            return { ...page, records: newResults };
        });

        // If there's an item to carry over to a new page, add it
        if (carryOverItem) newPages.push({ records: [carryOverItem], hasMore: false });

        return { ...old, pages: newPages };
    });
};

// Function to update admin list
export const updateAdminList = (
    queryClient: QueryClient,
    boostUri: string,
    newAdmin: LCNProfile
) => {
    queryClient.setQueryData(
        ['getAdmins', boostUri],
        (old: { hasMore: boolean; records: LCNProfile[] } | undefined) => {
            if (!old) {
                return {
                    hasMore: false,
                    records: [newAdmin],
                };
            }

            return {
                ...old,
                records: [...old.records, newAdmin],
            };
        }
    );
};
