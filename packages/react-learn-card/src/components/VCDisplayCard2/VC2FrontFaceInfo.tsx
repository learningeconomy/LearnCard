import React from 'react';

import DefaultFace from '../../assets/images/default-face.jpeg';

import { getImageFromProfile, getNameFromProfile } from '../../helpers/credential.helpers';
import { truncateWithEllipsis } from '../../helpers/string.helpers';
import { Profile } from '@learncard/types';

type VC2FrontFaceInfoProps = {
    issuee: Profile | string;
    issuer: Profile | string;
    title: string;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    createdAt: string;
    imageUrl?: string;
    customBodyCardComponent?: React.ReactNode;
    customThumbComponent?: React.ReactNode;
};

const VC2FrontFaceInfo: React.FC<VC2FrontFaceInfoProps> = ({
    issuee,
    issuer,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    createdAt,
    imageUrl,
    customThumbComponent,
}) => {
    const issuerName = truncateWithEllipsis(getNameFromProfile(issuer ?? ''), 25);
    const issueeName = truncateWithEllipsis(getNameFromProfile(issuee ?? ''), 25);
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
        <section className="vc-front-face w-full px-[15px] flex flex-col items-center gap-[15px]">
            {imageUrl && !customThumbComponent && (
                <img className="vc-front-image h-[130px] w-[130px] rounded-[10px]" src={imageUrl} />
            )}

            {customThumbComponent && customThumbComponent}
            <div className="vc-issue-info-box bg-white flex flex-col items-center gap-[5px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                {customBodyCardComponent && customBodyCardComponent}

                {!customBodyCardComponent && (
                    <>
                        <h3 className="text-[27px] leading-[130%] text-grayscale-900">
                            {issueeName}
                        </h3>
                        <div className="relative">
                            <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                                {issueeImageEl}
                            </div>
                            <div className="vc-issuer-image h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px]">
                                {issuerImageEl}
                            </div>
                        </div>
                        <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                            <span className="created-at text-grayscale-700">{createdAt}</span>
                            <span className="issued-by text-grayscale-900 font-[500]">
                                by <strong className="font-[700]">{issuerName}</strong>
                            </span>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default VC2FrontFaceInfo;
