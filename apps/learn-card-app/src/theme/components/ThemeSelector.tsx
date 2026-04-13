import React, { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { getAllowedThemes, isThemeSwitchingEnabled } from '../store/themeStore';

import { applyTheme, useTheme } from '../hooks/useTheme';
import { loadThemeSchema, getRegisteredThemeIds } from '../helpers/loadTheme';
import { ThemeButton } from '../validators/theme.validators';
import { useUpdatePreferences } from 'learn-card-base';

export enum themeSelectorViewMode {
    Mini = 'mini',
    Full = 'full',
}

// TODOS:
// do a native builds ios + android
// check all existing flows

// checkout google doc, fix easiest items first
// # https://docs.google.com/document/d/1oBkAlfT-ipRzmndRLev2G_d54g12hwuncFEqS2_H8uA/edit?pli=1&tab=t.0#task=ApQbAo4m6trRc6nu

export const ThemeSelector: React.FC<{ viewMode?: themeSelectorViewMode }> = ({
    viewMode = themeSelectorViewMode.Full,
}) => {
    const flags = useFlags();
    const { theme } = useTheme();

    const allowedThemeIds = useMemo(() => {
        const allowed = new Set(getAllowedThemes());

        return getRegisteredThemeIds().filter(id => allowed.has(id));
    }, []);

    const schemas = useMemo(() => allowedThemeIds.map(loadThemeSchema), [allowedThemeIds]);

    const { mutateAsync: updatePreferences, isPending: isUpdatingPreferences } =
        useUpdatePreferences();

    const themeButtons = useMemo<ThemeButton[]>(() => {
        return schemas.map(schema => ({
            theme: schema.id,
            label: schema.displayName ?? schema.name,
            icon: schema.defaults?.switcherIcon ?? undefined,
        }));
    }, [schemas]);

    const handleSetTheme = async (themeSelected: string) => {
        await updatePreferences({
            theme: themeSelected,
        });
        applyTheme(themeSelected);
    };

    if (flags?.enableThemeToggle === false) return null;

    if (!isThemeSwitchingEnabled()) return null;

    if (viewMode === themeSelectorViewMode.Mini) {
        return (
            <div role="group" aria-label="Theme Selector">
                {themeButtons.map(btn => {
                    const selected = theme.id === btn.theme;
                    if (selected) return null;

                    return (
                        <button
                            key={btn.theme}
                            onClick={async () => {
                                await handleSetTheme(btn.theme);
                            }}
                            disabled={isUpdatingPreferences}
                            aria-pressed={selected}
                            className={`w-full flex items-center justify-start py-[12px] px-2 text-xs text-grayscale-900 rounded-full ${
                                selected ? 'bg-white rounded-[16px] shadow-soft-bottom' : ''
                            }`}
                        >
                            {btn.icon && (
                                <img
                                    src={btn.icon}
                                    alt=""
                                    aria-hidden
                                    className="min-w-[40px] min-h-[40px] w-[40px] h-[40px] object-contain"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="w-full px-4">
            <div className="w-full flex bg-white flex-col items-center justify-start py-4 rounded-[16px] gap-2">
                <div className="w-full px-4 flex flex-col gap-2">
                    <h4 className="w-full text-grayscale-900 text-[17px]">Choose Your Theme</h4>
                    <p className="w-full text-grayscale-600 text-xs">
                        {allowedThemeIds.includes('colorful') && allowedThemeIds.includes('formal')
                            ? 'Switch between our signature, colorful experience and a classic, formal style.'
                            : 'Choose your preferred visual style.'}
                    </p>
                </div>

                <div className="w-full px-2">
                    <div
                        className="w-full flex items-center justify-center bg-grayscale-100 rounded-[16px] p-[2px]"
                        role="group"
                        aria-label="Theme Selector"
                    >
                        {themeButtons.map(btn => {
                            const selected = theme.id === btn.theme;
                            return (
                                <button
                                    key={btn.theme}
                                    onClick={async () => {
                                        await handleSetTheme(btn.theme);
                                    }}
                                    disabled={isUpdatingPreferences}
                                    aria-pressed={selected}
                                    className={`w-full flex items-center justify-start py-[12px] px-2 text-xs text-grayscale-900 rounded-[10px] ${
                                        selected ? 'bg-white rounded-[16px] shadow-soft-bottom' : ''
                                    }`}
                                >
                                    {btn.icon && (
                                        <img
                                            src={btn.icon}
                                            alt=""
                                            aria-hidden
                                            className="w-[30px] h-[30px] object-contain"
                                        />
                                    )}
                                    <span className="ml-1">{btn.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelector;
