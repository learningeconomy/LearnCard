import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
    message?: string;
};

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=org.scoutpass.app&hl=en';
const IOS_URL = 'https://apps.apple.com/us/app/scoutpass/id6451271002';

const GoogleLoginHelpModal: React.FC<Props> = ({ message }) => {
    return (
        <section className="px-5 py-5 text-grayscale-900">
            <h3 className="text-xl font-semibold mb-3">Having trouble signing in?</h3>
            {message && <p className="text-sm mb-4 break-words">{message}</p>}
            <p className="text-sm mb-3">
                You can also download ScoutPass on your smartphone or tablet:
            </p>
            <div className="flex flex-col gap-5">
                <div>
                    <a
                        href={ANDROID_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium underline"
                    >
                        ScoutPass for Android
                    </a>
                    <div className="mt-2 flex justify-center">
                        <QRCodeSVG value={ANDROID_URL} size={160} bgColor="transparent" />
                    </div>
                </div>
                <div>
                    <a
                        href={IOS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium underline"
                    >
                        ScoutPass for iOS
                    </a>
                    <div className="mt-2 flex justify-center">
                        <QRCodeSVG value={IOS_URL} size={160} bgColor="transparent" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoogleLoginHelpModal;
