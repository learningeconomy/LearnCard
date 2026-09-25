import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { networkStore, getSSSConfig } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const CancelRecoveryPage: React.FC = () => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search);
    const holdId = params.holdId as string;
    const token = params.token as string;

    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'neutral' | 'error' | 'invalid'
    >('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            holdId || ''
        );
        const isValidToken = /^[0-9a-f]{64}$/i.test(token || '');

        if (!isValidUuid || !isValidToken) {
            setStatus('invalid');
        }
    }, [holdId, token]);

    const handleCancel = async () => {
        setStatus('loading');
        setErrorMessage('');

        try {
            const { serverUrl } = getSSSConfig();
            const tenantId = networkStore.get.tenantId();

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (tenantId) {
                headers['X-Tenant-Id'] = tenantId;
            }

            const response = await fetch(`${serverUrl}/keys/escrow/cancel-link`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ holdId, token }),
            });

            if (!response.ok) {
                setStatus('error');
                setErrorMessage(
                    response.status === 429
                        ? m['recovery.cancel.error.tooMany']()
                        : m['recovery.cancel.error.generic']()
                );
                return;
            }

            const data: unknown = await response.json();
            const cancelled =
                typeof data === 'object' &&
                data !== null &&
                (data as { cancelled?: unknown }).cancelled === true;
            setStatus(cancelled ? 'success' : 'neutral');
        } catch (error) {
            setStatus('error');
            setErrorMessage(
                error instanceof TypeError
                    ? m['recovery.cancel.error.network']()
                    : m['recovery.cancel.error.generic']()
            );
        }
    };

    const spinner = (text: string) => (
        <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {text}
        </span>
    );

    const buttonClass =
        'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <div
            className="min-h-screen bg-grayscale-100 flex items-center justify-center p-4 font-poppins"
            style={{ paddingTop: 'var(--ion-safe-area-top, 0px)' }}
        >
            <div className="w-full max-w-md bg-white rounded-[20px] shadow-sm p-8 space-y-5 animate-fade-in-up">
                {status === 'error' && errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{errorMessage}</span>
                    </div>
                )}

                {status === 'invalid' ? (
                    <div className="space-y-5 text-center">
                        <div>
                            <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                {m['recovery.cancel.invalidLink.title']()}
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.cancel.invalidLink.body']()}
                            </p>
                        </div>
                        <button className={buttonClass} onClick={() => history.push('/login')}>
                            {m['recovery.cancel.invalidLink.signIn']()}
                        </button>
                    </div>
                ) : status === 'success' ? (
                    <div className="space-y-5 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <IonIcon icon={checkmarkCircleOutline} className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                {m['recovery.cancel.success.title']()}
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.cancel.success.body']()}
                            </p>
                        </div>
                        <button className={buttonClass} onClick={() => history.push('/')}>
                            {m['recovery.cancel.success.doneBtn']()}
                        </button>
                    </div>
                ) : status === 'neutral' ? (
                    <div className="space-y-5 text-center">
                        <div>
                            <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                {m['recovery.cancel.expired.title']()}
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.cancel.expired.body']()}
                            </p>
                        </div>
                        <button className={buttonClass} onClick={() => history.push('/login')}>
                            {m['recovery.cancel.expired.signInBtn']()}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 text-center">
                        <div>
                            <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                {m['recovery.cancel.confirm.title']()}
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['recovery.cancel.confirm.body']()}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                className={buttonClass}
                                onClick={handleCancel}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading'
                                    ? spinner(m['recovery.cancel.confirm.cancelling']())
                                    : status === 'error'
                                      ? m['recovery.cancel.error.tryAgainBtn']()
                                      : m['recovery.cancel.confirm.cancelBtn']()}
                            </button>
                            <button
                                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                onClick={() => history.push('/')}
                                disabled={status === 'loading'}
                            >
                                {m['recovery.cancel.confirm.notNowBtn']()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CancelRecoveryPage;
