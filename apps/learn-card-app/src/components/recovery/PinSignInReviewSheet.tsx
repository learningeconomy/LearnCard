import React, { useId } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, warningOutline } from 'ionicons/icons';
import { Overlay } from 'learn-card-base';
import { focusOnMount } from './focusOnMount';
import * as m from '../../paraglide/messages.js';

interface PinSignInReviewSheetProps {
    /**
     * Wrong PIN entries recorded before this sign-in started. Never includes this
     * sign-in's own typos (own-typos rule). Undefined when the server could not say.
     */
    priorWrongAttempts?: number;
    /**
     * Wrong PIN entries that were not this sign-in's own typos are recorded against the
     * current PIN (or the server could not say), so the same PIN was not re-set and has
     * fewer tries left. The sheet then warns and asks for a new PIN.
     */
    newPinRequired?: boolean;
    /** "Done" (normal) or "Not now" (warning): dismisses the sheet. */
    onFine: () => void;
    /** "Choose a new PIN": the warning's primary action. */
    onChooseNewPin?: () => void;
    /** "Lost a device? Secure your account": opens the secure flow. */
    onSecure: () => void;
}

/**
 * Shown once after a PIN sign-in, which kept the account as it was.
 *
 * - Normal: "You're signed in", primary "Done", and a quiet link to secure the account.
 * - Warning (wrong entries recorded that were not this sign-in's own typos): "Someone may
 *   have tried your PIN", primary "Choose a new PIN" (the new-PIN flow refuses the PIN
 *   just used), the same quiet link, and "Not now". "Not now" keeps the PIN with its
 *   reduced budget; the app asks again on the next start while those entries remain.
 *
 * The revoke is never the default (focused) action. See RECOVERY.md "PIN sign-in".
 */
export const PinSignInReviewSheet: React.FC<PinSignInReviewSheetProps> = ({
    priorWrongAttempts,
    newPinRequired = false,
    onFine,
    onChooseNewPin,
    onSecure,
}) => {
    // The body is the dialog's description, so screen readers hear the reason (and the
    // count) with the title, not just the autofocused button.
    const bodyId = useId();
    const knownCount =
        typeof priorWrongAttempts === 'number' && priorWrongAttempts > 0
            ? priorWrongAttempts
            : null;
    const warn = newPinRequired || knownCount !== null;

    const primary =
        'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500';
    const quiet =
        'w-full py-2.5 min-h-[44px] text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500';

    const secureLink = (
        <button onClick={onSecure} className={`${quiet} underline-offset-2 hover:underline`}>
            {m['recovery.pinSignInReview.secureLink']()}
        </button>
    );

    if (!warn) {
        return (
            <Overlay aria-describedby={bodyId}>
                <div className="p-8 text-center space-y-v3-5">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            aria-hidden="true"
                            data-testid="pin-review-success-icon"
                            className="text-emerald-600 text-3xl"
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['recovery.pinSignInReview.title']()}
                    </h2>
                    <p id={bodyId} className="text-sm text-grayscale-600 leading-relaxed">
                        {m['recovery.pinSignInReview.body']()}
                    </p>
                    <div className="space-y-v3-2">
                        <button ref={focusOnMount} onClick={onFine} className={primary}>
                            {m['common.done']()}
                        </button>
                        {secureLink}
                    </div>
                </div>
            </Overlay>
        );
    }

    const body =
        knownCount === null
            ? m['recovery.pinSignInReview.warnBodyUnknown']()
            : knownCount === 1
              ? m['recovery.pinSignInReview.warnBodyOne']()
              : knownCount === 2
                ? // Separate key so languages with a dual form (ar) can use it.
                  m['recovery.pinSignInReview.warnBodyTwo']()
                : m['recovery.pinSignInReview.warnBody']({ count: String(knownCount) });

    return (
        <Overlay aria-describedby={bodyId}>
            <div className="p-8 text-center space-y-v3-5">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                    <IonIcon
                        icon={warningOutline}
                        aria-hidden="true"
                        data-testid="pin-review-warning-icon"
                        className="text-amber-600 text-3xl"
                    />
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['recovery.pinSignInReview.warnTitle']()}
                </h2>
                <p id={bodyId} className="text-sm text-grayscale-600 leading-relaxed">
                    {body}
                </p>
                <div className="space-y-v3-2">
                    {onChooseNewPin ? (
                        <button ref={focusOnMount} onClick={onChooseNewPin} className={primary}>
                            {m['recovery.pinSignInReview.choosePin']()}
                        </button>
                    ) : (
                        <button ref={focusOnMount} onClick={onFine} className={primary}>
                            {m['common.done']()}
                        </button>
                    )}
                    {secureLink}
                    {onChooseNewPin && (
                        <button onClick={onFine} className={quiet}>
                            {m['recovery.pinSignInReview.notNow']()}
                        </button>
                    )}
                </div>
            </div>
        </Overlay>
    );
};

export default PinSignInReviewSheet;
