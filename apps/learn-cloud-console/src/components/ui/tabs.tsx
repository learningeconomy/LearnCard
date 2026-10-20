import {
    createContext,
    useContext,
    useId,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
    value: string;
    setValue: (value: string) => void;
    id: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = (): TabsContextValue => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
    return ctx;
};

export function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    className,
    children,
}: {
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children: ReactNode;
}) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const id = useId();
    const value = controlledValue ?? uncontrolledValue;
    const setValue = (nextValue: string): void => {
        if (controlledValue === undefined) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);
    };

    return (
        <TabsContext.Provider value={{ value, setValue, id }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
                className
            )}
        >
            {children}
        </div>
    );
}

export function TabsTrigger({
    value,
    className,
    children,
}: {
    value: string;
    className?: string;
    children: ReactNode;
}) {
    const { value: active, setValue, id } = useTabs();
    const tabId = `${id}-tab-${value}`;
    const panelId = `${id}-panel-${value}`;
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const tabs = Array.from(
            event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]'
            ) ?? []
        );
        const currentIndex = tabs.indexOf(event.currentTarget);
        const nextIndex =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
                    tabs.length;
        tabs[nextIndex]?.focus();
        tabs[nextIndex]?.click();
    };

    return (
        <button
            type="button"
            role="tab"
            id={tabId}
            aria-selected={active === value}
            aria-controls={panelId}
            onClick={() => setValue(value)}
            onKeyDown={handleKeyDown}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                active === value && 'bg-background text-foreground shadow-sm',
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({
    value,
    className,
    children,
}: {
    value: string;
    className?: string;
    children: ReactNode;
}) {
    const { value: active, id } = useTabs();
    if (active !== value) return null;

    return (
        <div
            role="tabpanel"
            id={`${id}-panel-${value}`}
            aria-labelledby={`${id}-tab-${value}`}
            className={cn(
                'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className
            )}
        >
            {children}
        </div>
    );
}
