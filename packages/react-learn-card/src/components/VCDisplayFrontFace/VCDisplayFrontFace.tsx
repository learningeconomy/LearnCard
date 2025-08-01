import React from 'react';
import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';
import { VCVerificationCheckWithText } from '../VCVerificationCheck/VCVerificationCheck';
import { getImageFromProfile, getNameFromProfile } from '../../helpers/credential.helpers';

import { VCDisplayCardProps } from '../../types';

const VCDisplayFrontFace: React.FC<VCDisplayCardProps> = ({
    title,
    createdAt,
    issuer,
    issuee,
    subjectImageComponent,
    issuerImageComponent,
    hideProfileBubbles = false,
    credentialSubject,
    className = '',
    loading,
    handleClick,
    overrideCardImageComponent,
    overrideCardTitle,
    customHeaderComponent,
}) => {
    const credentialAchievementImage =
        credentialSubject?.achievement?.image?.id || credentialSubject?.achievement?.image;
    const issuerName = getNameFromProfile(issuer ?? '');
    const issueeName = getNameFromProfile(issuee ?? '');
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    let issueeImageEl: React.ReactNode | null = null;
    if (subjectImageComponent) {
        issueeImageEl = subjectImageComponent;
    } else {
        issueeImageEl = (
            <UserProfilePicture
                customContainerClass={`object-cover h-full w-full text-4xl ${
                    !issueeImage ? 'pt-[8px]' : ''
                }`}
                user={{ image: issueeImage, name: issueeName }}
                alt="Issuee image"
            />
        );
    }

    let issuerImageEl: React.ReactNode | null = null;

    if (issuerImageComponent) {
        issuerImageEl = issuerImageComponent;
    } else {
        issuerImageEl = (
            <UserProfilePicture
                customContainerClass={`object-cover h-full w-full text-4xl ${
                    !issuerImage ? 'pt-[8px]' : ''
                }`}
                user={{ image: issuerImage, name: issuerName }}
                alt="Issuer image"
            />
        );
    }

    const credImg = credentialAchievementImage ? (
        <img
            className="h-full w-full object-cover"
            src={credentialAchievementImage ?? ''}
            alt="Credential Achievement Image"
        />
    ) : (
        <></>
    );

    const renderCardImg = overrideCardImageComponent ? overrideCardImageComponent : credImg;
    const cardTitle = overrideCardTitle ? overrideCardTitle : title;

    return (
        <div
            className={`z-[9] vc-display-main-card-front flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[77%]"></section>
            <section className="flex flex-col items-center justify-center z-10 text-center credential-thumb-img">
                <section className="max-w-[100px] max-h-[100px]">{renderCardImg}</section>

                <section className="flex flex-row  w-full line-clamp-2">
                    <div className="flex flex-row w-full line-clamp-2 py-4 vc-flippy-card-title-front ">
                        <h3
                            className="vc-thumbnail-title w-full text-2xl line-clamp-2 tracking-wide leading-snug text-center vc-display-title text-gray-900 font-medium"
                            data-testid="vc-thumbnail-title"
                        >
                            {cardTitle ?? ''}
                        </h3>
                    </div>

                    {customHeaderComponent && customHeaderComponent}
                </section>

                <section className="flex flex-row items-center justify-center mt-2 w-full my-2 vc-card-issuer-thumbs">
                    {!hideProfileBubbles && (
                        <>
                            <div className="flex items-center justify-center h-16 w-16 shadow-3xl rounded-full overflow-hidden bg-white">
                                {issuerImageEl}
                            </div>
                            <img
                                className="h-8 w-8 my-0 mx-4"
                                src={FatArrow ?? ''}
                                alt="fat arrow icon"
                            />
                            <div className="flex items-center justify-center h-16 w-16 shadow-3xl rounded-full overflow-hidden bg-white">
                                {issueeImageEl}
                            </div>
                        </>
                    )}
                </section>

                <div className="w-full mt-2 vc-card-issued-to-info">
                    <p
                        className="text-sm font-light text-center line-clamp-2 vc-display-issue-details text-gray-900"
                        data-testid="vc-thumbnail-createdAt"
                    >
                        Issued to <span className="font-bold text-gray-900">{issueeName}</span> on{' '}
                        {createdAt ?? ''} by{' '}
                        <span className="font-bold text-gray-900"> {issuerName}</span>
                    </p>
                </div>

                <button
                    onClick={handleClick}
                    className="cursor-alias bg-white my-3 border-0 text-indigo-500 font-semibold py-2 px-4 sl"
                >
                    <span className="flex justify-center">
                        <p className="flex items-center">View Details</p>
                    </span>
                </button>
            </section>

            <div className="flex items-center justify-center w-full">
                <VCVerificationCheckWithText loading={loading} />
            </div>
        </div>
    );
};

export default VCDisplayFrontFace;
