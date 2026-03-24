import React from 'react';

import { CredentialCategoryEnum } from 'learn-card-base';

import { useTheme } from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons/index';

export const CategoryEmptyPlaceholder: React.FC<{
    category: CredentialCategoryEnum;
    iconClassName?: string;
}> = ({ category, iconClassName }) => {
    const { getThemedCategoryIcons, theme, getIconSet } = useTheme();
    const { floatingBottle: FloatingBottleIcon } = getIconSet(IconSetEnum.placeholders);
    const { IconWithLightShape, IconWithShape } = getThemedCategoryIcons(category);

    // ! The formal theme does not have a set of placeholders per category
    // ! So we use the floating bottle icon for all categories
    if (theme.id === 'formal') {
        return (
            <div className="w-full flex items-center justify-center relative mt-[100px]">
                <FloatingBottleIcon className="w-[175px] h-[175px]" />
            </div>
        );
    }

    const defaultSizeClass = 'w-[200px] h-[200px]';
    const cls = iconClassName || defaultSizeClass;

    return (
        <div className="w-full flex items-center justify-center relative mt-[100px]">
            {IconWithLightShape && <IconWithLightShape className={cls} />}
            {!IconWithLightShape && IconWithShape && <IconWithShape className={cls} />}
        </div>
    );
};

export default CategoryEmptyPlaceholder;
