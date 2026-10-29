import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useSyncExternalStore,
} from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { ModalTypes, useModal } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import './spreadsheet-dialog.scss';

export const SPREADSHEET_MODAL_OPTIONS = { className: 'issue-spreadsheet-dialog' };
export const SPREADSHEET_MODAL_TYPES = {
    desktop: ModalTypes.Center,
    mobile: ModalTypes.FullScreen,
};

export const SpreadsheetDialog: React.FC<{
    title: string;
    subtitle?: string;
    icon: string;
    iconTone?: 'positive' | 'neutral';
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}> = ({ title, subtitle, icon, iconTone = 'positive', onClose, children, footer }) => (
    <div className="flex h-full min-h-0 w-full flex-col bg-white font-poppins text-grayscale-900">
        <header className="flex shrink-0 items-start gap-3 border-b border-grayscale-200 px-5 py-5 sm:px-7">
            <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone === 'neutral' ? 'bg-grayscale-100 text-grayscale-700' : 'bg-emerald-50 text-emerald-700'}`}
            >
                <IonIcon icon={icon} className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold">{title}</h2>
                {subtitle && (
                    <p className="mt-1 break-words text-sm text-grayscale-600">{subtitle}</p>
                )}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label={m['common.close']()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-600 hover:bg-grayscale-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <IonIcon icon={closeOutline} className="h-5 w-5" aria-hidden="true" />
            </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
            {children}
        </div>
        {footer && (
            <footer className="shrink-0 border-t border-grayscale-200 bg-white px-5 py-4 sm:px-7">
                {footer}
            </footer>
        )}
    </div>
);

interface LiveContentStore {
    node: React.ReactNode;
    listeners: Set<() => void>;
    subscribe: (listener: () => void) => () => void;
    snapshot: () => React.ReactNode;
}
const LiveContent: React.FC<{ store: LiveContentStore }> = ({ store }) =>
    useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);

/** App modals snapshot their JSX at opening; keep edits, validation and callbacks live. */
export const useSpreadsheetDialog = (
    render: (close: () => void) => React.ReactNode,
    presentation: 'workspace' | 'compact' = 'workspace'
): (() => void) => {
    const { newModalWithToken, forceCloseModalByToken } = useModal();
    const token = useRef<ReturnType<typeof newModalWithToken>>();
    const close = useCallback(() => {
        if (token.current) forceCloseModalByToken(token.current);
        token.current = undefined;
    }, [forceCloseModalByToken]);
    const [store] = React.useState<LiveContentStore>(() => {
        const value: LiveContentStore = {
            node: null,
            listeners: new Set(),
            subscribe: listener => {
                value.listeners.add(listener);
                return () => {
                    value.listeners.delete(listener);
                };
            },
            snapshot: () => value.node,
        };
        return value;
    });
    const node = render(close);
    useLayoutEffect(() => {
        store.node = node;
        store.listeners.forEach(listener => listener());
    }, [node, store]);
    useEffect(() => close, [close]);
    return useCallback(() => {
        // A completion dialog can return to an already-open delivery viewer.
        // Replace this hook's previous instance instead of stacking duplicates.
        close();
        token.current = newModalWithToken(
            <LiveContent store={store} />,
            presentation === 'compact'
                ? { className: 'issue-spreadsheet-completion' }
                : SPREADSHEET_MODAL_OPTIONS,
            presentation === 'compact'
                ? { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                : SPREADSHEET_MODAL_TYPES
        );
    }, [close, newModalWithToken, presentation, store]);
};
