import React from 'react';
import { VCDisplayCardProps } from '../../types';
import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import FlipArrowRight from '../../assets/images/ArrowArcRight.svg';
import DefaultFace from '../../assets/images/default-face.jpeg';
import { VCVerificationCheckWithText } from '../VCVerificationCheck/VCVerificationCheck';
import { getImageFromProfile, getNameFromProfile } from '../../helpers/credential.helpers';

const VCDisplayFrontFace: React.FC<VCDisplayCardProps> = ({
    title,
    createdAt,
    issuer,
    issuee,
    subjectImageComponent,
    hideProfileBubbles = false,
    credentialSubject,
    className = '',
    loading,
}) => {
    const credentialAchievementImage =
        credentialSubject?.achievement?.image?.id || credentialSubject?.achievement?.image;
    const issuerName = getNameFromProfile(issuer ?? '');
    const issueeName = getNameFromProfile(issuee ?? '');
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const issuerNameAbr = issuerName?.slice(0, 1) ?? '';

    let issueeImageEl: React.ReactNode | null = null;
    const issuerImgExists = issuerImage && issuerImage !== '';
    const issueeImgExists = issueeImage && issueeImage !== '';
    if (issueeImgExists) {
        issueeImageEl = (
            <div className="flex flex-row items-center justify-center h-full w-full rounded-full border-solid border-4 border-white overflow-hidden bg-white">
                <img
                    className="h-full w-full object-cover"
                    src={issueeImage || DefaultFace}
                    alt="Issuee image"
                />
            </div>
        );
    } else if (!issueeImgExists && subjectImageComponent) {
        issueeImageEl = subjectImageComponent;
    }
   
    let issuerImageEl: React.ReactNode | null = null;

    if (issuerImgExists) {
        issuerImageEl = (
            <img className="w-4/6 h-4/6 object-cover" src={issuerImage} alt="Issuer image" />
        );
    } else {
        issuerImageEl = (
            <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-emerald-700 text-white font-medium text-3xl">
                {issuerNameAbr}
            </div>
        );
    }

    return (
        <div
            className={`flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[600px] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[77%]"></section>
            <section className="flex flex-col items-center justify-center z-10 text-center credential-thumb-img">
                <section className="max-w-[100px] max-h-[100px]">
                    {credentialAchievementImage && (
                        <img
                            className="h-full w-full object-cover"
                            src={credentialAchievementImage ?? ''}
                            alt="Credential Achievement Image"
                        />
                    )}
                </section>

                <section className="flex flex-row  w-full line-clamp-2">
                    <div className="flex flex-row w-full line-clamp-2 py-4 vc-flippy-card-title-front ">
                        <h3
                            className="vc-thumbnail-title w-full text-2xl line-clamp-2 tracking-wide leading-snug text-center vc-display-title text-gray-900 font-medium"
                            data-testid="vc-thumbnail-title"
                        >
                            {title ?? ''}
                        </h3>
                    </div>
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

                <button className="cursor-alias bg-white my-3 border-2 text-indigo-500 font-semibold py-2 px-4 shadow-3xl rounded-full">
                    <span className="flex justify-center">
                        <p className="flex items-center">Details</p>
                        <img
                            className="h-8 w-8 my-0 mx-1"
                            src={FlipArrowRight ?? ''}
                            alt="Flip Card"
                        />
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
