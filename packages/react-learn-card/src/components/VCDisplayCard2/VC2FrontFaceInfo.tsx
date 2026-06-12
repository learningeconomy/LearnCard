import React from 'react';
import { Flipped as UntypedFlipped } from 'react-flip-toolkit';

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

type FlippedComponentProps = React.PropsWithChildren<{
    flipId?: string;
    inverseFlipId?: string;
    scale?: boolean;
}>;

const Flipped = UntypedFlipped as unknown as React.FC<FlippedComponentProps>;

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

const BadgeThumbnailPlaceholder: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/2 h-1/2 text-grayscale-400"
        aria-hidden="true"
    >
        <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
        <path
            d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 6.5 13 8.3l2 .3-1.4 1.4.3 2L12 11l-1.9.9.3-2L9 8.6l2-.3L12 6.5Z"
            fill="currentColor"
        />
    </svg>
);

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

    const [thumbErrored, setThumbErrored] = React.useState(false);

    // Reset the broken-image flag whenever the thumbnail source changes.
    React.useEffect(() => {
        setThumbErrored(false);
    }, [imageUrl]);

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
        avatarFingerprintColor: string,
        avatarTextClassName: string,
        avatarSilhouetteClassName: string,
        avatarFallbackVariant: 'initial' | 'fingerprint',
        bigText?: boolean
    ) => {
        if (overrideComponent) return overrideComponent;

        return (
            <UserProfilePicture
                user={{ image: imageUrl, name: avatarName }}
                alt={alt}
                avatarColor={avatarColor}
                avatarFingerprintColor={avatarFingerprintColor}
                avatarTextClassName={avatarTextClassName}
                avatarIconClassName={avatarSilhouetteClassName}
                avatarSilhouetteClassName={avatarSilhouetteClassName}
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
        issueeDisplay.avatarFingerprintColor,
        'text-3xl leading-normal',
        'h-[43px] w-[43px]',
        issueeDisplay.isDidValue ? 'fingerprint' : 'initial',
        true
    );
    const issuerImageEl: React.ReactNode = getImageElement(
        issuerImage,
        'Issuer image',
        issuerImageComponent,
        issuerDisplay.avatarLetter,
        issuerDisplay.avatarColor,
        issuerDisplay.avatarFingerprintColor,
        'text-xl leading-normal',
        'h-[22px] w-[22px]',
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
                {imageUrl &&
                    !customThumbComponent &&
                    (thumbErrored ? (
                        <div className="vc-front-image h-[130px] w-[130px] rounded-[10px] bg-grayscale-100 flex items-center justify-center">
                            <BadgeThumbnailPlaceholder />
                        </div>
                    ) : (
                        <img
                            className="vc-front-image h-[130px] w-[130px] rounded-[10px] bg-white object-cover"
                            src={imageUrl}
                            alt="credential thumbnail"
                            onError={() => setThumbErrored(true)}
                        />
                    ))}

                {customThumbComponent && customThumbComponent}
                <div className="vc-issue-info-box bg-white flex flex-col items-center gap-[5px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                    {customBodyCardComponent && customBodyCardComponent}

                    {!customBodyCardComponent && (
                        <>
                            <h3 className="flex flex-col text-center leading-[130%] w-full">
                                {!issueeDisplay.isMissing && issueeDisplay.isDidValue && (
                                    <span className="flex flex-wrap items-baseline justify-center gap-x-1 text-[17px] leading-normal font-[600] font-poppins max-w-full break-words">
                                        <span className="text-grayscale-900">Digital ID:</span>
                                        <span className="text-grayscale-500 underline">
                                            {issueeDisplay.displayName}
                                        </span>
                                    </span>
                                )}
                                {!issueeDisplay.isMissing && !issueeDisplay.isDidValue && (
                                    <span className="font-poppins font-semibold text-[20px] leading-[130%] max-w-full line-clamp-2 break-words text-grayscale-900">
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
                                <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden bg-white">
                                    {issueeImageEl}
                                </div>
                                <div className="vc-issuer-image h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px] bg-white">
                                    {issuerImageEl}
                                </div>
                            </div>
                            <div className="flex flex-col gap-[13px]">
                                <div className="vc-issue-details mt-[10px] flex flex-col items-center font-poppins text-[14px] leading-[20px]">
                                    <span className="created-at text-grayscale-700">
                                        {createdAt}
                                    </span>
                                    {!issuerDisplay.isMissing && (
                                        <span className="issued-by max-w-full break-words text-center line-clamp-2 text-[14px]">
                                            <span className="font-medium text-grayscale-900">
                                                By
                                            </span>{' '}
                                            {issuerDisplay.isDidValue ? (
                                                <span className="font-[600] font-poppins break-words">
                                                    <span className="text-grayscale-900">
                                                        Digital ID:
                                                    </span>{' '}
                                                    <span className="text-grayscale-500 underline">
                                                        {issuerDisplay.displayName}
                                                    </span>
                                                </span>
                                            ) : (
                                                <strong className="font-bold text-grayscale-900 break-words">
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
