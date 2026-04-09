import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Palette,
    Layout,
    Image,
    Navigation,
    Copy,
    Check,
    Tag,
} from 'lucide-react';

import { useTenantConfig } from 'learn-card-base/config/TenantConfigProvider';

import { themeStore } from '../../theme/store/themeStore';
import { getAllowedThemes, isThemeSwitchingEnabled } from '../../theme/store/themeStore';
import { getRegisteredThemeIds } from '../../theme/helpers/loadTheme';
import { loadThemeSchema } from '../../theme/helpers/loadTheme';

import { KVRow, Section, useCopyToClipboard, EventTimeline } from './debugComponents';
import type { TimelineEvent } from './debugComponents';

import {
    type ConfigDebugEvent,
    subscribeToConfigDebugEvents,
    getConfigDebugEvents,
    clearConfigDebugEvents,
} from './configDebugEvents';

// ---------------------------------------------------------------------------
// Color swatch component
// ---------------------------------------------------------------------------

const ColorSwatch: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <div className="flex items-center gap-1.5 text-[10px] py-[2px]">
        <div
            className="w-3 h-3 rounded-sm border border-gray-600 shrink-0"
            style={{ backgroundColor: color }}
            title={color}
        />
        <span className="text-gray-500 shrink-0">{label}</span>
        <span className="text-cyan-400/70 font-mono text-[9px] ml-auto">{color}</span>
    </div>
);

// ---------------------------------------------------------------------------
// Theme Debug Tab
// ---------------------------------------------------------------------------

const isThemeEvent = (e: ConfigDebugEvent): boolean =>
    e.type.startsWith('theme:');

export const ThemeDebugTab: React.FC = () => {
    const config = useTenantConfig();
    const activeThemeId = themeStore.use.theme();
    const theme = loadThemeSchema(activeThemeId);
    const [copied, setCopied] = useCopyToClipboard();
    const [showRawJson, setShowRawJson] = useState(false);
    const [events, setEvents] = useState<ConfigDebugEvent[]>(() =>
        getConfigDebugEvents().filter(isThemeEvent)
    );

    useEffect(() => {
        const unsubscribe = subscribeToConfigDebugEvents((event) => {
            if (event.id === 'clear') {
                setEvents([]);
            } else if (isThemeEvent(event)) {
                setEvents(prev => [event, ...prev].slice(0, 200));
            }
        });

        return unsubscribe;
    }, []);

    const handleClearEvents = useCallback(() => {
        clearConfigDebugEvents();
        setEvents([]);
    }, []);

    const handleExportEvents = useCallback(() => {
        const exportData = {
            exportedAt: new Date().toISOString(),
            activeThemeId,
            displayName: theme.displayName,
            events: events.map(e => ({
                time: e.timestamp.toISOString(),
                type: e.type,
                level: e.level,
                message: e.message,
                data: e.data,
            })),
        };

        setCopied('export-theme', JSON.stringify(exportData, null, 2));
    }, [activeThemeId, theme, events, setCopied]);

    const registeredThemes = useMemo(() => getRegisteredThemeIds(), []);
    const allowedThemes = useMemo(() => getAllowedThemes(config), [config]);
    const switchingEnabled = useMemo(() => isThemeSwitchingEnabled(config), [config]);

    // Extract category colors for preview
    const categoryColorEntries = useMemo(() => {
        const entries: Array<{ category: string; colors: Record<string, string> }> = [];

        for (const cat of theme.categories) {
            const catColors = theme.colors[cat.categoryId];

            if (catColors && typeof catColors === 'object') {
                const colorMap: Record<string, string> = {};

                for (const [key, val] of Object.entries(catColors)) {
                    if (typeof val === 'string') {
                        colorMap[key] = val;
                    }
                }

                if (Object.keys(colorMap).length > 0) {
                    entries.push({ category: cat.labels.plural, colors: colorMap });
                }
            }
        }

        return entries;
    }, [theme]);

    // Extract launchPad colors if present
    const launchPadColors = useMemo(() => {
        const lp = theme.colors.launchPad;

        if (!lp || typeof lp !== 'object') return null;

        const colorMap: Record<string, string> = {};

        for (const [key, val] of Object.entries(lp)) {
            if (typeof val === 'string') {
                colorMap[key] = val;
            }
        }

        return Object.keys(colorMap).length > 0 ? colorMap : null;
    }, [theme]);

    // Icon palette entries
    const iconPaletteEntries = useMemo(() => {
        if (!theme.iconPalettes) return [];

        return Object.entries(theme.iconPalettes).map(([key, palette]) => ({
            key,
            palette: palette as Record<string, string>,
        }));
    }, [theme]);

    const handleCopyThemeJson = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
            setCopied('theme-json', theme);
        } catch { /* ignore */ }
    }, [theme, setCopied]);

    return (
        <div className="space-y-2">
            {/* ── Active theme headline ── */}
            <div className="rounded-lg p-3 bg-purple-950/40 ring-1 ring-purple-700">
                <div className="flex items-center gap-2 mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-bold text-purple-400">{theme.displayName}</span>

                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-400">
                        {theme.id}
                    </span>
                </div>

                <KVRow label="Theme ID" value={theme.id} copied={copied} onCopy={setCopied} />
                <KVRow label="Display Name" value={theme.displayName} mono={false} copied={copied} onCopy={setCopied} />
                <KVRow label="Internal Name" value={theme.name} copied={copied} onCopy={setCopied} />
                <KVRow label="Default View Mode" value={theme.defaults.viewMode} copied={copied} onCopy={setCopied} />
                <KVRow label="Theme Switching" value={switchingEnabled} copied={copied} onCopy={setCopied} />
            </div>

            {/* ── Registered & Allowed Themes ── */}
            <Section
                title="Theme Registry"
                icon={<Tag className="w-3 h-3 text-gray-500" />}
                badge={
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-gray-700 text-gray-400">
                        {registeredThemes.length} registered
                    </span>
                }
            >
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1">Registered Themes</p>

                {registeredThemes.map((id) => {
                    const isActive = id === activeThemeId;
                    const isAllowed = allowedThemes.includes(id);
                    const t = loadThemeSchema(id);

                    return (
                        <div key={id} className="flex items-center justify-between text-[10px] py-[3px] border-t border-gray-700/40">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-purple-400' : 'bg-gray-600'}`} />
                                <span className={isActive ? 'text-purple-400 font-semibold' : 'text-gray-400'}>{t.displayName}</span>
                                <span className="text-gray-600 font-mono text-[8px]">({id})</span>
                            </div>

                            <div className="flex items-center gap-1">
                                {isActive && (
                                    <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">active</span>
                                )}

                                {!isAllowed && (
                                    <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">not allowed</span>
                                )}
                            </div>
                        </div>
                    );
                })}

                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-1">Tenant Allowed</p>

                <div className="text-[10px] text-gray-400">
                    {allowedThemes.join(', ') || '(none specified — all allowed)'}
                </div>
            </Section>

            {/* ── Categories ── */}
            <Section
                title="Categories"
                icon={<Layout className="w-3 h-3 text-gray-500" />}
                badge={
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-gray-700 text-gray-400">
                        {theme.categories.length}
                    </span>
                }
            >
                {theme.categories.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-[10px] py-[3px] border-t border-gray-700/40">
                        <span className="text-gray-400">{cat.labels.plural}</span>
                        <span className="text-gray-600 font-mono text-[9px]">{cat.categoryId}</span>
                    </div>
                ))}
            </Section>

            {/* ── Color Palette ── */}
            <Section
                title="Color Palette"
                icon={<Palette className="w-3 h-3 text-gray-500" />}
            >
                {launchPadColors && (
                    <>
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1">Launch Pad</p>

                        {Object.entries(launchPadColors).map(([key, color]) => (
                            <ColorSwatch key={key} label={key} color={color} />
                        ))}
                    </>
                )}

                {categoryColorEntries.map(({ category, colors }) => (
                    <React.Fragment key={category}>
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-1">{category}</p>

                        {Object.entries(colors).slice(0, 4).map(([key, color]) => (
                            <ColorSwatch key={key} label={key} color={color} />
                        ))}

                        {Object.keys(colors).length > 4 && (
                            <span className="text-[8px] text-gray-600">+{Object.keys(colors).length - 4} more</span>
                        )}
                    </React.Fragment>
                ))}
            </Section>

            {/* ── Icon Palettes ── */}
            {iconPaletteEntries.length > 0 && (
                <Section
                    title="Icon Palettes"
                    icon={<Image className="w-3 h-3 text-gray-500" />}
                    badge={
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-gray-700 text-gray-400">
                            {iconPaletteEntries.length}
                        </span>
                    }
                >
                    {iconPaletteEntries.map(({ key, palette }) => (
                        <React.Fragment key={key}>
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1">{key}</p>

                            {Object.entries(palette).map(([pKey, pVal]) => (
                                <ColorSwatch key={pKey} label={pKey} color={pVal} />
                            ))}
                        </React.Fragment>
                    ))}
                </Section>
            )}

            {/* ── Navigation ── */}
            <Section
                title="Navigation"
                icon={<Navigation className="w-3 h-3 text-gray-500" />}
            >
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1">Navbar ({theme.navbar.length})</p>

                {theme.navbar.map((link) => (
                    <div key={link.id} className="flex items-center justify-between text-[10px] py-[3px] border-t border-gray-700/40">
                        <span className="text-gray-400">{link.label}</span>
                        <span className="text-gray-600 font-mono text-[9px]">{link.path}</span>
                    </div>
                ))}

                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-1">Side Menu ({theme.sideMenuRootLinks.length + theme.sideMenuSecondaryLinks.length})</p>

                {theme.sideMenuRootLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between text-[10px] py-[3px] border-t border-gray-700/40">
                        <span className="text-gray-400">{link.label}</span>
                        <span className="text-gray-600 font-mono text-[9px]">{link.path}</span>
                    </div>
                ))}

                {theme.sideMenuSecondaryLinks.length > 0 && (
                    <>
                        <p className="text-[8px] text-gray-600 mt-1.5 mb-0.5">Secondary</p>

                        {theme.sideMenuSecondaryLinks.map((link) => (
                            <div key={link.id} className="flex items-center justify-between text-[10px] py-[3px] border-t border-gray-700/40">
                                <span className="text-gray-400">{link.label}</span>
                                <span className="text-gray-600 font-mono text-[9px]">{link.path}</span>
                            </div>
                        ))}
                    </>
                )}
            </Section>

            {/* ── Styles Overrides ── */}
            {theme.styles && Object.keys(theme.styles).length > 0 && (
                <Section
                    title="Style Overrides"
                    icon={<Layout className="w-3 h-3 text-gray-500" />}
                >
                    {Object.entries(theme.styles).map(([key, val]) => (
                        <KVRow key={key} label={key} value={typeof val === 'object' ? JSON.stringify(val) : String(val)} mono={false} copied={copied} onCopy={setCopied} />
                    ))}
                </Section>
            )}

            {/* ── Event Timeline ── */}
            <EventTimeline
                events={events as TimelineEvent[]}
                copied={copied}
                onCopy={setCopied}
                onClear={handleClearEvents}
                onExport={handleExportEvents}
                exportCopied={copied === 'export-theme'}
                title="Theme Events"
                emptyMessage="Theme loading and enforcement events appear at boot"
            />

            {/* ── Raw JSON ── */}
            <div className="bg-gray-800/80 rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
                >
                    <span className="text-[11px] font-semibold text-gray-200">Raw Theme JSON</span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyThemeJson(); }}
                            className="p-1 rounded hover:bg-gray-600 transition-colors"
                            title="Copy full theme JSON"
                        >
                            {copied === 'theme-json'
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-3 h-3 text-gray-500" />}
                        </button>
                    </div>
                </button>

                {showRawJson && (
                    <div className="px-3 pb-2">
                        <pre className="text-[8px] text-gray-500 bg-gray-950 rounded p-2 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(theme, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
