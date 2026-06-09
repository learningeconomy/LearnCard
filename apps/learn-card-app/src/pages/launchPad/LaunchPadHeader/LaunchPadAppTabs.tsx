import React, { useMemo, useRef } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

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

type LaunchPadAppTabsProps = {
    tab: LaunchPadTabEnum;
    setTab: React.Dispatch<React.SetStateAction<LaunchPadTabEnum>>;
};

const LaunchPadAppTabs: React.FC<LaunchPadAppTabsProps> = ({ tab, setTab }) => {
    const flags = useFlags();
    const { getColorSet, getStyleSet } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);
    const styleSet = getStyleSet(StyleSetEnum.defaults);
    const tabsScrollRef = useRef<HTMLDivElement | null>(null);
    const pointerStartRef = useRef<{ x: number; scrollLeft: number } | null>(null);
    const hasDraggedRef = useRef(false);

    const dragThreshold = 8;

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

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Ignore browsers that do not support pointer capture on this element.
        }
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

        try {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
        } catch {
            // Ignore browsers that do not support pointer capture release here.
        }
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!hasDraggedRef.current) return;

        event.preventDefault();
        event.stopPropagation();
        hasDraggedRef.current = false;
    };

    return (
        <div
            ref={tabsScrollRef}
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
                        {option}
                    </button>
                );
            })}
        </div>
    );
};

export default LaunchPadAppTabs;
