import User from 'learn-card-base/svgs/User';

import { getInfoFromContractKey } from '../helpers/contract.helpers';
import { useContractProfileFieldLabel } from './useContractProfileFieldLabel';

/** Resolve display metadata without changing the category used for grants or storage. */
export const useContractCategoryInfo = (
    category: string
): ReturnType<typeof getInfoFromContractKey> => {
    const getProfileFieldLabel = useContractProfileFieldLabel();
    const title = getProfileFieldLabel(category);
    if (title === undefined) return getInfoFromContractKey(category);

    return {
        IconComponent: User,
        title,
        plural: title,
        iconClassName: 'text-grayscale-700',
        iconCircleClass: 'bg-grayscale-100',
    };
};
