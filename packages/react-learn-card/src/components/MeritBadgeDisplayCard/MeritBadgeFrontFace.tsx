import React from 'react';

import MeritBadgeCornerIcon from './MeritBadgeCornerIcon';
import MeritBadgeImageDisplay from './MeritBadgeImageDisplay';
import MeritBadgeSkillsCount from './MeritBadgeSkillsCount';
import MeritBadgeProfileImageDisplay from './MeritBadgeProfileImageDisplay';

import Smiley from '../svgs/Smiley';
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
} from '../CertificateDisplayCard/VerifierStateBadgeAndText';

type MeritBadgeFrontFaceProps = {
    isFront?: boolean;
    credential: VC | BoostAchievementCredential;
    categoryType?: LCCategoryEnum;
    issuerOverride?: Profile;
    issueeOverride?: Profile;
    trustedAppRegistry?: any[];
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    customBodyCardComponent?: React.ReactNode;
    hideIssueDate?: boolean;
    handleViewBackFace?: () => void;
    showDetailsBtn?: boolean;
};

export const MeritBadgeFrontFace: React.FC<MeritBadgeFrontFaceProps> = ({
    isFront,
    credential,
    categoryType,
    issuerOverride,
    issueeOverride,
    trustedAppRegistry,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    hideIssueDate,
    handleViewBackFace,
    showDetailsBtn = false,
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
        textLightColor = 'text-amber-500';
        textDarkColor = 'text-amber-700';
        borderColor = 'border-amber-500';
    } else if (categoryType === LCCategoryEnum.accomplishments) {
        textLightColor = 'text-lime-500';
        textDarkColor = 'text-lime-700';
        borderColor = 'border-lime-500';
    } else if (categoryType === LCCategoryEnum.learningHistory) {
        categoryTitle = 'Course';
    } else if (categoryType === LCCategoryEnum.workHistory) {
        categoryTitle = 'Experiences';
        textLightColor = 'text-blue-500';
        textDarkColor = 'text-blue-700';
        borderColor = 'border-blue-500';
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
        <section
            role="button"
            onClick={() => handleViewBackFace?.()}
            className="relative p-[13px] mt-[25px] bg-white border-[5px] rounded-[30px] border-soid border-grayscale-200 max-w-[300px]"
        >
            <div className="w-[calc(100%-26px)] absolute top-[-19px]">
                <MeritBadgeImageDisplay imageUrl={imageUrl ?? ''} className="mx-auto" />
            </div>

            <div
                className={`flex flex-col gap-[15px] items-center px-[20px] pt-[92px] pb-[50px] border-solid border-[4px] ${borderColor} rounded-[30px]`}
            >
                <div className="flex flex-col gap-[5px]">
                    <div className="flex flex-col items-center text-grayscale-900">
                        <span className="text-[16px] leading-[150%] font-jacques">
                            {issueeName || <Line width="60" />}
                        </span>
                        <span className="text-[14px] leading-[150%] font-jacques">
                            has met the requirements for
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <h1 className="text-grayscale-900 text-center text-[20px] font-jacques">
                            {title}
                        </h1>

                        <div className={`${textLightColor} uppercase text-[14px] font-poppins`}>
                            {categoryTitle}
                        </div>
                    </div>
                </div>

                {customBodyCardComponent}
                {issueeImageExists && !customBodyCardComponent && (
                    <MeritBadgeProfileImageDisplay
                        imageUrl={issueeImage}
                        imageComponent={subjectImageComponent}
                        className={`flex justify-center items-center ${textDarkColor}`}
                    />
                )}
                {!issueeImageExists && !customBodyCardComponent && (
                    <div className="h-[50px] w-[50px] rounded-full bg-grayscale-500 flex items-center justify-center">
                        <Smiley />
                    </div>
                )}

                <div className="border-t-[2px] border-solid border-sp-purple-base flex flex-col py-[20px] w-full">
                    <div className="text-[14px] text-grayscale-900 flex flex-col items-center w-full mb-[10px]">
                        <span className="font-jacques flex gap-[5px] items-center w-full overflow-ellipsis whitespace-nowrap overflow-hidden justify-center">
                            {issueeName === '0 person' ? (
                                'Not yet awarded'
                            ) : (
                                <>Awarded on {createdAt} by</>
                            )}
                        </span>
                    </div>

                    {/* <div className="flex flex-col gap-[10px] items-center">
                    <MeritBadgeSkillsCount
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
                    </div> */}

                    <div className="flex flex-col gap-[5px] items-center w-full">
                        <span className="mb-[3px] pt-[3px] text-grayscale-900 text-[25px] leading-[90%] font-sacramento border-b-[1px] border-solid border-grayscale-200 w-full text-center overflow-ellipsis whitespace-normal scrollbar-hide">
                            {issuerName}
                        </span>

                        {/* <div className="flex flex-col text-[12px] text-grayscale-900 items-center">
                            <span className="font-jacques">Troop Leader, Troop 1142</span>
                            <span className="font-jacques">Boy Scouts of America</span>
                        </div> */}

                        <VerifierStateBadgeAndText verifierState={verifierState} />
                    </div>
                </div>
            </div>

            {categoryType && (
                <>
                    <MeritBadgeCornerIcon categoryType={categoryType} position="top-left" />
                    <MeritBadgeCornerIcon categoryType={categoryType} position="top-right" />
                    <MeritBadgeCornerIcon categoryType={categoryType} position="bottom-left" />
                    <MeritBadgeCornerIcon categoryType={categoryType} position="bottom-right" />
                </>
            )}

            <MeritBadgeProfileImageDisplay
                imageUrl={issuerImage}
                imageComponent={issuerImageComponent}
                className="w-[calc(100%-26px)] absolute bottom-0 flex justify-center items-center text-sp-purple-base"
                size="small"
                showSeal
            />

            {/* so that tailwind will put these colors in the css */}
            <span className="hidden border-rose-500 text-spice-500 border-spice-500 border-cyan-500 text-cyan-500 border-indigo-500 border-sp-purple-base"></span>
        </section>
    );
};

export default MeritBadgeFrontFace;