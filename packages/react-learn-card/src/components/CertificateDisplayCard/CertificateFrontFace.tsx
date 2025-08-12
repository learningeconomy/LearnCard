import React from 'react';

import CertificateCornerIcon from './CertificateCornerIcon';
import CertificateImageDisplay from './CertificateImageDisplay';
import CertDisplayCardSkillsCount from './CertDisplayCardSkillsCount';
import CertificateProfileImageDisplay from './CertificateProfileImageDisplay';

import Line from '../svgs/Line';

import {
    getInfoFromCredential,
    getNameFromProfile,
    getImageFromProfile,
    getCategoryLightColor,
    getCategoryDarkColor,
} from '../../helpers/credential.helpers';

import { VC, Profile } from '@learncard/types';
import { BoostAchievementCredential, LCCategoryEnum } from '../../types';
import VerifierStateBadgeAndText, {
    VerifierState,
    VERIFIER_STATES,
} from './VerifierStateBadgeAndText';
import { KnownDIDRegistryType } from '../../types';

type CertificateFrontFaceProps = {
    isFront?: boolean;
    credential: VC | BoostAchievementCredential | any;
    categoryType?: LCCategoryEnum;
    issuerOverride?: Profile;
    issueeOverride?: Profile;
    knownDIDRegistry?: KnownDIDRegistryType;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    customBodyCardComponent?: React.ReactNode;
    hideIssueDate?: boolean;
    handleViewBackFace?: () => void;
    showDetailsBtn?: boolean;
    formattedDisplayType?: string;
};

export const CertificateFrontFace: React.FC<CertificateFrontFaceProps> = ({
    isFront,
    credential,
    categoryType,
    issuerOverride,
    issueeOverride,
    knownDIDRegistry,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    hideIssueDate,
    handleViewBackFace,
    showDetailsBtn = false,
    formattedDisplayType,
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

    const credentialLightColor = getCategoryLightColor(categoryType); // 500
    const credentialDarkColor = getCategoryDarkColor(categoryType); // 700

    let categoryTitle: string | undefined = categoryType;

    let textLightColor = `text-${credentialLightColor}`;
    let textDarkColor = `text-${credentialDarkColor}`;
    let borderColor = `border-${credentialLightColor}`;

    if (categoryType === LCCategoryEnum.accommodations) {
        textLightColor = 'text-violet-500';
        textDarkColor = 'text-violet-700';
        borderColor = 'border-violet-500';
    } else if (categoryType === LCCategoryEnum.accomplishments) {
        textLightColor = 'text-yellow-500';
        textDarkColor = 'text-yellow-700';
        borderColor = 'border-yellow-500';
        categoryTitle = 'Portfolio';
    } else if (categoryType === LCCategoryEnum.learningHistory) {
        categoryTitle = 'Study';
    } else if (categoryType === LCCategoryEnum.workHistory) {
        categoryTitle = 'Experiences';
        textLightColor = 'text-cyan-500';
        textDarkColor = 'text-cyan-700';
        borderColor = 'border-cyan-500';
    }

    const issuerName = getNameFromProfile(issuer ?? '');
    const issueeName = getNameFromProfile(issuee ?? '');
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;

    let verifierState: VerifierState;
    if (credentialSubject?.id === issuerDid && issuerDid && issuerDid !== 'did:example:123') {
        // the extra "&& issuerDid" is so that the credential preview doesn't say "Self Verified"
        // the did:example:123 condition is so that we don't show this status from the Manage Boosts tab
        verifierState = VERIFIER_STATES.selfVerified;
    } else {
        if (knownDIDRegistry?.source === 'trusted') {
            verifierState = VERIFIER_STATES.trustedVerifier;
        } else if (knownDIDRegistry?.source === 'untrusted') {
            verifierState = VERIFIER_STATES.untrustedVerifier;
        } else if (knownDIDRegistry?.source === 'unknown') {
            verifierState = VERIFIER_STATES.unknownVerifier;
        } else {
            verifierState = VERIFIER_STATES.unknownVerifier;
        }
    }
    const isSelfVerified = verifierState === VERIFIER_STATES.selfVerified;

    const issueeImageExists = issueeImage || subjectImageComponent;

    return (
        <section
            role="button"
            onClick={() => handleViewBackFace?.()}
            className="relative p-[13px] mt-[55px] bg-white border-[5px] rounded-[30px] border-soid border-grayscale-200"
        >
            <div className="w-[calc(100%-26px)] absolute top-[-52px]">
                <CertificateImageDisplay
                    imageUrl={imageUrl ?? ''}
                    className="mx-auto"
                    ribbonColor={textLightColor}
                />
            </div>

            <div
                className={`flex flex-col gap-[15px] items-center px-[20px] pt-[55px] ${
                    isSelfVerified ? 'pb-[20px]' : 'pb-[77px]'
                } border-solid border-[4px] ${borderColor} rounded-[30px]`}
            >
                <div className="flex flex-col gap-[5px] items-center">
                    <h1 className="text-grayscale-900 text-center text-[20px] font-jacques">
                        {title}
                    </h1>
                    <div
                        className={`${textLightColor} uppercase text-[14px] font-notoSans font-[600]`}
                    >
                        {formattedDisplayType}
                    </div>
                </div>

                {customBodyCardComponent}
                {!customBodyCardComponent && (
                    <CertificateProfileImageDisplay
                        imageUrl={issueeImage}
                        imageComponent={subjectImageComponent}
                        className={`flex justify-center items-center ${textDarkColor}`}
                        isIssuer={isSelfVerified}
                        userName={issueeName}
                    />
                )}

                <div className="text-[14px] text-grayscale-800 flex flex-col items-center w-full">
                    <span className="font-jacques flex gap-[5px] items-center w-full justify-center text-center">
                        {issueeName === '0 person' ? (
                            'Not yet awarded'
                        ) : (
                            <>Awarded to {issueeName || <Line width="60" />}</>
                        )}
                    </span>
                    {!hideIssueDate && <span className="font-jacques">on {createdAt}</span>}
                </div>

                <div className="flex flex-col gap-[10px] items-center">
                    {description && (
                        <div className="text-center text-grayscale-700 text-[12px] font-jacques line-clamp-4">
                            {description}
                        </div>
                    )}

                    <CertDisplayCardSkillsCount
                        skills={credential?.skills ?? []}
                        onClick={handleViewBackFace}
                    />

                    {isFront && showDetailsBtn && (
                        <button
                            type="button"
                            className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[25px] w-fit select-none"
                            onClick={() => handleViewBackFace?.()}
                        >
                            Details
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-[5px] items-center w-full">
                    <span className="font-jacques text-[12px] text-grayscale-800">
                        Certified by
                    </span>
                    <span className="mb-[3px] pt-[3px] text-grayscale-900 text-[25px] leading-[90%] font-sacramento border-b-[1px] border-solid border-grayscale-200 w-full text-center overflow-ellipsis whitespace-normal scrollbar-hide">
                        {issuerName}
                    </span>

                    <VerifierStateBadgeAndText verifierState={verifierState} />
                </div>
                <div className={`${textLightColor} uppercase text-[14px] font-notoSans font-[600]`}>
                    {categoryTitle}
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
                    imageUrl={issuerImage || credential?.issuer?.image}
                    imageComponent={issuerImageComponent}
                    className={`w-[calc(100%-26px)] absolute bottom-0 flex justify-center items-center ${textDarkColor}`}
                    isIssuer
                    userName={issuerName}
                />
            )}

            {/* so that tailwind will put these colors in the css */}
            <span className="hidden border-rose-500 text-spice-500 border-spice-500 border-cyan-500 text-cyan-500 border-indigo-500"></span>
            <span className="hidden border-blue-500 border-indigo-500 border-pink-500 border-emerald-500 border-yellow-500 border-cyan-500 border-rose-500 border-emerald-500 border-teal-500 border-violet-500 border-yellow-500 border-spice-500 "></span>
            <span className="hidden text-blue-700 text-indigo-700 text-pink-700 text-emerald-700 text-yellow-700 text-cyan-700 text-rose-700 text-emerald-700 text-teal-700 text-violet-700 text-yellow-700 text-spice-700 "></span>
        </section>
    );
};

export default CertificateFrontFace;
