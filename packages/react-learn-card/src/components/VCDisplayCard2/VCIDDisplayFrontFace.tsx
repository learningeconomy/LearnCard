import React from 'react';

import DefaultFace from '../../assets/images/default-face.jpeg';

import { getImageFromProfile, getNameFromProfile } from '../../helpers/credential.helpers';
import { truncateWithEllipsis } from '../../helpers/string.helpers';
import { Profile } from '@learncard/types';
import IDIcon from '../svgs/IDIcon';
import IDSleeve from '../../assets/images/id-sleeve.png';
import QRCodeIcon from '../svgs/QRCodeIcon';

type VCIDDisplayFrontFaceProps = {
    issuee: Profile | string;
    issuer: Profile | string;
    title: string;
    subjectDID?: string | undefined;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    createdAt: string;
    imageUrl?: string;
    customBodyCardComponent?: React.ReactNode;
    customThumbComponent?: React.ReactNode;
};

const VCIDDisplayFrontFace: React.FC<VCIDDisplayFrontFaceProps> = ({
    issuee,
    issuer,
    subjectDID,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    createdAt,
    imageUrl,
    customThumbComponent,
}) => {
    return (
        <section className="vc-front-face w-full flex flex-col items-center gap-[15px]">
            <div className="w-[380px] h-[211px] bg-red-300" />

            {customThumbComponent && customThumbComponent}

            <div className="text-white w-full flex items-center justify-center font-poppins">
                <IDIcon className="text-white mr-1" /> ID
            </div>

            <div className="w-full relative">
                <button className="text-grayscale-900 bg-white rounded-full p-[10px] absolute top-[-10px] right-[45%]">
                    <QRCodeIcon className="text-grayscale-900 " />
                </button>
                <img src={IDSleeve} alt="id-sleeve" className="w-full object-cover" />
            </div>

            <div className="w-full bg-white relative mt-[-90px] px-6 pb-4 pt-4">
                <p className="w-full text-center line-clamp-5 text-grayscale-900 font-poppins text-base">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
                    Ipsum has been the industry's standard dummy text ever since the 1500s, when an
                    unknown printer took a galley of type and scrambled it to make a type specimen
                    book. It has survived not only five centuries, but also the leap into electronic
                    typesetting, remaining essentially unchanged. It was popularised in the 1960s
                    with the release of Letraset sheets containing Lorem Ipsum passages, and more
                    recently with desktop publishing software like Aldus PageMaker including
                    versions of Lorem Ipsum.
                </p>

                <div className="w-full flex items-center justify-center mt-4">
                    <div className="h-[2px] w-full bg-gray-200" />
                </div>
            </div>
        </section>
    );
};

export default VCIDDisplayFrontFace;
