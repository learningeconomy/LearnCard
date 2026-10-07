import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet, useModal, ModalTypes, type ModalInstanceToken } from 'learn-card-base';
import { enterSharePrivacy } from '../../../components/share-links/sharePrivacy';
import {
    captureHistoryAccount,
    captureHistoryContext,
    getHistoryAccountRevision,
    isHistoryAccountEligible,
    useHistoryAccountRevision,
} from '../../../helpers/verifier-history/account';
import {
    clearVerifierHistory,
    deleteVerifierReceipt,
    loadVerifierHistory,
    setVerifierHistoryEnabled,
    type HistoryContext,
} from '../../../helpers/verifier-history/history';
import * as m from '../../../paraglide/messages.js';
import { VerifierHistoryList, historyButton as button } from './VerifierHistoryList';
import { VerifierHistoryModal } from './VerifierHistoryModal';
import GlassCard from './GlassCard';
import { useConfirmClearVerifierHistory } from './useConfirmClearVerifierHistory';

type Loaded = Awaited<ReturnType<typeof loadVerifierHistory>>;
type State = { revision: number; context: HistoryContext; data: Loaded };
const VerifierHistorySection: React.FC<{ eligible: boolean; isEligible?: () => boolean }> = ({
    eligible,
    isEligible,
}) => {
    const { initWallet } = useWallet();
    const { newModalWithToken, forceCloseModalByToken } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.FullScreen,
    });
    const modal = useRef<{ token: ModalInstanceToken; revision: number } | null>(null);
    const attemptedLoad = useRef<number | null>(null);
    const inFlight = useRef<{ isSelectedAccount: () => boolean } | null>(null);
    const revision = useHistoryAccountRevision();
    const allowed = isHistoryAccountEligible(eligible && (isEligible?.() ?? true));
    const [state, setState] = useState<State | null>(null);
    const [busy, setBusy] = useState<number | null>(null);
    const [error, setError] = useState<{ revision: number; message: string } | null>(null);
    // Hide previous-account state synchronously; an effect would expose it for one render.
    const visible =
        allowed && state?.revision === revision && state.context.isCurrent() ? state : null;
    const loading = busy === revision;
    const confirmClear = useConfirmClearVerifierHistory(allowed);
    useEffect(() => {
        if (modal.current && (!allowed || modal.current.revision !== revision)) {
            forceCloseModalByToken(modal.current.token);
            modal.current = null;
        }
    }, [allowed, revision, forceCloseModalByToken]);
    useEffect(
        () => () => {
            if (modal.current) forceCloseModalByToken(modal.current.token);
        },
        [forceCloseModalByToken]
    );
    const openAll = () => {
        if (!visible || loading || modal.current) return;
        enterSharePrivacy();
        const instance: { token?: ModalInstanceToken } = {};
        const close = () => {
            if (instance.token) forceCloseModalByToken(instance.token);
            if (modal.current?.token === instance.token) modal.current = null;
        };
        instance.token = newModalWithToken(
            <VerifierHistoryModal
                context={visible.context}
                initialData={visible.data}
                onClose={close}
                onUpdate={data => {
                    if (
                        visible.context.isCurrent() &&
                        visible.context.eligible &&
                        visible.revision === getHistoryAccountRevision()
                    ) {
                        setState({ ...visible, data });
                        setError(null);
                    }
                }}
            />,
            {
                sectionClassName: 'verifier-history-modal',
                onClose: () => {
                    if (modal.current?.token === instance.token) modal.current = null;
                },
            }
        );
        modal.current = { token: instance.token, revision };
    };
    useEffect(() => {
        setState(previous => (previous?.revision === revision ? previous : null));
        setError(previous => (previous?.revision === revision ? previous : null));
        setBusy(previous => (previous === revision ? previous : null));
    }, [revision]);
    const run = useCallback(
        async (action?: (context: HistoryContext) => Promise<unknown>) => {
            if (inFlight.current?.isSelectedAccount() || !allowed) return;
            // Synchronous and sticky: recorders stop before any history decryption or render.
            enterSharePrivacy();
            const isSelectedAccount = captureHistoryAccount();
            const operation = { isSelectedAccount };
            inFlight.current = operation;
            setBusy(revision);
            setError(null);
            let context = visible?.context;
            try {
                if (!context) {
                    const wallet = await initWallet();
                    if (!isSelectedAccount()) return;
                    context = captureHistoryContext(wallet, isEligible ?? eligible);
                }
                if (!context.isCurrent()) return;
                const currentRevision = getHistoryAccountRevision();
                setBusy(currentRevision);
                const result = action ? await action(context) : undefined;
                const data = await loadVerifierHistory(context);
                if (result === false) data.cleanupComplete = false;
                if (context.isCurrent()) setState({ revision: currentRevision, context, data });
            } catch {
                if (isSelectedAccount() && (!context || context.isCurrent()))
                    setError({
                        revision: getHistoryAccountRevision(),
                        message: m['verifierHistory.loadFailed'](),
                    });
            } finally {
                if (inFlight.current === operation) {
                    inFlight.current = null;
                    setBusy(null);
                }
            }
        },
        [allowed, revision, visible, initWallet, isEligible, eligible]
    );
    useEffect(() => {
        // Load once per account revision; failures require an explicit retry.
        // Privacy exclusions activate in run() before any decryption starts.
        if (
            !allowed ||
            visible ||
            attemptedLoad.current === revision ||
            inFlight.current?.isSelectedAccount()
        )
            return;
        attemptedLoad.current = revision;
        void run();
    }, [allowed, revision, visible, busy, run]);
    const requestClear = () =>
        confirmClear(
            () => void run(context => clearVerifierHistory(context)),
            !visible || !!error || !visible.data.cleanupComplete
        );
    return (
        <section
            aria-labelledby="verifier-history-title"
            className="font-poppins sentry-block ph-no-capture"
            data-html2canvas-ignore
            data-feedback-exclude
        >
            <div className="px-1 mb-2">
                <h2
                    id="verifier-history-title"
                    className="text-[15px] font-semibold text-grayscale-900"
                >
                    {m['verifierHistory.title']()}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['verifierHistory.description']()}
                </p>
            </div>
            <GlassCard className="p-6 space-y-4">
                {!allowed ? (
                    <p className="text-sm text-grayscale-600">
                        {m['verifierHistory.managedUnavailable']()}
                    </p>
                ) : (
                    <>
                        {!visible && !loading && error?.revision === revision && (
                            <button
                                type="button"
                                className={button}
                                onClick={() => void run()}
                                disabled={loading}
                            >
                                {m['verifierHistory.retry']()}
                            </button>
                        )}
                        {!visible && !error && (
                            <p
                                role="status"
                                aria-live="polite"
                                className="text-sm text-grayscale-600"
                            >
                                {m['verifierHistory.loading']()}
                            </p>
                        )}
                        {error?.revision === revision && (
                            <>
                                <p role="alert" className="text-sm text-red-700">
                                    {error.message}
                                </p>
                                {!visible && (
                                    <button
                                        type="button"
                                        className={button}
                                        disabled={loading}
                                        onClick={requestClear}
                                    >
                                        {m['verifierHistory.clear']()}
                                    </button>
                                )}
                            </>
                        )}
                        {visible && (
                            <>
                                <label className="flex items-center gap-3 text-sm font-medium text-grayscale-700">
                                    <input
                                        type="checkbox"
                                        checked={visible.data.enabled}
                                        disabled={loading}
                                        onChange={event =>
                                            void run(context =>
                                                setVerifierHistoryEnabled(
                                                    context,
                                                    event.target.checked
                                                )
                                            )
                                        }
                                    />
                                    {m['verifierHistory.record']()}
                                </label>
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {m['verifierHistory.retention']()}
                                </p>
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {m['verifierHistory.limits']()}
                                </p>
                                {!visible.data.cleanupComplete && (
                                    <p role="status" className="text-sm text-amber-700">
                                        {m['verifierHistory.cleanupPending']()}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className={button}
                                        disabled={loading}
                                        onClick={() => void run()}
                                    >
                                        {m['verifierHistory.refresh']()}
                                    </button>
                                    <button
                                        type="button"
                                        className={button}
                                        disabled={
                                            loading ||
                                            (!visible.data.receipts.length &&
                                                visible.data.cleanupComplete &&
                                                error?.revision !== revision)
                                        }
                                        onClick={requestClear}
                                    >
                                        {m['verifierHistory.clear']()}
                                    </button>
                                </div>
                                {loading && (
                                    <p
                                        role="status"
                                        aria-live="polite"
                                        className="text-sm text-grayscale-600"
                                    >
                                        {m['verifierHistory.loading']()}
                                    </p>
                                )}
                                {!visible.data.receipts.length && (
                                    <p className="text-sm text-grayscale-600">
                                        {m['verifierHistory.empty']()}
                                    </p>
                                )}
                                <VerifierHistoryList
                                    receipts={visible.data.receipts.slice(0, 5)}
                                    loading={loading}
                                    onDelete={id =>
                                        void run(async context => {
                                            if (!(await deleteVerifierReceipt(context, id)))
                                                throw new Error('Deletion incomplete');
                                        })
                                    }
                                />
                                {visible.data.receipts.length > 5 && (
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs text-grayscale-600">
                                            {m['verifierHistory.preview']({
                                                shown: '5',
                                                total: String(visible.data.receipts.length),
                                            })}
                                        </p>
                                        <button
                                            type="button"
                                            className={button}
                                            disabled={loading}
                                            onClick={openAll}
                                        >
                                            {m['verifierHistory.viewAll']({
                                                count: String(visible.data.receipts.length),
                                            })}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </GlassCard>
        </section>
    );
};
export default VerifierHistorySection;
