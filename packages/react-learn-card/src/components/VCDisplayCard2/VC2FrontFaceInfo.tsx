import React from 'react';

import DefaultFace from '../../assets/images/default-face.jpeg';

import { getImageFromProfile, getNameFromProfile } from '../../helpers/credential.helpers';
import { VC, VerificationItem, Profile } from '@learncard/types';

type VC2FrontFaceInfoProps = {
    issuee: Profile;
    issuer: Profile;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    createdAt: string;
    showDetails: () => void;
};

const VC2FrontFaceInfo: React.FC<VC2FrontFaceInfoProps> = ({
    issuee,
    issuer,
    subjectImageComponent,
    issuerImageComponent,
    createdAt,
    showDetails,
}) => {
    const issuerName = getNameFromProfile(issuer ?? '');
    const issueeName = getNameFromProfile(issuee ?? '');
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const getImageElement = (
        imageUrl: string,
        alt: string,
        overrideComponent: React.ReactNode | undefined
    ) => {
        if (overrideComponent) return overrideComponent;

        return (
            <img className="h-full w-full object-cover" src={imageUrl || DefaultFace} alt={alt} />
        );
    };

    const issueeImageEl: React.ReactNode = getImageElement(
        issueeImage,
        'Issuee image',
        subjectImageComponent
    );
    const issuerImageEl: React.ReactNode = getImageElement(
        issuerImage,
        'Issuer image',
        issuerImageComponent
    );

    return (
        <section className="w-full px-[15px] flex flex-col items-center">
            <div className="bg-white flex flex-col items-center gap-[5px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                <h2 className="text-[27px] leading-[130%]">{issueeName}</h2>
                <div className="relative">
                    <div className="h-[60px] w-[60px] rounded-full overflow-hidden">
                        {issueeImageEl}
                    </div>
                    <div className="h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px]">
                        {issuerImageEl}
                    </div>
                </div>
                <div className="mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                    <span className="text-grayscale-700">{createdAt}</span>
                    <span className="text-grayscale-900 font-[500]">
                        by <strong className="font-[700]">{issuerName}</strong>
                    </span>
                </div>
            </div>
            <button
                type="button"
                className="text-white shadow-bottom bg-grayscale-900 px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[28px]"
                onClick={showDetails}
            >
                Details
            </button>
        </section>
    );
};

export default VC2FrontFaceInfo;
