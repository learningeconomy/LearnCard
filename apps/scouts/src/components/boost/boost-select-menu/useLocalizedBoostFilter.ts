import { useMemo } from 'react';

import { useLocale } from '../../../i18n';

type LocalizedBoostOption = {
    title?: string;
};

export const useLocalizedBoostFilter = <T extends LocalizedBoostOption>(
    options: readonly T[] | undefined,
    search: string
): T[] => {
    const locale = useLocale();

    return useMemo(
        () =>
            options?.filter(option => option.title?.toLowerCase().includes(search.toLowerCase())) ??
            [],
        [options, search, locale]
    );
};
