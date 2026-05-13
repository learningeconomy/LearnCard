import React from 'react';
import { Flipped } from 'react-flip-toolkit';

import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';

import { getImageFromProfile, getInfoFromCredential } from '../../helpers/credential.helpers';
import { resolveProfileDisplay } from '../../helpers/did-display.helpers';
import { isAppDidWeb } from '@learncard/helpers';
import { Profile, VC } from '@learncard/types';
import VerifierStateBadgeAndText, {
    VerifierState,
    VERIFIER_STATES,
} from '../CertificateDisplayCard/VerifierStateBadgeAndText';
import { BoostAchievementCredential } from '../../types';
import { KnownDIDRegistryType } from '../../types';

type VC2FrontFaceInfoProps = {
    credential: VC | BoostAchievementCredential;
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
    knownDIDRegistry?: KnownDIDRegistryType;
    customBodyContentSlot?: React.ReactNode;
    unknownVerifierTitle?: string;
};

const VC2FrontFaceInfo: React.FC<VC2FrontFaceInfoProps> = ({
    credential,
    issuee,
    issuer,
    subjectDID,
    subjectImageComponent,
    issuerImageComponent,
    customBodyCardComponent,
    createdAt,
    imageUrl,
    customThumbComponent,
    knownDIDRegistry,
    customBodyContentSlot,
    unknownVerifierTitle,
}) => {
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const issueeDisplay = resolveProfileDisplay(issuee, '');
    const issuerDisplay = resolveProfileDisplay(issuer, '');

    const { credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

    const getImageElement = (
        imageUrl: string,
        alt: string,
        overrideComponent: React.ReactNode | undefined,
        avatarName: string,
        avatarColor: string,
        avatarTextClassName: string,
        avatarIconClassName: string,
        avatarFallbackVariant: 'initial' | 'fingerprint',
        bigText?: boolean
    ) => {
        if (overrideComponent) return overrideComponent;

        return (
            <UserProfilePicture
                user={{ image: imageUrl, name: avatarName }}
                alt={alt}
                avatarColor={avatarColor}
                avatarTextClassName={avatarTextClassName}
                avatarIconClassName={avatarIconClassName}
                avatarFallbackVariant={avatarFallbackVariant}
                customContainerClass={`h-full w-full ${bigText ? '!text-4xl' : ''}`}
            />
        );
    };

    const issueeImageEl: React.ReactNode = getImageElement(
        issueeImage,
        'Issuee image',
        subjectImageComponent,
        issueeDisplay.avatarLetter,
        issueeDisplay.avatarColor,
        'text-3xl leading-normal',
        'w-[60%] h-[60%] text-white/80',
        issueeDisplay.isDidValue ? 'fingerprint' : 'initial',
        true
    );
    const issuerImageEl: React.ReactNode = getImageElement(
        issuerImage,
        'Issuer image',
        issuerImageComponent,
        issuerDisplay.avatarLetter,
        issuerDisplay.avatarColor,
        'text-xl leading-normal',
        'w-[58%] h-[58%] text-white/80',
        issuerDisplay.isDidValue ? 'fingerprint' : 'initial'
    );

    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    const isAppIssuerDid = isAppDidWeb(issuerDid);

    let verifierState: VerifierState;
    if (credentialSubject?.id === issuerDid && issuerDid && issuerDid !== 'did:example:123') {
        // the extra "&& issuerDid" is so that the credential preview doesn't say "Self Verified"
        // the did:example:123 condition is so that we don't show this status from the Manage Boosts tab
        verifierState = VERIFIER_STATES.selfVerified;
    } else if (unknownVerifierTitle) {
        verifierState = VERIFIER_STATES.trustedVerifier;
    } else {
        if (knownDIDRegistry?.source === 'trusted') {
            verifierState = VERIFIER_STATES.trustedVerifier;
        } else if (knownDIDRegistry?.source === 'untrusted') {
            verifierState = VERIFIER_STATES.untrustedVerifier;
        } else if (knownDIDRegistry?.source === 'unknown') {
            verifierState = isAppIssuerDid
                ? VERIFIER_STATES.appIssuer
                : VERIFIER_STATES.unknownVerifier;
        } else {
            verifierState = isAppIssuerDid
                ? VERIFIER_STATES.appIssuer
                : VERIFIER_STATES.unknownVerifier;
        }
    }

    return (
        <Flipped inverseFlipId="card">
            <section className="vc-front-face w-full px-[15px] flex flex-col items-center gap-[15px]">
                {imageUrl && !customThumbComponent && (
                    <img
                        className="vc-front-image h-[130px] w-[130px] rounded-[10px]"
                        src={imageUrl}
                    />
                )}

                {customThumbComponent && customThumbComponent}
                <div className="vc-issue-info-box bg-white flex flex-col items-center gap-[5px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                    {customBodyCardComponent && customBodyCardComponent}

                    {!customBodyCardComponent && (
                        <>
                            <h3 className="flex flex-col text-center leading-[130%] w-full">
                                {!issueeDisplay.isMissing && issueeDisplay.isDidValue && (
                                    <span className="flex flex-wrap items-baseline justify-center gap-1 text-[17px] leading-normal font-[600] font-poppins max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span className="text-grayscale-900">Digital ID:</span>
                                        <span className="text-grayscale-500 underline">
                                            {issueeDisplay.displayName}
                                        </span>
                                    </span>
                                )}
                                {!issueeDisplay.isMissing && !issueeDisplay.isDidValue && (
                                    <span className="font-poppins font-semibold text-[20px] leading-[130%] max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-grayscale-900">
                                        {issueeDisplay.displayName}
                                    </span>
                                )}
                                {subjectDID &&
                                    !issueeDisplay.isDidValue &&
                                    !issueeDisplay.isLCNetwork && (
                                        <span className="text-[12px] text-grayscale-500 leading-[18px] font-poppins font-normal m-0 p-0">
                                            {subjectDID}
                                        </span>
                                    )}
                            </h3>
                            <div className="relative">
                                <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                                    {issueeImageEl}
                                </div>
                                <div className="vc-issuer-image h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px]">
                                    {issuerImageEl}
                                </div>
                            </div>
                            <div className="flex flex-col gap-[13px]">
                                <div className="vc-issue-details mt-[10px] flex flex-col items-center font-poppins text-[14px] leading-[20px]">
                                    <span className="created-at text-grayscale-700">
                                        {createdAt}
                                    </span>
                                    {!issuerDisplay.isMissing && (
                                        <span className="issued-by flex flex-wrap items-baseline justify-center gap-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[14px]">
                                            <span className="font-medium text-grayscale-900">
                                                By
                                            </span>
                                            {issuerDisplay.isDidValue ? (
                                                <>
                                                    <span className="flex flex-wrap items-baseline justify-center gap-1 leading-normal font-[600] font-poppins max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                                        <span className="text-grayscale-900">
                                                            Digital ID:
                                                        </span>
                                                        <span className="text-grayscale-500 underline">
                                                            {issueeDisplay.displayName}
                                                        </span>
                                                    </span>
                                                </>
                                            ) : (
                                                <strong className="font-bold text-grayscale-900">
                                                    {issuerDisplay.displayName}
                                                </strong>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <VerifierStateBadgeAndText
                                    verifierState={verifierState}
                                    unknownVerifierTitle={unknownVerifierTitle}
                                />
                            </div>
                        </>
                    )}

                    {customBodyContentSlot && customBodyContentSlot}
                </div>
            </section>
        </Flipped>
    );
};

export default VC2FrontFaceInfo;
