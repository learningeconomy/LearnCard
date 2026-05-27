import React, { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import * as m from '../../../paraglide/messages.js';

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
 * Direct map from tab enum values to Paraglide message functions.
 */
const TAB_MESSAGE_MAP: Record<LaunchPadTabEnum, () => string> = {
    [LaunchPadTabEnum.myApps]: m['launchpad.tabs.myApps'],
    [LaunchPadTabEnum.ai]: m['launchpad.tabs.ai'],
    [LaunchPadTabEnum.learning]: m['launchpad.tabs.learning'],
    [LaunchPadTabEnum.games]: m['launchpad.tabs.games'],
    [LaunchPadTabEnum.tools]: m['launchpad.tabs.tools'],
    [LaunchPadTabEnum.employment]: m['launchpad.tabs.employment'],
    [LaunchPadTabEnum.credentials]: m['launchpad.tabs.credentials'],
    [LaunchPadTabEnum.other]: m['launchpad.tabs.other'],
    [LaunchPadTabEnum.plugins]: m['launchpad.tabs.plugins'],
    [LaunchPadTabEnum.all]: m['launchpad.tabs.all'],
};

type LaunchPadAppTabsProps = {
    tab: LaunchPadTabEnum;
    setTab: React.Dispatch<React.SetStateAction<LaunchPadTabEnum>>;
};

const LaunchPadAppTabs: React.FC<LaunchPadAppTabsProps> = ({ tab, setTab }) => {
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
                        {TAB_MESSAGE_MAP[option]()}
                    </button>
                );
            })}
        </div>
    );
};

export default LaunchPadAppTabs;
