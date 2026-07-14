import React, { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import * as m from '../../paraglide/messages.js';

import { getAllowedThemes, isThemeSwitchingEnabled } from '../store/themeStore';

import { applyTheme, useTheme } from '../hooks/useTheme';
import { loadThemeSchema, getRegisteredThemeIds } from '../helpers/loadTheme';
import { ThemeButton } from '../validators/theme.validators';
import { useUpdatePreferences } from 'learn-card-base';
import Swatches from '../../components/svgs/Swatches';

export enum themeSelectorViewMode {
    Mini = 'mini',
    Full = 'full',
    // Compact single-row toggle for the desktop side menu (LC-1921):
    // swatches icon + "Colorful/Neutral Mode" label + a switch that flips
    // between the colorful and formal (neutral) themes.
    Compact = 'compact',
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
    const { theme, colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

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

    if (viewMode === themeSelectorViewMode.Compact) {
        const isColorful = theme.id === 'colorful';
        const targetTheme = isColorful ? 'formal' : 'colorful';

        // Compact toggle only makes sense as a colorful ↔ neutral switch.
        // If the alternate theme isn't allowed for this tenant, hide it.
        if (!allowedThemeIds.includes(targetTheme)) return null;

        const label = isColorful ? 'Colorful Mode' : 'Neutral Mode';
        const onColor = primaryColor ? `bg-${primaryColor}` : 'bg-indigo-500';

        return (
            <div className="w-full px-4">
                <button
                    type="button"
                    onClick={async () => {
                        await handleSetTheme(targetTheme);
                    }}
                    disabled={isUpdatingPreferences}
                    aria-pressed={isColorful}
                    aria-label={`Theme: ${label}`}
                    className="w-full flex items-center gap-[10px] px-[10px] py-[5px] rounded-[10px]"
                >
                    <Swatches className="w-[35px] h-[35px] shrink-0" />
                    <span className="flex-1 text-left text-grayscale-900 font-poppins text-[17px]">
                        {label}
                    </span>
                    <span
                        className={`relative shrink-0 w-[27px] h-[15px] rounded-full transition-colors ${
                            isColorful ? onColor : 'bg-grayscale-800'
                        }`}
                    >
                        <span
                            className={`absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] bg-white rounded-full transition-all ${
                                isColorful ? 'right-[2.5px]' : 'left-[2.5px]'
                            }`}
                        />
                    </span>
                </button>
            </div>
        );
    }

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
                    <h4 className="w-full text-grayscale-900 text-[17px]">{m['theme.title']()}</h4>
                    <p className="w-full text-grayscale-600 text-xs">
                        {allowedThemeIds.includes('colorful') && allowedThemeIds.includes('formal')
                            ? m['theme.subtitleColorfulFormal']()
                            : m['theme.subtitleGeneric']()}
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
                                    <span className="ml-1">
                                        {{
                                            colorful: m['theme.names.colorful'],
                                            formal: m['theme.names.formal'],
                                            vetpass: m['theme.names.vetpass'],
                                        }[btn.theme as 'colorful' | 'formal' | 'vetpass']?.() ??
                                            btn.label}
                                    </span>
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
