import React, { useLayoutEffect, useState, useRef } from 'react';

import { VCVerificationCheckWithSpinner } from '../VCVerificationCheck/VCVerificationCheck';
import VC2FrontFaceInfo from './VC2FrontFaceInfo';
import VC2BackFace from './VC2BackFace';
import RibbonEnd from './RibbonEnd';
import FitText from './FitText';
import AwardRibbon from '../svgs/AwardRibbon';
import LeftArrow from '../svgs/LeftArrow';
import RoundedX from '../svgs/RoundedX';

import { VC, VerificationItem, VerificationStatusEnum, Profile } from '@learncard/types';
import {
    getColorForVerificationStatus,
    getInfoFromCredential,
} from '../../helpers/credential.helpers';
import { BoostAchievementCredential } from '../../types'; // TODO should be a way to get this from @learncard/types (probs will work after fixing type errors)
import { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';

export type VCDisplayCard2Props = {
    credential: VC | BoostAchievementCredential;
    verificationItems: VerificationItem[];
    issueeOverride?: Profile;
    issuerOverride?: Profile;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    verificationInProgress?: boolean;
    // convertTagsToSkills?: (tags: string[]) => { [skill: string]: string[] };
    handleXClick?: () => void;
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string) => void;
};

export const VCDisplayCard2: React.FC<VCDisplayCard2Props> = ({
    credential,
    verificationItems,
    issueeOverride,
    issuerOverride,
    subjectImageComponent,
    issuerImageComponent,
    verificationInProgress = false,
    // convertTagsToSkills,
    handleXClick,
    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
}) => {
    const {
        title,
        createdAt,
        issuer: _issuer,
        issuee: _issuee,
        credentialSubject,
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy');
    const issuee = issueeOverride || _issuee;
    const issuer = issuerOverride || _issuer;

    const [isFront, setIsFront] = useState(true);
    const [headerHeight, setHeaderHeight] = useState(44); // 44 is the height if the header is one line
    const [headerWidth, setHeaderWidth] = useState(0);

    const headerRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        // Needs a small setTimeout otherwise it'll be wrong sometimes with multiline header.
        //   Probably because of the interaction with FitText
        setTimeout(() => {
            setHeaderHeight(headerRef.current?.clientHeight ?? 44);
            setHeaderWidth(headerRef.current?.clientWidth ?? 0);
        }, 10);
    });

    let worstVerificationStatus = verificationItems.reduce(
        (
            currentWorst: typeof VerificationStatusEnum[keyof typeof VerificationStatusEnum],
            verification
        ) => {
            switch (currentWorst) {
                case VerificationStatusEnum.Success:
                    return verification.status;
                case VerificationStatusEnum.Error:
                    return verification.status === VerificationStatusEnum.Failed
                        ? verification.status
                        : currentWorst;
                case VerificationStatusEnum.Failed:
                    return currentWorst;
            }
        },
        VerificationStatusEnum.Success
    );

    const statusColor = getColorForVerificationStatus(worstVerificationStatus);

    return (
        <section className="font-mouse flex flex-col items-center border-solid border-[5px] border-white h-[700px] rounded-[30px] overflow-visible z-10 max-w-[400px] relative bg-white">
            <RibbonEnd
                side="left"
                className="absolute left-[-30px] top-[50px] z-0"
                height={(headerHeight + 10).toString()}
            />
            <RibbonEnd
                side="right"
                className="absolute right-[-30px] top-[50px] z-0"
                height={(headerHeight + 10).toString()}
            />

            <h1
                ref={headerRef}
                className="px-[20px] pb-[10px] pt-[3px] overflow-visible mt-[40px] absolute text-center bg-white border-y-[5px] border-[#EEF2FF] shadow-bottom w-[calc(100%_+_16px)] rounded-t-[8px] z-50"
                style={{ wordBreak: 'break-word' }}
            >
                <span className="uppercase text-spice-500 font-poppins text-[12px] font-[600] leading-[12px]">
                    Achievement
                </span>
                <FitText
                    text={title ?? ''}
                    width={((headerWidth ?? 290) - 40).toString()}
                    options={{ maxSize: 32, minSize: 20, multiLine: true }}
                    className="text-[#18224E] leading-[100%] text-shadow text-[32px]"
                />
            </h1>

            {isFront && handleXClick && (
                <button
                    className="absolute top-[-25px] bg-white rounded-full h-[50px] w-[50px] flex items-center justify-center z-50"
                    onClick={handleXClick}
                >
                    <RoundedX />
                </button>
            )}

            {!isFront && (
                <button
                    className="absolute top-[-25px] bg-white rounded-full h-[50px] px-[15px] flex items-center justify-center gap-[5px] z-50 text-[30px] text-grayscale-900"
                    onClick={() => setIsFront(true)}
                >
                    <LeftArrow color="#18224E" size="25" />
                    Details
                </button>
            )}

            <div className="flex flex-col items-center grow w-full rounded-t-[30px] rounded-b-[20px] overflow-scroll scrollbar-hide">
                {/* 
                    div in a div here so that we can have an outer scroll container with an inner container
                    that has a rounded bottom at the bottom of the scrollable content 
                */}
                <div
                    className="w-full flex flex-col justify-center items-center rounded-b-[200px] bg-[#353E64] pb-[50px]"
                    style={{
                        paddingTop: headerHeight + 70,
                        backgroundColor: credential.display?.backgroundColor,
                        backgroundImage: credential.display?.backgroundImage
                            ? `url(${credential.display?.backgroundImage})`
                            : undefined,
                        backgroundSize: 'contain',
                    }}
                >
                    {isFront && (
                        <VC2FrontFaceInfo
                            issuee={issuee}
                            issuer={issuer}
                            title={title}
                            subjectImageComponent={subjectImageComponent}
                            issuerImageComponent={issuerImageComponent}
                            createdAt={createdAt}
                            imageUrl={imageUrl}
                        />
                    )}
                    {!isFront && (
                        <VC2BackFace
                            credential={credential}
                            verificationItems={verificationItems}
                            // convertTagsToSkills={convertTagsToSkills}
                            getFileMetadata={getFileMetadata}
                            getVideoMetadata={getVideoMetadata}
                            onMediaAttachmentClick={onMediaAttachmentClick}
                        />
                    )}
                    <button
                        type="button"
                        className="text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[40px] w-fit"
                        onClick={() => setIsFront(!isFront)}
                    >
                        {isFront && 'Details'}
                        {!isFront && (
                            <span className="flex gap-[10px] items-center">
                                <LeftArrow />
                                Back
                            </span>
                        )}
                    </button>
                </div>
            </div>
            <footer className="w-full flex justify-between p-[5px] mt-[5px]">
                <VCVerificationCheckWithSpinner
                    spinnerSize="40px"
                    size={'32px'}
                    loading={verificationInProgress}
                />
                <div className="font-montserrat flex flex-col items-center justify-center text-[12px] font-[700] leading-[15px]">
                    <span className="text-[#4F4F4F]">Verified Credential</span>
                    <span className="uppercase" style={{ color: statusColor }}>
                        {worstVerificationStatus}
                    </span>
                </div>
                <AwardRibbon className="bg-[#6366F1] rounded-[20px] h-[40px] w-[40px] flex items-center justify-center p-[5px]" />
            </footer>
        </section>
    );
};

export default VCDisplayCard2;