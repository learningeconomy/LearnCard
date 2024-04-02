import React from 'react';
import { getInfoFromCredential, getCategoryColor } from '../../helpers/credential.helpers';
import { VC } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum } from '../../types';
import CertificateImageDisplay from './CertificateImageDisplay';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import CertificateCornerIcon from './CertificateCornerIcon';
import Smiley from '../svgs/Smiley';
import Line from '../svgs/Line';

type CertificateFrontFaceProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
};

const CertificateFrontFace: React.FC<CertificateFrontFaceProps> = ({
    credential,
    categoryType,
}) => {
    const {
        title = '',
        createdAt,
        issuer = '',
        issuee = '',
        credentialSubject,
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy', { uppercaseDate: false });

    const { description } = credentialSubject?.achievement ?? {};

    const credentialPrimaryColor = getCategoryColor(categoryType) ?? 'emerald-500';

    const isSelfVerified = true; // TODO actual logic

    const issueeImage = '';

    return (
        <>
            <div className="w-[calc(100%-26px)] absolute top-[-52px]">
                <CertificateImageDisplay
                    imageUrl={imageUrl ?? ''}
                    className="mx-auto"
                    ribbonColor={credentialPrimaryColor}
                />
            </div>

            <div
                className={`flex flex-col gap-[15px] items-center p-[20px] !pt-[75px] border-solid border-[4px] border-${credentialPrimaryColor} rounded-[30px]`}
            >
                <div className="flex flex-col gap-[5px] items-center">
                    <div
                        className={`text-${credentialPrimaryColor} uppercase text-[14px] font-poppins`}
                    >
                        {categoryType}
                    </div>

                    <h1 className="text-grayscale-900 text-center text-[20px] font-jacques">
                        {title}
                    </h1>
                </div>

                {issueeImage && (
                    <img className="h-[50px] w-[50px] rounded-full" src={issueeImage} />
                )}
                {!issueeImage && (
                    <div className="h-[50px] w-[50px] rounded-full bg-grayscale-500 flex items-center justify-center">
                        <Smiley />
                    </div>
                )}

                <div className="text-[14px] text-grayscale-800 flex flex-col items-center">
                    <span className="font-jacques flex gap-[5px] items-center">
                        Awarded to {issuee || <Line width="60" />}
                    </span>
                    <span className="font-jacques">on {createdAt}</span>
                </div>

                <div className="flex flex-col gap-[10px] items-center">
                    {description && (
                        <div className="text-center text-grayscale-700 text-[12px] font-jacques line-clamp-4">
                            {description}
                        </div>
                    )}

                    <div className="text-violet-500 font-poppins text-[14px]">+2 Skills</div>
                </div>

                <div className="flex flex-col gap-[5px] items-center">
                    <span className="font-jacques text-[12px] text-grayscale-800">
                        Certified by
                    </span>
                    <span className="mb-[3px] text-grayscale-900 text-[25px] leading-[90%] font-sacramento border-b-[1px] border-solid border-grayscale-200 w-full text-center">
                        {issuer || 'A Prestigious University'}
                    </span>

                    {!isSelfVerified && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-blue-light flex gap-[3px] items-center">
                            <VerifiedBadge />
                            Trusted Verifier
                        </span>
                    )}
                    {isSelfVerified && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-green-dark flex gap-[3px] items-center">
                            <PersonBadge />
                            Self Verified
                        </span>
                    )}
                </div>
            </div>

            {categoryType && (
                <>
                    <CertificateCornerIcon categoryType={categoryType} position="top-left" />
                    <CertificateCornerIcon categoryType={categoryType} position="top-right" />
                    <CertificateCornerIcon categoryType={categoryType} position="bottom-left" />
                    <CertificateCornerIcon categoryType={categoryType} position="bottom-right" />
                </>
            )}

            {/* so that tailwind will put these colors in the css */}
            <span className="hidden border-rose-600 text-spice-600"></span>
        </>
    );
};

export default CertificateFrontFace;
