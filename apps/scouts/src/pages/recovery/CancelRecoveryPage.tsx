import React, { useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getSSSConfig, networkStore } from 'learn-card-base';
import { isEscrowRecoveryConfigured } from '../../providers/AuthCoordinatorProvider';
import * as m from '../../paraglide/messages.js';

/** Email cancellation requires an explicit action; merely opening the link changes nothing. */
const CancelRecoveryPage: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const holdId = params.get('holdId');
    const token = params.get('token');
    const valid =
        isEscrowRecoveryConfigured() &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(holdId ?? '') &&
        /^[0-9a-f]{64}$/i.test(token ?? '');
    const busy = useRef(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'neutral' | 'error'>(
        'idle'
    );

    const cancel = async (): Promise<void> => {
        if (!valid || busy.current) return;
        busy.current = true;
        setStatus('loading');
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const tenantId = networkStore.get.tenantId();
            if (tenantId) headers['X-Tenant-Id'] = tenantId;
            const response = await fetch(`${getSSSConfig().serverUrl}/keys/escrow/cancel-link`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ holdId, token }),
            });
            if (!response.ok) throw new Error('Cancellation failed');
            const data: unknown = await response.json();
            setStatus(
                typeof data === 'object' &&
                    data !== null &&
                    'cancelled' in data &&
                    data.cancelled === true
                    ? 'success'
                    : 'neutral'
            );
        } catch {
            setStatus('error');
        } finally {
            busy.current = false;
        }
    };

    return (
        <div className="min-h-screen bg-grayscale-100 flex items-center justify-center p-6 font-poppins">
            <div className="w-full max-w-md bg-white rounded-[20px] p-8 space-y-v3-5">
                <h1 className="text-xl font-semibold text-grayscale-900">
                    {m['recovery.request.cancel']()}
                </h1>
                {(!valid || status === 'neutral') && (
                    <p role="status" className="text-sm text-grayscale-600">
                        {m['recovery.invalidRequest']()}
                    </p>
                )}
                {status === 'success' && (
                    <p role="status" className="text-sm text-emerald-700">
                        {m['recovery.request.cancelled']()}
                    </p>
                )}
                {status === 'error' && (
                    <p
                        role="alert"
                        className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700"
                    >
                        {m['recovery.somethingWrong']()}
                    </p>
                )}
                {valid && status !== 'success' && status !== 'neutral' && (
                    <button
                        onClick={cancel}
                        disabled={status === 'loading'}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {m['recovery.escrowHold.stopping']()}
                            </span>
                        ) : (
                            m['recovery.request.cancel']()
                        )}
                    </button>
                )}
                <button
                    disabled={status === 'loading'}
                    onClick={() => history.push('/')}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
                >
                    {m['common.done']()}
                </button>
            </div>
        </div>
    );
};

export default CancelRecoveryPage;
