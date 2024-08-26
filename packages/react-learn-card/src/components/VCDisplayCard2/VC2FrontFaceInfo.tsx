import React from 'react';

import DefaultFace from '../../assets/images/default-face.jpeg';

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
    trustedAppRegistry?: any[];
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
    trustedAppRegistry,
}) => {
    const issuerName = truncateWithEllipsis(getNameFromProfile(issuer ?? ''), 25);
    const issueeName = truncateWithEllipsis(getNameFromProfile(issuee ?? ''), 25);
    const issuerImage = getImageFromProfile(issuer ?? '');
    const issueeImage = getImageFromProfile(issuee ?? '');

    const { credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

    const getImageElement = (
        imageUrl: string,
        alt: string,
        overrideComponent: React.ReactNode | undefined
    ) => {
        if (overrideComponent) return overrideComponent;

        return (
            <img
                className="h-full w-full object-cover select-none"
                src={imageUrl || DefaultFace}
                alt={alt}
            />
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

    const issuerDid = typeof issuer === 'string' ? issuer : issuer.id;

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
                                <span className="created-at text-grayscale-700">{createdAt}</span>
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
    );
};

export default VC2FrontFaceInfo;
