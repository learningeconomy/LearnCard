import React, { useEffect, useState } from 'react';

import { QRCodeSVG } from 'qrcode.react';
import { getAppBaseUrl } from '../../../config/bootstrapTenantConfig';
import { getLogger } from 'learn-card-base';

import { useTenantBrandingAssets } from '../../../config/brandingAssets';

const log = getLogger('user-qr-code');

export const QR_CODE_LOGO = 'https://cdn.filestackcontent.com/UDCRoOl7TyKkQOGWjApF';

export const UserQRCode: React.FC<{
    profileId?: string;
    walletDid?: string;
    contractUri?: string;
    overrideShareLink?: string;
}> = ({ profileId, walletDid, contractUri, overrideShareLink }) => {
    let link = `${getAppBaseUrl()}/connect?connect=true&did=${walletDid}`;

    const brandingAssets = useTenantBrandingAssets();

    // Inline the brand mark as a base64 data URI: cross-origin URLs in an SVG
    // <image> fail to render on iOS WKWebView (broken-image placeholder) and
    // when rasterized. On failure we omit the logo; level="H" keeps it scannable.
    const [logoSrc, setLogoSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        const url = brandingAssets.brandMark;

        setLogoSrc(undefined);

        if (!url) return;

        fetch(url, { mode: 'cors', credentials: 'omit' })
            .then(response => {
                if (!response.ok) throw new Error(`logo fetch failed: ${response.status}`);
                return response.blob();
            })
            .then(
                blob =>
                    new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(blob);
                    })
            )
            .then(dataUri => {
                if (!cancelled) setLogoSrc(dataUri);
            })
            .catch(error => {
                if (!cancelled) {
                    log.warn('brandMark.load.failed', error, { url });
                    setLogoSrc(undefined);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [brandingAssets.brandMark]);

    if (contractUri) {
        link = `${getAppBaseUrl()}/passport?contractUri=${contractUri}&teacherProfileId=${profileId}&insightsConsent=true`;
    }

    if (overrideShareLink) {
        link = overrideShareLink;
    }

    return (
        <div className="w-full flex justify-center items-center px-6">
            <div className="w-full max-w-[400px] phone:max-w-[90%] bg-grayscale-100 px-8 pt-8 pb-6 rounded-[15px]">
                <QRCodeSVG
                    className="h-full w-full"
                    value={link}
                    data-testid="qrcode-card"
                    bgColor="transparent"
                    level="H"
                    {...(logoSrc && {
                        imageSettings: {
                            src: logoSrc,
                            height: 35,
                            width: 35,
                            excavate: true,
                        },
                    })}
                />

                {profileId && (
                    <div className="flex items-center justify-center w-full mt-4">
                        <p className="text-grayscale-900 line-clamp-1 font-semibold text-xl pb-4">
                            @{profileId}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserQRCode;
