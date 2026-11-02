import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Overlay } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

interface PinSignInReviewSheetProps {
    /**
     * Wrong PIN entries recorded before this sign-in (never this session's own misses).
     * Undefined when the server could not say.
     */
    priorWrongAttempts?: number;
    /** "No, everything's fine": the default answer. */
    onFine: () => void;
    /** "Yes, secure my account": opens the secure flow. */
    onSecure: () => void;
}

/**
 * Shown once after a PIN sign-in, which kept the account as it was. Earlier wrong PIN
 * entries raise the warning and give "Secure my account" primary styling, but the
 * default (focused) answer is always "No, everything's fine".
 */
export const PinSignInReviewSheet: React.FC<PinSignInReviewSheetProps> = ({
    priorWrongAttempts,
    onFine,
    onSecure,
}) => {
    const warn = (priorWrongAttempts ?? 0) > 0;
    const primary =
        'w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500';
    const secondary =
        'w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500';

    return (
        <Overlay>
            <div className="p-8 text-center space-y-v3-5">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                    <IonIcon icon={checkmarkCircleOutline} className="text-emerald-600 text-3xl" />
                </div>
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['recovery.pinSignInReview.title']()}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['recovery.pinSignInReview.question']()}
                </p>

                {warn && (
                    <div
                        role="alert"
                        className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-start"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-amber-500 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-amber-800 leading-relaxed">
                            {priorWrongAttempts === 1
                                ? m['recovery.pinSignInReview.wrongAttemptsOne']()
                                : m['recovery.pinSignInReview.wrongAttempts']({
                                      count: String(priorWrongAttempts),
                                  })}
                        </span>
                    </div>
                )}

                <div className="space-y-v3-3">
                    <button autoFocus onClick={onFine} className={warn ? secondary : primary}>
                        {m['recovery.pinSignInReview.fine']()}
                    </button>
                    <button onClick={onSecure} className={warn ? primary : secondary}>
                        {m['recovery.pinSignInReview.secure']()}
                    </button>
                </div>

                <p className="text-xs text-grayscale-500 leading-relaxed">
                    {m['recovery.pinSignInReview.later']()}
                </p>
            </div>
        </Overlay>
    );
};

export default PinSignInReviewSheet;
