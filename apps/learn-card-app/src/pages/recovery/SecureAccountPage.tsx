import React, { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import * as m from '../../paraglide/messages.js';

/**
 * `/account/secure`: the link in the "New device signed in with your PIN" email. The
 * link carries no token; the secure flow runs on a signed-in device (PrivateRoute),
 * re-checks the login session itself, and asks before changing anything.
 */
const SecureAccountPage: React.FC = () => {
    const history = useHistory();
    const { openSecureAccount, isReady } = useAppAuth();
    const opened = useRef(false);

    useEffect(() => {
        if (!isReady || opened.current) return;
        opened.current = true;
        openSecureAccount();
        history.replace('/');
    }, [isReady, openSecureAccount, history]);

    return (
        <div role="status" className="flex flex-col items-center justify-center min-h-full p-8">
            <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <p className="text-sm text-grayscale-500">{m['recovery.secureAccount.opening']()}</p>
        </div>
    );
};

export default SecureAccountPage;
