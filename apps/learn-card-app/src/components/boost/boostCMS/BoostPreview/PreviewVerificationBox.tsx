import React from 'react';
import { IonIcon } from '@ionic/react';
import { shieldCheckmarkOutline, calendarOutline, ribbonOutline } from 'ionicons/icons';

const PreviewVerificationBox: React.FC = () => {
    return (
        <div className="bg-white flex flex-col items-start gap-[12px] rounded-[20px] shadow-bottom-2-4 px-[15px] py-[20px] w-full relative">
            <div className="w-full flex items-center justify-between">
                <h3 className="text-[17px] font-notoSans text-grayscale-900">
                    Credential Verifications
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-grayscale-900 text-white text-[11px] font-semibold uppercase tracking-wide">
                    Preview
                </span>
            </div>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                This is how your credential will look. Verification runs once you issue it.
            </p>

            <div className="w-full flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-emerald-700 leading-relaxed">
                        Once issued, your credential will carry a valid cryptographic proof.
                    </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-grayscale-10 border border-grayscale-200 rounded-2xl">
                    <IonIcon
                        icon={calendarOutline}
                        className="text-grayscale-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-grayscale-600 leading-relaxed">
                        A real issuance date is added the moment you issue.
                    </span>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-grayscale-10 border border-grayscale-200 rounded-2xl">
                    <IonIcon
                        icon={ribbonOutline}
                        className="text-grayscale-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-grayscale-600 leading-relaxed">
                        The issuer is recorded so recipients can confirm who awarded it.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PreviewVerificationBox;
