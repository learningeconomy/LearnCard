import React from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';

import IDIcon from '../svgs/IDIcon';
import IDSleeve from '../../assets/images/id-sleeve.png';
import QRCodeIcon from '../svgs/QRCodeIcon';
import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';

import { getInfoFromCredential } from '../../helpers/credential.helpers';

import { VC } from '@learncard/types';
import { BoostAchievementCredential } from '../../types';
import TruncateTextBox from './TruncateTextBox';
import { KnownDIDRegistryType } from '../../types';

type VCIDDisplayFrontFaceProps = {
    isFront: boolean;
    setIsFront: (value: boolean) => void;
    showDetailsBtn?: boolean;
    credential: VC | BoostAchievementCredential;
    knownDIDRegistry?: KnownDIDRegistryType;
    customThumbComponent?: React.ReactNode;
    hideQRCode?: boolean;
    qrCodeOnClick?: () => void;
    customIDDescription?: React.ReactNode;
};

const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    untrustedVerifier: 'Untrusted Issuer',
} as const;
type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

const VCIDDisplayFrontFace: React.FC<VCIDDisplayFrontFaceProps> = ({
    isFront,
    setIsFront,
    showDetailsBtn,
    credential,
    knownDIDRegistry,
    customThumbComponent,
    hideQRCode = false,
    qrCodeOnClick,
    customIDDescription,
}) => {
    const { credentialSubject } = getInfoFromCredential(credential, 'MMM dd, yyyy', {
        uppercaseDate: false,
    });

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

    const achievement =
        'achievement' in credential?.credentialSubject
            ? credential?.credentialSubject?.achievement
            : undefined;
    const description = achievement?.description;

    return (
        <Flipper className="w-full" flipKey={isFront}>
            <Flipped flipId="face">
                <section className="vc-front-face w-full flex flex-col items-center gap-[15px]">
                    {/* <div className="w-[380px] h-[211px] bg-red-300" /> */}

                    <Flipped inverseFlipId="face">
                        {customThumbComponent && customThumbComponent}
                    </Flipped>

                    <Flipped inverseFlipId="face">
                        <div className="text-white w-full flex items-center justify-center font-poppins">
                            <IDIcon className="text-white mr-1" /> ID
                        </div>
                    </Flipped>

                    <Flipped inverseFlipId="face">
                        <div className="w-full relative">
                            {!hideQRCode && (
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        qrCodeOnClick?.();
                                    }}
                                    className="text-grayscale-900 bg-white rounded-full p-[10px] absolute top-[-10px] right-[45%]"
                                >
                                    <QRCodeIcon className="text-grayscale-900 " />
                                </button>
                            )}
                            <img src={IDSleeve} alt="id-sleeve" className="w-full object-cover" />
                        </div>
                    </Flipped>

                    <Flipped inverseFlipId="face">
                        <div className="w-full bg-white relative mt-[-70px] px-6 pb-4 pt-4">
                            {description && !customIDDescription && (
                                <>
                                    <TruncateTextBox
                                        text={description}
                                        className="description-box"
                                        containerClassName="!p-0 !shadow-none !text-center !w-full"
                                        textClassName="!font-poppins !text-base !text-grayscale-700 !text-center !w-full"
                                        truncateThreshold={204}
                                    />
                                </>
                            )}

                            {customIDDescription && customIDDescription}

                            {isFront && showDetailsBtn && (
                                <button
                                    type="button"
                                    className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[25px] w-fit select-none"
                                    onClick={() => setIsFront(!isFront)}
                                >
                                    Details
                                </button>
                            )}

                            <div className="w-full flex items-center justify-center mt-4">
                                <div className="h-[2px] w-full bg-gray-200" />
                            </div>

                            <div className="w-full flex items-center justify-center mt-2">
                                {isSelfVerified && (
                                    <span className="uppercase font-poppins text-base font-[500] text-green-dark flex gap-[3px] items-center">
                                        <PersonBadge className="w-[20px] h-[20px]" />
                                        Self Issued
                                    </span>
                                )}
                                {verifierState === VERIFIER_STATES.trustedVerifier && (
                                    <span className="uppercase font-poppins text-base font-[500] text-blue-light flex gap-[3px] items-center">
                                        <VerifiedBadge className="w-[20px] h-[20px]" />
                                        Trusted Issuer
                                    </span>
                                )}
                                {verifierState === VERIFIER_STATES.unknownVerifier && (
                                    <span className="uppercase font-poppins text-base font-[500] text-orange-500 flex gap-[3px] items-center">
                                        <UnknownVerifierBadge className="w-[20px] h-[20px]" />
                                        Unknown Issuer
                                    </span>
                                )}
                                {verifierState === VERIFIER_STATES.untrustedVerifier && (
                                    <span className="uppercase font-poppins text-base font-[500] text-red-mastercard flex gap-[3px] items-center">
                                        <RedFlag className="w-[20px] h-[20px]" />
                                        Untrusted Issuer
                                    </span>
                                )}
                            </div>
                        </div>
                    </Flipped>
                </section>
            </Flipped>
        </Flipper>
    );
};

export default VCIDDisplayFrontFace;
