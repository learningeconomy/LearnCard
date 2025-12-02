import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QR_CODE_LOGO = 'https://cdn.filestackcontent.com/UDCRoOl7TyKkQOGWjApF';

export const UserQRCode: React.FC<{
    profileId?: string;
    walletDid?: string;
}> = ({ profileId, walletDid }) => {
    return (
        <div className="w-full flex justify-center items-center">
            <div className="w-full max-w-[400px] phone:max-w-[90%] bg-grayscale-100 px-8 pt-8 pb-6 rounded-[15px]">
                <QRCodeSVG
                    className="h-full w-full"
                    value={`https://learncard.app/connect?connect=true&did=${walletDid}`}
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
                        <p className="text-grayscale-900 line-clamp-1 font-semibold text-xl">
                            @{profileId}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserQRCode;
