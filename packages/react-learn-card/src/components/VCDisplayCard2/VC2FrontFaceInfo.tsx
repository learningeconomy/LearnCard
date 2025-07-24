import React from 'react';
import { Flipped } from 'react-flip-toolkit';

import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';

import {
    getImageFromProfile,
    getInfoFromCredential,
    getNameFromProfile,
} from '../../helpers/credential.helpers';
import { truncateWithEllipsis } from '../../helpers/string.helpers';
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
}) => {
    const issuerName = truncateWithEllipsis(getNameFromProfile(issuer ?? ''), 20);
    const issueeName = truncateWithEllipsis(getNameFromProfile(issuee ?? ''), 25);
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const { credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

    const getImageElement = (
        imageUrl: string,
        alt: string,
        overrideComponent: React.ReactNode | undefined,
        bigText?: boolean
    ) => {
        if (overrideComponent) return overrideComponent;

        return (
            <UserProfilePicture
                user={{ image: imageUrl, name: issueeName }}
                alt={alt}
                customContainerClass={bigText ? '!text-4xl' : ''}
            />
        );
    };

    const issueeImageEl: React.ReactNode = getImageElement(
        issueeImage,
        'Issuee image',
        subjectImageComponent,
        true
    );
    const issuerImageEl: React.ReactNode = getImageElement(
        issuerImage,
        'Issuer image',
        issuerImageComponent
    );

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
                            <h3 className="text-[27px] flex flex-col text-center leading-[130%] text-grayscale-900 capitalize">
                                {issueeName}
                                {subjectDID && (
                                    <span className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] m-0 p-0 normal-case">
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
                                <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                                    <span className="created-at text-grayscale-700">
                                        {createdAt}
                                    </span>
                                    <span className="issued-by text-grayscale-900 font-[500]">
                                        by <strong className="font-[700]">{issuerName}</strong>
                                    </span>
                                </div>
                                <VerifierStateBadgeAndText verifierState={verifierState} />
                            </div>
                        </>
                    )}
                </div>
            </section>
        </Flipped>
    );
};

export default VC2FrontFaceInfo;
