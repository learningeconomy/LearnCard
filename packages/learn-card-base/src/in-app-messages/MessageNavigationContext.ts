import { createContext } from 'react';

/** Only LearnCard App supplies embedded-app navigation; ScoutPass leaves it unavailable. */
export const MessageNavigationContext = createContext<{
    openApp?: (listingId: string, path?: string) => void;
}>({});
