import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getIonMode } from './ionMode';
import './app-shell.css';

type TabEntry = { originalHref: string; currentHref: string };

/** Port of IonTabBar's per-tab state: each tab's root href and the last path visited in it. */
type TabMemory = {
    tabs: Record<string, TabEntry>;
    order: string[];
    activeTab?: string;
    /** Last defined active tab; Ionic only re-selected buttons when a tab became active. */
    selectedTab?: string;
};

type RouteLocation = { pathname: string; search: string; action: string };

type AppTabsContextValue = {
    memory: TabMemory;
    /** Registers (or re-registers a changed) tab; returns whether anything changed. */
    register: (tab: string, href: string) => boolean;
    /** Recomputes the active tab after registration. */
    resync: () => void;
    select: (tab: string) => void;
};

const AppTabsContext = createContext<AppTabsContextValue | null>(null);

const findActiveTab = (memory: TabMemory, pathname: string): string | undefined =>
    memory.order.find(tab => pathname.startsWith(memory.tabs[tab].originalHref));

/** IonTabBar `getDerivedStateFromProps`, minus the parts that only fed Ionic's page stack. */
const syncActiveTab = (memory: TabMemory, route: RouteLocation): void => {
    const activeTab = findActiveTab(memory, route.pathname);
    const prevActiveTab = memory.activeTab;

    if (activeTab && prevActiveTab) {
        const prevHref = memory.tabs[prevActiveTab].currentHref;
        if (activeTab !== prevActiveTab || prevHref !== route.pathname) {
            memory.tabs[activeTab].currentHref = route.pathname + route.search;
            // Going back across tabs resets the tab being left to its root.
            if (route.action === 'POP' && activeTab !== prevActiveTab) {
                memory.tabs[prevActiveTab].currentHref = memory.tabs[prevActiveTab].originalHref;
            }
        }
    }

    memory.activeTab = activeTab;
    if (activeTab) memory.selectedTab = activeTab;
};

/** Set on fullscreen `ion-content`s under `AppTabs`; app-shell.css extends them under the tab bar. */
export const FULLSCREEN_CONTENT_CLASS = 'app-tabs-fullscreen-content';

/**
 * Keeps `<IonContent fullscreen>` scrolling under the tab bar, as it did inside `ion-tabs`.
 *
 * ion-content measures its fullscreen offsets against `closest('ion-tabs')` first and only then
 * against the nearest `.ion-page`. Under ion-tabs its bottom offset therefore included the tab
 * bar, so page content scrolled behind the translucent, blurred bar. Under `AppTabs` it measures
 * against the routed page instead, which ends at the top of the bar. This publishes the missing
 * part (tabs height minus outlet height, 0 when the bar is hidden) as `--app-tab-bar-offset`
 * and marks fullscreen contents so the CSS can add it back.
 */
const useFullscreenContentOffset = (
    tabsRef: React.RefObject<HTMLDivElement | null>,
    innerRef: React.RefObject<HTMLDivElement | null>
): void => {
    useLayoutEffect(() => {
        const tabs = tabsRef.current;
        const inner = innerRef.current;
        if (!tabs || !inner) return undefined;

        const updateOffset = (): void => {
            const offset = Math.max(tabs.offsetHeight - inner.offsetHeight, 0);
            tabs.style.setProperty('--app-tab-bar-offset', `${offset}px`);
        };
        const markContents = (): void => {
            inner.querySelectorAll('ion-content').forEach(content => {
                const isFullscreen = (content as HTMLElement & { fullscreen?: boolean }).fullscreen;
                content.classList.toggle(FULLSCREEN_CONTENT_CLASS, isFullscreen === true);
            });
        };

        updateOffset();
        markContents();

        let frame = 0;
        const mutations = new MutationObserver(() => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                markContents();
            });
        });
        mutations.observe(inner, { childList: true, subtree: true });

        const resize =
            typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateOffset);
        resize?.observe(tabs);
        resize?.observe(inner);

        return () => {
            if (frame) cancelAnimationFrame(frame);
            mutations.disconnect();
            resize?.disconnect();
        };
    }, [tabsRef, innerRef]);
};

export type AppTabsProps = {
    className?: string;
    /**
     * The page outlet (`AppOutlet`) and the `AppTabBar`. Like ion-tabs' `slot="bottom"`, an
     * `AppTabBar` child is placed after the outlet's box; everything else goes inside it.
     */
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonTabs` + its router integration: the same page box
 * (`.ion-page` > tabs host > `.tabs-inner`) with the tab bar underneath, and the tab-switching
 * rules Ionic applied (tab memory, reset on re-tap). Tab memory lives here so it survives the
 * bar being hidden, as Ionic kept one IonTabBar instance mounted.
 */
export const AppTabs: React.FC<AppTabsProps> = ({ className, children }) => {
    const location = useLocation();
    const history = useHistory();
    const memoryRef = useRef<TabMemory>({ tabs: {}, order: [] });
    const routeRef = useRef<RouteLocation>({
        pathname: location.pathname,
        search: location.search,
        action: history.action,
    });

    // IonReactRouter ignored history changes whose pathname equals the current URL
    // (pathname + search), so its route info could lag the real location in that one case.
    if (routeRef.current.pathname + routeRef.current.search !== location.pathname) {
        routeRef.current = {
            pathname: location.pathname,
            search: location.search,
            action: history.action,
        };
    }
    syncActiveTab(memoryRef.current, routeRef.current);

    const contextValue: AppTabsContextValue = {
        memory: memoryRef.current,
        register: (tab, href) => {
            const memory = memoryRef.current;
            const entry = memory.tabs[tab];
            if (entry && entry.originalHref === href) return false;
            if (!entry) memory.order.push(tab);
            memory.tabs[tab] = { originalHref: href, currentHref: href };
            return true;
        },
        resync: () => syncActiveTab(memoryRef.current, routeRef.current),
        select: tab => {
            const memory = memoryRef.current;
            const tapped = memory.tabs[tab];
            if (!tapped) return;
            if (memory.activeTab === tab) {
                // Re-tapping the active tab returns to its root.
                if (tapped.originalHref !== routeRef.current.pathname) {
                    history.push(tapped.originalHref);
                }
                return;
            }
            history.push(tapped.currentHref);
        },
    };

    const tabsRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    useFullscreenContentOffset(tabsRef, innerRef);

    const pageClass = className ? `${className} ion-page` : 'ion-page';
    const tabsClass = className ? `app-tabs ${className}` : 'app-tabs';
    const content: React.ReactNode[] = [];
    const bottom: React.ReactNode[] = [];
    React.Children.toArray(children).forEach(child => {
        if (React.isValidElement(child) && child.type === AppTabBar) bottom.push(child);
        else content.push(child);
    });

    return (
        <AppTabsContext.Provider value={contextValue}>
            <div className={pageClass}>
                <div ref={tabsRef} className={tabsClass} data-app-tabs="">
                    <div ref={innerRef} className="app-tabs-inner tabs-inner">
                        {content}
                    </div>
                    {bottom}
                </div>
            </div>
        </AppTabsContext.Provider>
    );
};

type CapacitorKeyboard = { getResizeMode?: () => Promise<{ mode?: string } | undefined> };
type CapacitorGlobal = {
    isPluginAvailable?: (name: string) => boolean;
    Plugins?: { Keyboard?: CapacitorKeyboard };
};

const getKeyboardResizeMode = async (): Promise<string | undefined> => {
    const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
    const keyboard = capacitor?.isPluginAvailable?.('Keyboard')
        ? capacitor.Plugins?.Keyboard
        : undefined;
    if (!keyboard?.getResizeMode) return undefined;
    try {
        return (await keyboard.getResizeMode())?.mode;
    } catch {
        return undefined;
    }
};

/**
 * ion-tab-bar hid itself while the native keyboard was open (`keyboardWillShow` /
 * `keyboardWillHide` window events from @capacitor/keyboard). On hide it waited for the resized
 * container (`ion-app`) to grow back first, so the bar didn't flash above the keyboard.
 */
const useKeyboardVisible = (): boolean => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let disposed = false;
        let resizeMode: string | undefined;
        let initialHeight: number | undefined;
        let observer: ResizeObserver | undefined;

        const container = (): Element | null =>
            resizeMode === undefined || resizeMode === 'none'
                ? null
                : (document.querySelector('ion-app') ?? document.body);
        const height = (): number => container()?.clientHeight ?? 0;

        const onShow = (): void => {
            if (initialHeight === undefined) initialHeight = height();
            observer?.disconnect();
            setVisible(true);
        };
        const onHide = (): void => {
            const target = container();
            if (!target || initialHeight === 0 || initialHeight === height()) {
                setVisible(false);
                return;
            }
            observer?.disconnect();
            observer = new ResizeObserver(() => {
                if (target.clientHeight === initialHeight) {
                    observer?.disconnect();
                    setVisible(false);
                }
            });
            observer.observe(target);
        };

        void getKeyboardResizeMode().then(mode => {
            if (disposed) return;
            resizeMode = mode;
            window.addEventListener('keyboardWillShow', onShow);
            window.addEventListener('keyboardWillHide', onHide);
        });

        return () => {
            disposed = true;
            observer?.disconnect();
            window.removeEventListener('keyboardWillShow', onShow);
            window.removeEventListener('keyboardWillHide', onHide);
        };
    }, []);

    return visible;
};

export type AppTabBarProps = {
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
};

/** App-owned replacement for `IonTabBar` (bottom bar, `role="tablist"`). */
export const AppTabBar: React.FC<AppTabBarProps> = ({ className, style, children }) => {
    const context = useContext(AppTabsContext);
    const [mode] = useState(getIonMode);
    const keyboardVisible = useKeyboardVisible();

    // Register tabs during render, as IonTabBar read its button children.
    let registered = false;
    React.Children.forEach(children, child => {
        if (!React.isValidElement<AppTabButtonProps>(child) || child.type !== AppTabButton) return;
        if (context?.register(child.props.tab, child.props.href)) registered = true;
    });
    if (registered) context?.resync();

    const classes = ['app-tab-bar', mode, keyboardVisible ? 'tab-bar-hidden' : '', className ?? '']
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={classes}
            role="tablist"
            aria-hidden={keyboardVisible ? 'true' : undefined}
            style={style}
            data-app-tab-bar=""
        >
            {children}
        </div>
    );
};

export type AppTabButtonProps = {
    /** Tab id. */
    tab: string;
    /** The tab's root path. */
    href: string;
    className?: string;
    'aria-label'?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonTabButton`: a `role="tab"` link inside the same host/native/inner
 * layering. Clicking a different tab opens the last path visited in it; clicking the active tab
 * returns to its root (see `AppTabs`).
 */
export const AppTabButton: React.FC<AppTabButtonProps> = ({
    tab,
    href,
    className,
    'aria-label': ariaLabel,
    children,
}) => {
    const context = useContext(AppTabsContext);
    const hostRef = useRef<HTMLDivElement>(null);
    const [mode] = useState(getIonMode);
    const [hasLabel, setHasLabel] = useState(false);

    useLayoutEffect(() => {
        const next = !!hostRef.current?.querySelector('ion-label');
        if (next !== hasLabel) setHasLabel(next);
    });

    const memory = context?.memory;
    const selected = memory?.selectedTab === tab;
    // Ionic pointed the active tab's link at the current pathname, others at their memory.
    const linkHref =
        memory?.activeTab === tab ? undefined : (memory?.tabs[tab]?.currentHref ?? href);
    const location = useLocation();

    const select = (event: React.SyntheticEvent): void => {
        event.preventDefault();
        context?.select(tab);
    };

    const classes = [
        'app-tab-button',
        mode,
        selected ? 'tab-selected' : '',
        hasLabel ? 'tab-has-label' : '',
        hasLabel ? 'tab-has-label-only' : '',
        'tab-layout-icon-top',
        'ion-activatable',
        'ion-selectable',
        'ion-focusable',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={hostRef} className={classes} id={`tab-button-${tab}`} data-tab={tab}>
            <a
                className="app-tab-button-native button-native"
                href={linkHref ?? location.pathname}
                role="tab"
                aria-selected={selected ? 'true' : undefined}
                aria-label={ariaLabel}
                onClick={select}
                onKeyUp={event => {
                    // Enter already clicks a link; Ionic also selected on Space.
                    if (event.key === ' ') select(event);
                }}
            >
                <span className="app-tab-button-inner button-inner">{children}</span>
            </a>
        </div>
    );
};

export default AppTabs;
