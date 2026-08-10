import React from 'react';
import { Flipper, Flipped as UntypedFlipped } from 'react-flip-toolkit';

import IDIcon from '../svgs/IDIcon';
import IDSleeve from '../../assets/images/id-sleeve.png';
import QRCodeIcon from '../svgs/QRCodeIcon';

import type { IssuerContext, VC } from '@learncard/types';
import { BoostAchievementCredential } from '../../types';
import TruncateTextBox from './TruncateTextBox';
import VerifierStateBadgeAndText from '../CertificateDisplayCard/VerifierStateBadgeAndText';

type FlippedComponentProps = React.PropsWithChildren<{
    flipId?: string;
    inverseFlipId?: string;
    scale?: boolean;
}>;

const Flipped = UntypedFlipped as unknown as React.FC<FlippedComponentProps>;

type VCIDDisplayFrontFaceProps = {
    isFront: boolean;
    setIsFront: (value: boolean) => void;
    showDetailsBtn?: boolean;
    credential: VC | BoostAchievementCredential;
    issuerContext?: IssuerContext;
    issuerLabel?: string;
    customThumbComponent?: React.ReactNode;
    hideQRCode?: boolean;
    qrCodeOnClick?: () => void;
    customIDDescription?: React.ReactNode;
    onVerifierClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const VCIDDisplayFrontFace: React.FC<VCIDDisplayFrontFaceProps> = ({
    isFront,
    setIsFront,
    showDetailsBtn,
    credential,
    issuerContext,
    issuerLabel,
    customThumbComponent,
    hideQRCode = false,
    qrCodeOnClick,
    customIDDescription,
    onVerifierClick,
}) => {
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

                    <Flipped inverseFlipId="face">{customThumbComponent}</Flipped>

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
                                    className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[24px] py-[8px] rounded-[40px] text-[16px] font-poppins font-medium leading-normal mt-[25px] w-fit select-none"
                                    onClick={() => setIsFront(!isFront)}
                                >
                                    Details
                                </button>
                            )}

                            <div className="w-full flex items-center justify-center mt-4">
                                <div className="h-[2px] w-full bg-gray-200" />
                            </div>

                            {issuerContext && issuerLabel && (
                                <div className="w-full flex items-center justify-center mt-2">
                                    <VerifierStateBadgeAndText
                                        issuerContext={issuerContext}
                                        label={issuerLabel}
                                        onClick={onVerifierClick}
                                    />
                                </div>
                            )}
                        </div>
                    </Flipped>
                </section>
            </Flipped>
        </Flipper>
    );
};

export default VCIDDisplayFrontFace;
