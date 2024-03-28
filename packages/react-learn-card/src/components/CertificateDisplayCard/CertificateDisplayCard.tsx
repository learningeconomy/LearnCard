import React, { useState } from 'react';
import { getInfoFromCredential } from '../../helpers/credential.helpers';
import { VC, VerificationStatusEnum } from '@learncard/types';
import { TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { BoostAchievementCredential } from '../../types';
import CertificateImageDisplay from './CertificateImageDisplay';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';

type CertificateDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
};

export const CertificateDisplayCard: React.FC<CertificateDisplayCardProps> = ({ credential }) => {
    console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 CertificateDisplayCard');
    console.log('credential:', credential);
    const [isFront, setIsFront] = useState(true);

    const {
        title = '',
        createdAt,
        issuer = '',
        issuee = '',
        credentialSubject,
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy', { uppercaseDate: false });

    const { description, type } = credentialSubject.achievement ?? {};

    const credentialType = type?.[0];

    console.log('credentialSubject:', credentialSubject);

    // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
    // console.log('TYPE_TO_WALLET_DARK_COLOR:', TYPE_TO_WALLET_DARK_COLOR);
    // console.log('credentialType:', credentialType);
    // console.log(
    //     'TYPE_TO_WALLET_DARK_COLOR[credentialType]:',
    //     TYPE_TO_WALLET_DARK_COLOR[credentialType]
    // );

    // const credentialPrimaryColor = TYPE_TO_WALLET_DARK_COLOR[credentialType] ?? 'emerald-500';
    const credentialPrimaryColor = 'emerald-500';

    const isSelfVerified = true; // TODO actual logic

    return (
        <section className="border-solid border-[5px] border-grayscale-200 bg-white rounded-[30px] p-[13px] relative">
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
                        {credentialType}
                    </div>

                    <h1 className="text-grayscale-900 text-center text-[20px] font-jacques">
                        {title}
                    </h1>
                </div>

                <img
                    className="h-[50px] w-[50px] rounded-full"
                    src="https://imgs.search.brave.com/mR-qTglzpGl8uw83n_ErbMNuZKXcqnfulrRGN17nsn0/rs:fit:860:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvZmVhdHVy/ZWQvY29vbC1wcm9m/aWxlLXBpY3R1cmUt/ODdoNDZnY29iamw1/ZTR4dS5qcGc"
                />

                <div className="text-[14px] text-grayscale-800 flex flex-col items-center">
                    <span className="font-jacques">Awarded to {issuee || '[No Issuee Name]'}</span>
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
        </section>
    );
};

export default CertificateDisplayCard;
