import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QR_CODE_LOGO = 'https://cdn.filestackcontent.com/UDCRoOl7TyKkQOGWjApF';

export const UserQRCode: React.FC<{
    profileId?: string;
    walletDid?: string;
    contractUri?: string;
    overrideShareLink?: string;
}> = ({ profileId, walletDid, contractUri, overrideShareLink }) => {
    let link = `learncard.app/connect?connect=true&did=${walletDid}`;

    if (contractUri) {
        link = `${
            IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
        }/passport?contractUri=${contractUri}&teacherProfileId=${profileId}&insightsConsent=true`;
    }

    if (overrideShareLink) {
        link = overrideShareLink;
    }

    return (
        <div className="w-full flex justify-center items-center">
            <div className="w-full max-w-[400px] phone:max-w-[90%] bg-grayscale-100 px-8 pt-8 pb-6 rounded-[15px]">
                <QRCodeSVG
                    className="h-full w-full"
                    value={link}
                    data-testid="qrcode-card"
                    bgColor="transparent"
                    imageSettings={{
                        src: QR_CODE_LOGO,
                        height: 35,
                        width: 35,
                        excavate: false,
                    }}
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
