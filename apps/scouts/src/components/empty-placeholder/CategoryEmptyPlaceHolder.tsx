import React from 'react';

import { CredentialCategoryEnum } from 'learn-card-base';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';

// import { useTheme } from '../../theme/hooks/useTheme';
// import { ThemeEnum } from '../../theme/helpers/theme-helpers';
// import { IconSetEnum } from '../../theme/icons/index';

export const CategoryEmptyPlaceholder: React.FC<{
    category: CredentialCategoryEnum;
    iconClassName?: string;
}> = ({ category, iconClassName }) => {
    // const { getThemedCategoryIcons, theme, getIconSet } = useTheme();
    // const { floatingBottle: FloatingBottleIcon } = getIconSet(IconSetEnum.placeholders);
    // const { IconWithLightShape, IconWithShape } = getThemedCategoryIcons(category);

    // ! The formal theme does not have a set of placeholders per category
    // ! So we use the floating bottle icon for all categories
    // if (theme.id === ThemeEnum.Formal) {
    //     return (
    //         <div className="w-full flex items-center justify-center relative mt-[100px]">
    //             <FloatingBottleIcon className="w-[175px] h-[175px]" />
    //         </div>
    //     );
    // }

    // Only Skills uses this in Scouts right now, so we'll just hardcode it in here...
    return (
        <div className="w-full flex items-center justify-center relative mt-[100px]">
            <SkillsIconWithShape className={iconClassName} />
            {/* {IconWithLightShape && <IconWithLightShape className={iconClassName} />}
            {!IconWithLightShape && IconWithShape && <IconWithShape className={iconClassName} />} */}
        </div>
    );
};

export default CategoryEmptyPlaceholder;
