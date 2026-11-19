import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { isEscrowRecoveryConfigured, useAppAuth } from '../../providers/AuthCoordinatorProvider';
import * as m from '../../paraglide/messages.js';

/** Token-free email entry point; the provider gates and reauthenticates the action. */
const SecureAccountPage: React.FC = () => {
    const history = useHistory();
    const { openSecureAccount, isReady, canUseAutomaticRecovery, state } = useAppAuth();
    const opened = useRef(false);

    useEffect(() => {
        if (!isReady || opened.current) return;
        // Wait for the coordinator's server availability check before opening the flow.
        if (
            isEscrowRecoveryConfigured() &&
            state.status === 'ready' &&
            state.escrowEnrollment === undefined
        )
            return;
        opened.current = true;
        if (canUseAutomaticRecovery) openSecureAccount();
        history.replace('/');
    }, [isReady, canUseAutomaticRecovery, state, openSecureAccount, history]);

    return (
        <div
            role="status"
            className="font-poppins flex flex-col items-center justify-center min-h-full p-8"
        >
            <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <p className="text-sm text-grayscale-500">{m['recovery.verifyingSession']()}</p>
        </div>
    );
};

export default SecureAccountPage;
