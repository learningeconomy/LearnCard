import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { useClassLinkAccountContinuity, useFeatureConfig } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
import { isKeepAccountEnabled } from './keepAccountFlags';
import { PersonalEmailForm } from './PersonalEmailForm';
import { QUIET_BUTTON_CLASS } from './keepAccountStyles';
import { useClassLinkSession } from './useClassLinkSession';

const DISMISSED_KEY = 'classlink-personal-email-dismissed-at';
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Tenant flags that allow this personal-email card at all. Off once the "keep your
 * account" flow is on: that flow asks for the email (dashboard banner, transcript,
 * School Connect), and a second email prompt here would ask for it twice.
 */
export const isPersonalEmailPromptEnabled = (features: {
    classlinkSso?: boolean;
    classlinkPersonalEmail?: boolean;
    classlinkKeepAccount?: boolean;
}): boolean =>
    features.classlinkSso === true &&
    features.classlinkPersonalEmail === true &&
    !isKeepAccountEnabled(features);

/**
 * Invitation for ClassLink accounts to add a verified personal email.
 *
 * Off unless the tenant enables both `classlinkSso` and `classlinkPersonalEmail` (and not
 * `classlinkKeepAccount`, which replaces it) and the session is a ClassLink sign-in. Who may add one is the server's decision (each district's
 * account continuity policy, which by default excludes students): the card shows only when
 * `getAccountContinuity` allows it and no personal email is verified yet.
 */
export const PersonalEmailPrompt: React.FC = () => {
    const features = useFeatureConfig();
    const flagEnabled = isPersonalEmailPromptEnabled(features);
    const classlinkSession = useClassLinkSession(flagEnabled);

    return flagEnabled && classlinkSession === true ? <PersonalEmailPromptCard /> : null;
};

const PersonalEmailPromptCard: React.FC = () => {
    const continuity = useClassLinkAccountContinuity({ enabled: true });
    const [success, setSuccess] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try {
            const timestamp = Number(localStorage.getItem(DISMISSED_KEY));
            return timestamp > 0 && Date.now() - timestamp < DISMISS_MS;
        } catch {
            return false;
        }
    });

    // Only an affirmative, allowed, unverified ClassLink response shows this invitation.
    // In particular, FORBIDDEN for other sign-in methods stays invisible.
    const data = continuity.data;
    if (dismissed || continuity.isError || !data) return null;
    if (!success && (data.emailVerified || !data.personalEmail.allowed)) return null;

    const dismiss = (): void => {
        try {
            localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        } catch {
            /* Still dismiss for this session when storage is unavailable. */
        }
        setDismissed(true);
    };

    return (
        <section
            data-testid="classlink-email-prompt"
            className="w-full max-w-md mx-auto mb-5 p-6 bg-white rounded-[20px] font-poppins space-y-5"
        >
            {success ? (
                <div
                    role="status"
                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5"
                >
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-emerald-700 leading-relaxed">
                        {m['classlinkPersonalEmail.success']()}
                    </span>
                </div>
            ) : (
                <>
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            {m['classlinkPersonalEmail.title']()}
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {m['classlinkPersonalEmail.body']()}
                        </p>
                    </div>
                    <PersonalEmailForm
                        onVerified={() => setSuccess(true)}
                        secondaryAction={busy => (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={dismiss}
                                className={QUIET_BUTTON_CLASS}
                            >
                                {m['classlinkPersonalEmail.skip']()}
                            </button>
                        )}
                    />
                </>
            )}
        </section>
    );
};
