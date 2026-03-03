import React, { useMemo, useCallback, useEffect } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import themeStore from '../store/themeStore';
import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

import { useTheme } from '../hooks/useTheme';
import { ThemeEnum } from '../helpers/theme-helpers';
import { loadThemeSchema } from '../helpers/loadTheme';
import { ThemeButton } from '../validators/theme.validators';
import { ViewMode } from '../types/theme.types';
import {
    useCreatePreferences,
    useGetPreferencesForDid,
    useUpdatePreferences,
} from 'learn-card-base';

const THEMES: ThemeEnum[] = [ThemeEnum.Colorful, ThemeEnum.Formal];

export enum themeSelectorViewMode {
    Mini = 'mini',
    Full = 'full',
}

export const ThemeSelector: React.FC<{ viewMode?: themeSelectorViewMode }> = ({
    viewMode = themeSelectorViewMode.Full,
}) => {
    const flags = useFlags();
    const { theme, syncThemeDefaults } = useTheme();
    const setTheme = themeStore.set.theme;

    const schemas = useMemo(() => THEMES.map(loadThemeSchema), []);

    const { mutateAsync: createPreferences, isPending: isCreatingPreferences } =
        useCreatePreferences();
    const { mutateAsync: updatePreferences, isPending: isUpdatingPreferences } =
        useUpdatePreferences();
    const { data: preferences, refetch: refetchPreferences } = useGetPreferencesForDid(
        flags?.enableThemeToggle
    );

    const themeButtons = useMemo<ThemeButton[]>(() => {
        return schemas.map(schema => ({
            theme: schema.id,
            label: schema.displayName ?? schema.name,
            icon: schema.defaults?.switcherIcon ?? undefined,
        }));
    }, [schemas]);

    const handleThemeChange = useCallback((t: ThemeEnum) => setTheme(t), [setTheme]);

    const handleSetViewMode = (themeSelected: ThemeEnum) => {
        const schema = loadThemeSchema(themeSelected);
        if (schema?.defaults?.viewMode === ViewMode.Grid) {
            passportPageStore.set.setViewMode(PassportPageViewMode.grid);
        } else if (schema?.defaults?.viewMode === ViewMode.List) {
            passportPageStore.set.setViewMode(PassportPageViewMode.list);
        }
    };

    const handleSetTheme = async (themeSelected: ThemeEnum) => {
        if (!preferences?.theme) {
            await createPreferences({
                theme: themeSelected,
            });
        } else {
            await updatePreferences({
                theme: themeSelected,
            });
        }
        handleThemeChange(themeSelected);
        handleSetViewMode(themeSelected);
        syncThemeDefaults(themeSelected);
        refetchPreferences();
    };

    const syncTheme = useCallback(() => {
        const cachedTheme = themeStore.get.theme();
        if (cachedTheme !== preferences?.theme && preferences?.theme !== undefined) {
            handleSetTheme(preferences?.theme as ThemeEnum);
        }
    }, [preferences]);

    // only sync theme if preferences are loaded
    // && the cached theme is different from the theme stored in the DB
    useEffect(() => {
        syncTheme();
    }, [syncTheme]);

    if (flags?.enableThemeToggle === false) return null;

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
                            disabled={isCreatingPreferences}
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
                        Switch between our signature, colorful experience and a classic, formal
                        style.
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
                                    disabled={isCreatingPreferences}
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
