import React, { useEffect, useMemo, useRef } from 'react';
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
    const pointerStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 16;

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

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse') return;

        pointerStartRef.current = {
            x: event.clientX,
            scrollLeft: event.currentTarget.scrollLeft,
        };
        hasDraggedRef.current = false;
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse' || !pointerStartRef.current) return;

        const deltaX = event.clientX - pointerStartRef.current.x;

        if (Math.abs(deltaX) > dragThreshold) {
            hasDraggedRef.current = true;
        }

        event.currentTarget.scrollLeft = pointerStartRef.current.scrollLeft - deltaX;
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'mouse') return;

        pointerStartRef.current = null;
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    useEffect(() => {
        const resetDragState = () => {
            pointerStartRef.current = null;
            hasDraggedRef.current = false;
        };

        window.addEventListener('mouseup', resetDragState);
        window.addEventListener('pointerup', resetDragState);
        window.addEventListener('pointercancel', resetDragState);
        window.addEventListener('blur', resetDragState);

        return () => {
            window.removeEventListener('mouseup', resetDragState);
            window.removeEventListener('pointerup', resetDragState);
            window.removeEventListener('pointercancel', resetDragState);
            window.removeEventListener('blur', resetDragState);
        };
    }, []);

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClickCapture={handleClickCapture}
            className="flex text-grayscale-900 w-full overflow-x-auto scrollbar-hide select-none cursor-grab active:cursor-grabbing"
        >
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
