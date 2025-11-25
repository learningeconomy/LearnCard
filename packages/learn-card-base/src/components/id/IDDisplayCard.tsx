import React from 'react';

import { ProfilePicture, useCurrentUser } from 'learn-card-base';

import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import CredentialVerificationDisplay from '../CredentialBadge/CredentialVerificationDisplay';

import { VC } from '@learncard/types';
import { BoostSkeleton } from '../boost/boostSkeletonLoaders/BoostSkeletons';

type IDDisplayCardProps = {
    name?: string;
    location?: string;
    backgroundImage?: string;
    dimBackgroundImage?: boolean;
    fontColor?: string;
    accentColor?: string;
    showIssuerImage?: boolean;
    issuerThumbnail?: string;
    idClassName?: string;
    idFooterClassName?: string;
    idIssuerName?: string;
    showIssuerName?: boolean;
    customIssuerThumbContainerClass?: string;
    issueeThumbnail?: string;
    issueeName?: string;
    showQRCode?: boolean;
    handleQRCodeClick?: () => void;
    cred?: VC;
    loading?: boolean;
};

export const IDDisplayCard: React.FC<IDDisplayCardProps> = ({
    name = '',
    location = '',
    backgroundImage,
    dimBackgroundImage = false,
    fontColor,
    accentColor,
    showIssuerImage = false,
    issuerThumbnail,
    idClassName = '',
    idFooterClassName = '',
    idIssuerName = '',
    showIssuerName = true,
    customIssuerThumbContainerClass = '',
    issueeThumbnail = '',
    issueeName = '',
    showQRCode = false,
    handleQRCodeClick = () => {},
    cred,
    loading,
}) => {
    const currentUser = useCurrentUser();

    let backgroundStyles = {};

    if (backgroundImage) {
        backgroundStyles = {
            backgroundImage: `url(${backgroundImage})`,
        };

        if (dimBackgroundImage) {
            backgroundStyles = {
                backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.75)), url(${backgroundImage})`,
            };
        }
    } else {
        backgroundStyles = {
            background: '#18224e',
        };
    }

    if (loading) backgroundStyles = { background: '#ffffff' };

    const issuerLineClampStyles = location ? 'line-clamp-1' : 'line-clamp-2';
    const _issueeName = issueeName || currentUser?.name;

    return (
        <>
            <div
                style={{
                    ...backgroundStyles,
                }}
                className={`relative flex-col w-[335px] h-[180px] rounded-tr-[24px] rounded-tl-[24px] border-white border-solid border-l-4 border-r-4 border-t-4 pl-4 pt-2 bg-cover bg-center bg-no-repeat ${idClassName}`}
            >
                {loading && (
                    <BoostSkeleton
                        skeletonStyles={{ width: '100%', height: '100%' }}
                        containerClassName="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                    />
                )}
                {!loading && (
                    <ProfilePicture
                        overrideSrc={!!issueeThumbnail}
                        overrideSrcURL={issueeThumbnail}
                        customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                        customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                        customSize={500}
                    />
                )}

                <p
                    style={{ color: fontColor || '#ffffff' }}
                    className="capitalize font-medium text-sm mt-2 max-w-[200px] text-left line-clamp-1"
                >
                    {_issueeName}
                </p>
                <p
                    style={{ color: fontColor || '#ffffff' }}
                    className={`font-semibold text-xs line-clamp-1 text-left boost-id-card-issuer-name ${issuerLineClampStyles} `}
                >
                    {idIssuerName}
                </p>
                <p
                    style={{ color: fontColor || '#ffffff' }}
                    className="uppercase text-xs max-w-[200px] line-clamp-1 text-left"
                >
                    {location}
                </p>
                {showIssuerImage && (
                    <div
                        className={`absolute bottom-[-25px] rounded-full bg-white flex items-center justify-center border-[3px] border-solid border-white z-50 id-card-issuer-thumb-container ${customIssuerThumbContainerClass}`}
                    >
                        <div
                            className={`absolute flex items-center justify-center left-[65%] top-[-12%] z-50`}
                        >
                            {cred && (
                                <CredentialVerificationDisplay
                                    credential={cred}
                                    iconClassName="w-[20px] h-[20px]"
                                />
                            )}
                        </div>
                        <div className="overflow-hidden rounded-full">
                            {issuerThumbnail ? (
                                <img
                                    alt="issuer thumbnail"
                                    src={issuerThumbnail}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    alt="issuer thumbnail"
                                    src={EmptyImage}
                                    className="w-[43px] h-[47px]"
                                />
                            )}
                        </div>
                    </div>
                )}
                {showQRCode && !loading && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            handleQRCodeClick();
                        }}
                        className="absolute top-[6px] right-[6px] flex items-center justify-center bg-white rounded-full p-2 z-50 shadow-3xl"
                    >
                        <QRCodeScanner className="h-[30px] w-[30px] text-grayscale-900" />
                    </button>
                )}
            </div>
            {showIssuerName ? (
                <div
                    style={{ backgroundColor: accentColor || '#622599' }}
                    className={`flex items-center justify-start relative h-[35px] rounded-br-[24px] rounded-bl-[24px] border-white border-solid border-4 w-[335px] boost-id-card-footer ${idFooterClassName}`}
                >
                    <div className="w-full h-[2px] bg-white absolute top-[-4px]" />
                    <p className="line-clamp-1 boost-id-card-title">{name}</p>
                </div>
            ) : (
                <div
                    style={{ backgroundColor: accentColor || '#622599' }}
                    className={`relative h-[24px] rounded-br-[16px] rounded-bl-[16px] border-white border-solid border-4 w-[335px] boost-id-card-title ${idFooterClassName}`}
                />
            )}
        </>
    );
};

export default IDDisplayCard;
