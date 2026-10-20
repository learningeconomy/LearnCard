import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useT } from '../i18n';
import { useInAppMessageActions } from './useInAppMessageActions';
import { parseIframeMessage } from './iframeBridge';
import type { MessagePresentationProps } from './presentationTypes';

const IframeAttempt: React.FC<MessagePresentationProps & { retry: () => void }> = ({
    message,
    onClose,
    onAction,
    retry,
}) => {
    const t = useT();
    const frame = useRef<HTMLIFrameElement>(null);
    // A scripted same-origin frame could access the parent despite the sandbox.
    const separateOrigin = Boolean(
        message.iframe && new URL(message.iframe.url).origin !== window.location.origin
    );
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
        navigator.onLine && separateOrigin ? 'loading' : 'error'
    );
    const [running, setRunning] = useState(false);
    const busy = useRef(false);
    const { runAction } = useInAppMessageActions();
    const callbacks = useRef({ onClose, onAction, runAction });
    useLayoutEffect(() => {
        callbacks.current = { onClose, onAction, runAction };
    }, [onClose, onAction, runAction]);
    const config = message.iframe;

    useEffect(() => {
        if (!config || !separateOrigin) return;
        let active = true;
        let failed = !navigator.onLine;
        const ready = (): void => {
            if (!failed && active) {
                clearTimeout(timer);
                setStatus('ready');
            }
        };
        const fail = (): void => {
            failed = true;
            clearTimeout(timer);
            if (active) setStatus('error');
        };
        const timer = setTimeout(fail, config.loadTimeoutMs);
        const receive = async (event: MessageEvent): Promise<void> => {
            if (!active || failed) return;
            const data = parseIframeMessage(
                event,
                frame.current?.contentWindow ?? null,
                config.url
            );
            if (!data) return;
            if (data.event === 'ready') {
                ready();
                return;
            }
            if (data.event === 'close') {
                if (message.dismissible) callbacks.current.onClose('dismissed');
                return;
            }
            if (busy.current || (!message.dismissible && data.action.type === 'dismiss')) return;
            busy.current = true;
            setRunning(true);
            try {
                const outcome = await callbacks.current.runAction(data.action);
                if (active && outcome === 'closed') {
                    callbacks.current.onAction?.({ actionType: data.action.type });
                    callbacks.current.onClose(
                        data.action.type === 'dismiss' ? 'dismissed' : 'action'
                    );
                }
            } catch {
                if (active) fail();
            } finally {
                busy.current = false;
                if (active) setRunning(false);
            }
        };
        const node = frame.current;
        // A load event also fires for blocked/failed embeds; required frames need the handshake.
        if (message.dismissible) node?.addEventListener('load', ready);
        window.addEventListener('message', receive);
        window.addEventListener('offline', fail);
        return () => {
            active = false;
            clearTimeout(timer);
            node?.removeEventListener('load', ready);
            window.removeEventListener('message', receive);
            window.removeEventListener('offline', fail);
        };
    }, [config?.url, config?.loadTimeoutMs, message.dismissible, separateOrigin]);

    if (!config) return null;
    return (
        <div className="flex flex-col h-full min-h-0 w-full bg-white font-poppins">
            <header className="flex items-center justify-between gap-3 p-4 text-grayscale-900">
                <h2 className="text-xl font-semibold">{config.title ?? message.title}</h2>
                {message.dismissible && (
                    <button
                        type="button"
                        aria-label={t('common.close')}
                        className="p-2 rounded-[20px]"
                        onClick={() => onClose('dismissed')}
                    >
                        <IonIcon icon={closeOutline} />
                    </button>
                )}
            </header>
            {running && (
                <p role="status" className="p-3 text-sm text-grayscale-600">
                    {t('inAppMessages.opening')}
                </p>
            )}
            <div className="relative flex-1 min-h-0">
                {status === 'loading' && (
                    <div
                        role="status"
                        className="absolute inset-0 flex items-center justify-center bg-grayscale-100 text-grayscale-600 motion-safe:animate-pulse"
                    >
                        {t('inAppMessages.loading')}
                    </div>
                )}
                {status === 'error' && (
                    <div
                        role="alert"
                        className="absolute inset-0 bg-white p-6 flex flex-col items-center justify-center gap-5"
                    >
                        <p className="text-sm text-red-700">{t('inAppMessages.error')}</p>
                        <button
                            type="button"
                            onClick={retry}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white"
                        >
                            {t('inAppMessages.retry')}
                        </button>
                    </div>
                )}
                {separateOrigin && (
                    <iframe
                        ref={frame}
                        src={config.url}
                        title={config.title ?? message.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        referrerPolicy="no-referrer"
                        tabIndex={status === 'ready' ? 0 : -1}
                        aria-hidden={status !== 'ready'}
                        className={`w-full h-full border-0 ${status === 'ready' ? '' : 'invisible'}`}
                    />
                )}
            </div>
        </div>
    );
};

export const InAppMessageIframe: React.FC<MessagePresentationProps> = props => {
    const [attempt, setAttempt] = useState(0);
    return (
        <IframeAttempt
            key={`${props.message.iframe?.url}:${attempt}`}
            {...props}
            retry={() => setAttempt(value => value + 1)}
        />
    );
};
