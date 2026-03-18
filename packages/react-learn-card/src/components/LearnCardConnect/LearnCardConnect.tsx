import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { LearnCardConnectProps, ContextData, ContextResponse, LearnCardError } from './types';
import styles from './LearnCardConnect.module.css';

const DEFAULT_HOST_ORIGIN = 'https://learncard.app';
const DEFAULT_REQUEST_TIMEOUT = 30000;
const PROTOCOL = 'LEARNCARD_V1';

function generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const LearnCardConnect: React.FC<LearnCardConnectProps> = ({
    apiKey,
    onContextReady,
    onError,
    buttonText = 'Personalize with LearnCard',
    theme = {},
    mode = 'modal',
    includeRawCredentials = false,
    className = '',
    style = {},
    hostOrigin = DEFAULT_HOST_ORIGIN,
    requestTimeout = DEFAULT_REQUEST_TIMEOUT,
    instructions,
    detailLevel = 'compact',
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const popupRef = useRef<Window | null>(null);
    const pendingRequestRef = useRef<{
        resolve: (value: ContextData) => void;
        reject: (error: LearnCardError) => void;
        timeoutId: ReturnType<typeof setTimeout>;
    } | null>(null);

    const cleanup = useCallback(() => {
        setIsOpen(false);
        setIsLoading(false);

        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
        }
        popupRef.current = null;

        if (pendingRequestRef.current) {
            clearTimeout(pendingRequestRef.current.timeoutId);
            pendingRequestRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            if (event.origin !== hostOrigin) {
                return;
            }

            const data = event.data as ContextResponse;

            if (data.protocol !== PROTOCOL || !data.requestId) {
                return;
            }

            if (!pendingRequestRef.current) {
                return;
            }

            clearTimeout(pendingRequestRef.current.timeoutId);
            const { resolve, reject } = pendingRequestRef.current;
            pendingRequestRef.current = null;

            if (data.type === 'SUCCESS' && data.data) {
                resolve(data.data);
                onContextReady(data.data);
                cleanup();
            } else if (data.type === 'ERROR') {
                const error = data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' };
                reject(error);
                onError?.(error);
                cleanup();
            }
        },
        [hostOrigin, onContextReady, onError, cleanup]
    );

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const openConnection = useCallback(() => {
        const requestId = generateRequestId();
        const params = new URLSearchParams({
            apiKey,
            requestId,
            mode,
            includeRawCredentials: includeRawCredentials.toString(),
            detailLevel,
        });
        if (instructions) {
            params.set('instructions', instructions);
        }

        const url = `${hostOrigin}/embed/context?${params.toString()}`;

        if (mode === 'popup') {
            const width = 480;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            popupRef.current = window.open(
                url,
                'LearnCardConnect',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
            );
        }

        setIsOpen(true);

        return new Promise<ContextData>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                pendingRequestRef.current = null;
                cleanup();
                const error: LearnCardError = {
                    code: 'REQUEST_TIMEOUT',
                    message: `Request timed out after ${requestTimeout}ms`,
                };
                reject(error);
                onError?.(error);
            }, requestTimeout);

            pendingRequestRef.current = { resolve, reject, timeoutId };
        });
    }, [
        apiKey,
        mode,
        includeRawCredentials,
        detailLevel,
        instructions,
        hostOrigin,
        requestTimeout,
        onError,
        cleanup,
    ]);

    const handleClick = useCallback(async () => {
        if (isLoading || isOpen) {
            return;
        }

        setIsLoading(true);

        try {
            await openConnection();
        } catch {
            setIsLoading(false);
        }
    }, [isLoading, isOpen, openConnection]);

    const handleClose = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                handleClose();
            }
        },
        [handleClose]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        },
        [handleClose]
    );

    const buildButtonStyle = (): React.CSSProperties => {
        const customStyle = { ...style } as Record<string, string>;

        if (theme.primaryColor) {
            customStyle.backgroundColor = theme.primaryColor;
        }

        if (theme.accentColor) {
            customStyle['--lc-accent-color'] = theme.accentColor;
        }

        if (theme.borderRadius) {
            customStyle.borderRadius = theme.borderRadius;
        }

        return customStyle as React.CSSProperties;
    };

    const requestId = generateRequestId();
    const params = new URLSearchParams({
        apiKey,
        requestId,
        mode,
        includeRawCredentials: includeRawCredentials.toString(),
        detailLevel,
    });
    if (instructions) {
        params.set('instructions', instructions);
    }

    const iframeUrl = `${hostOrigin}/embed/context?${params.toString()}`;

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading || isOpen}
                className={`${styles.button} ${className}`}
                style={buildButtonStyle()}
            >
                {isLoading && <span className={styles.spinner} />}
                {buttonText}
            </button>

            {mode === 'modal' && isOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={handleBackdropClick}
                    onKeyDown={handleKeyDown}
                >
                    <div className={styles.modalContent}>
                        <iframe
                            ref={iframeRef}
                            src={iframeUrl}
                            className={styles.iframe}
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            title="LearnCard Connect"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default LearnCardConnect;
