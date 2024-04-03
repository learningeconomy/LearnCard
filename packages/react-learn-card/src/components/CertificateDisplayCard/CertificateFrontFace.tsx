import React from 'react';

import CertificateCornerIcon from './CertificateCornerIcon';
import CertificateImageDisplay from './CertificateImageDisplay';
import CertificateProfileImageDisplay from './CertificateProfileImageDisplay';

import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';
import Smiley from '../svgs/Smiley';
import Line from '../svgs/Line';

import {
    getInfoFromCredential,
    getCategoryColor,
    getNameFromProfile,
    getImageFromProfile,
    getCategorySecondaryColor,
} from '../../helpers/credential.helpers';

import { VC, Profile } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum } from '../../types';

const VERIFIER_STATES = {
    selfVerified: 'Self Verified',
    trustedVerifier: 'Trusted Verifier',
    unknownVerifier: 'Unknown Verifier',
    untrustedVerifier: 'Untrusted Verifier',
} as const;
type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

type CertificateFrontFaceProps = {
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    issuerOverride?: Profile;
    issueeOverride?: Profile;
    trustedAppRegistry?: any[];
    subjectImageComponent?: React.ReactNode;
};

const CertificateFrontFace: React.FC<CertificateFrontFaceProps> = ({
    credential,
    categoryType,
    issuerOverride,
    issueeOverride,
    trustedAppRegistry,
    subjectImageComponent,
}) => {
    const {
        title = '',
        createdAt,
        issuer: _issuer = '',
        issuee: _issuee = '',
        credentialSubject,
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy', { uppercaseDate: false });

    const issuee = issueeOverride || _issuee;
    const issuer = issuerOverride || _issuer;

    const { description } = credentialSubject?.achievement ?? {};

    const credentialPrimaryColor = getCategoryColor(categoryType) ?? 'emerald-500';
    const credentialSecondaryColor = getCategorySecondaryColor(categoryType) ?? 'emerald-500';

    const issuerName = getNameFromProfile(issuer ?? '');
    const issueeName = getNameFromProfile(issuee ?? '');
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;

    let verifierState: VerifierState;
    if (credentialSubject?.id === issuerDid) {
        verifierState = VERIFIER_STATES.selfVerified;
    } else {
        const appRegistryEntry = trustedAppRegistry?.find(
            registryEntry => registryEntry.did === issuerDid
        );

        if (appRegistryEntry) {
            verifierState = appRegistryEntry.isTrusted
                ? VERIFIER_STATES.trustedVerifier
                : VERIFIER_STATES.untrustedVerifier;
        } else {
            verifierState = VERIFIER_STATES.unknownVerifier;
        }
    }
    const isSelfVerified = verifierState === VERIFIER_STATES.selfVerified;

    const issueeImageExists = issueeImage || subjectImageComponent;

    return (
        <>
            <div className="w-[calc(100%-26px)] absolute top-[-52px]">
                <CertificateImageDisplay
                    imageUrl={imageUrl ?? ''}
                    className="mx-auto"
                    ribbonColor={credentialSecondaryColor}
                />
            </div>

            <div
                className={`flex flex-col gap-[15px] items-center px-[20px] pt-[55px] ${isSelfVerified ? 'pb-[20px]' : 'pb-[77px]'
                    } border-solid border-[4px] border-${credentialSecondaryColor} rounded-[30px]`}
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

                {issueeImageExists && (
                    <CertificateProfileImageDisplay
                        imageUrl={issueeImage}
                        imageComponent={subjectImageComponent}
                        className={`flex justify-center items-center text-${credentialPrimaryColor}`}
                        isIssuer={isSelfVerified}
                    />
                )}
                {!issueeImageExists && (
                    <div className="h-[50px] w-[50px] rounded-full bg-grayscale-500 flex items-center justify-center">
                        <Smiley />
                    </div>
                )}

                <div className="text-[14px] text-grayscale-800 flex flex-col items-center w-full">
                    <span className="font-jacques flex gap-[5px] items-center w-full overflow-ellipsis whitespace-nowrap overflow-hidden justify-center">
                        Awarded to {issueeName || <Line width="60" />}
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
                        {issuerName || 'A Prestigious University'}
                    </span>

                    {isSelfVerified && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-green-dark flex gap-[3px] items-center">
                            <PersonBadge />
                            Self Verified
                        </span>
                    )}
                    {verifierState === VERIFIER_STATES.trustedVerifier && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-blue-light flex gap-[3px] items-center">
                            <VerifiedBadge />
                            Trusted Verifier
                        </span>
                    )}
                    {verifierState === VERIFIER_STATES.unknownVerifier && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-orange-500 flex gap-[3px] items-center">
                            <UnknownVerifierBadge />
                            Unknown Verifier
                        </span>
                    )}
                    {verifierState === VERIFIER_STATES.untrustedVerifier && (
                        <span className="uppercase font-poppins text-[12px] font-[500] text-red-mastercard flex gap-[3px] items-center">
                            <RedFlag />
                            Untrusted Verifier
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

            {!isSelfVerified && (
                <CertificateProfileImageDisplay
                    imageUrl={issuerImage}
                    className={`w-[calc(100%-26px)] absolute bottom-0 flex justify-center items-center text-${credentialPrimaryColor}`}
                    isIssuer
                />
            )}

            {/* so that tailwind will put these colors in the css */}
            <span className="hidden border-rose-600 text-spice-600"></span>
        </>
    );
};

export default CertificateFrontFace;
