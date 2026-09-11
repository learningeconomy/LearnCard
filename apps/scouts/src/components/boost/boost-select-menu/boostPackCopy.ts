import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

import * as m from '../../../paraglide/messages.js';
import type { BadgePackOptionsEnum } from './badge-pack.helper';

export const getLocalizedBoostPackTypeTitle = (
    packType: BadgePackOptionsEnum | undefined,
    category: BoostCategoryOptionsEnum
): string => {
    switch (packType) {
        case 'network':
            return m['boost.network']();
        case 'troop':
            return m['boost.troop']();
        default:
            return category === BoostCategoryOptionsEnum.meritBadge
                ? m['boost.badge']()
                : m['boost.boost']();
    }
};
