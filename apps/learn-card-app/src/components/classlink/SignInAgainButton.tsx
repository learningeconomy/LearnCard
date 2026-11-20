import React from 'react';

import * as m from '../../paraglide/messages.js';
import useLogout from '../../hooks/useLogout';

/**
 * "Sign in again" after lca-api refused a sign-in email change for want of a recent sign-in
 * (`recent_sign_in_required`): signs this device out, to the login page, where a ClassLink
 * sign-in (or an emailed code) counts as recent. Its own component, so the app's logout
 * only loads where the refusal is shown.
 */
export const SignInAgainButton: React.FC<{ className: string }> = ({ className }) => {
    const { handleLogout } = useLogout();
    return (
        <button
            type="button"
            data-testid="keep-account-sign-in-again"
            className={className}
            onClick={() => void handleLogout()}
        >
            {m['classlinkKeepAccount.signInAgain']()}
        </button>
    );
};
