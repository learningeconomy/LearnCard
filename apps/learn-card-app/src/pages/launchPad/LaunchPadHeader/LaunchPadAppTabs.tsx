import React, { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';
import { StyleSetEnum } from '../../../theme/styles/index';

export enum LaunchPadTabEnum {
    myApps = 'My Apps',
    ai = 'AI',
    learning = 'Learning',
    games = 'Games',
    tools = 'Tools',
    employment = 'Employment',
    credentials = 'Credentials',
    other = 'Other',
    plugins = 'Plugins',
    all = 'All',
}

/**
 * Returns the i18n key for a given tab. Same reverse-enum-key trick as
 * getSideMenuTranslationKey() — the enum value is a display string like
 * "My Apps", so we look up the matching key ("myApps") for translation lookup.
 */
export const getTabTranslationKey = (tabValue: LaunchPadTabEnum): string => {
    const entry = (Object.entries(LaunchPadTabEnum) as [string, string][]).find(
        ([_k, v]) => v === tabValue
    );
    return entry ? entry[0] : String(tabValue);
};

type LaunchPadAppTabsProps = {
    tab: LaunchPadTabEnum;
    setTab: React.Dispatch<React.SetStateAction<LaunchPadTabEnum>>;
};

const LaunchPadAppTabs: React.FC<LaunchPadAppTabsProps> = ({ tab, setTab }) => {
    const { t } = useTranslation();
    const flags = useFlags();
    const { getColorSet, getStyleSet } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);
    const styleSet = getStyleSet(StyleSetEnum.defaults);

    const primaryColor = colorSet.primaryColor;
    const primaryColorShade = colorSet.primaryColorShade;
    const borderRadius = styleSet.tabs.borderRadius;

    // Filter tabs based on pluginVisibility flag
    const visibleTabs = useMemo(() => {
        return Object.values(LaunchPadTabEnum).filter(tabOption => {
            // Hide Plugins tab if pluginVisibility flag is not enabled
            if (tabOption === LaunchPadTabEnum.plugins && !flags?.pluginVisibility) {
                return false;
            }
            return true;
        });
    }, [flags?.pluginVisibility]);

    return (
        <div className="flex text-grayscale-900 w-full overflow-x-auto scrollbar-hide">
            {visibleTabs.map((option, index) => {
                const isActive = option === tab;

                return (
                    <button
                        key={index}
                        onClick={() => setTab(option)}
                        className={`${borderRadius} px-[15px] py-[5px] z-9999 border-solid border-[1px] font-poppins text-[14px] font-[600] leading-[130%] whitespace-nowrap flex-shrink-0 ${
                            isActive
                                ? `border-${primaryColorShade} border-opacity-40 bg-grayscale-50 text-${primaryColor}`
                                : 'border-transparent text-grayscale-600 xs:text-[12px]'
                        }`}
                    >
                        {t(`launchpad.tabs.${getTabTranslationKey(option)}`, option)}
                    </button>
                );
            })}
        </div>
    );
};

export default LaunchPadAppTabs;
