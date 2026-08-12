import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';

type Props = {
    message?: string;
};

const GoogleLoginHelpModal: React.FC<Props> = ({ message }) => {
    const config = getResolvedTenantConfig();
    const appName = config.branding.name;
    const playStoreUrl = config.links.playStoreUrl;
    const appStoreUrl = config.links.appStoreUrl;

    return (
        <section className="px-5 py-5 text-grayscale-900">
            <h3 className="text-xl font-semibold mb-3">Having trouble signing in?</h3>
            {message && <p className="text-sm mb-4 break-words">{message}</p>}
            <p className="text-sm mb-3">
                You can also download {appName} on your smartphone or tablet:
            </p>
            <div className="flex flex-col gap-5">
                {playStoreUrl && (
                    <div>
                        <a
                            href={playStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium underline"
                        >
                            {appName} for Android
                        </a>
                        <div className="mt-2 flex justify-center">
                            <QRCodeSVG value={playStoreUrl} size={160} bgColor="transparent" />
                        </div>
                    </div>
                )}
                {appStoreUrl && (
                    <div>
                        <a
                            href={appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium underline"
                        >
                            {appName} for iOS
                        </a>
                        <div className="mt-2 flex justify-center">
                            <QRCodeSVG value={appStoreUrl} size={160} bgColor="transparent" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default GoogleLoginHelpModal;
