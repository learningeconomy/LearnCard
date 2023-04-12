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
import { BoostAchievementCredential, IssueHistory, LCCategoryEnum } from '../../types';
import { MediaMetadata, VideoMetadata } from './MediaAttachmentsBox';
import VCDisplayCardCategoryType from './VCDisplayCardCategoryType';

export type CredentialIconType = {
    image?: React.ReactNode;
    color?: string;
};

export type VCDisplayCard2Props = {
    categoryType?: LCCategoryEnum;
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
    bottomRightIcon?: CredentialIconType;
    customFooterComponent?: React.ReactNode;
    customBodyCardComponent?: React.ReactNode;
    customThumbComponent?: React.ReactNode;
    issueHistory?: IssueHistory[];
    titleOverride?: string;
    showBackButton?: boolean;
};

export const VCDisplayCard2: React.FC<VCDisplayCard2Props> = ({
    categoryType,
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
    bottomRightIcon,
    customFooterComponent,
    customBodyCardComponent,
    customThumbComponent,
    issueHistory,
    titleOverride,
    showBackButton = true,
}) => {
    const {
        title = '',
        createdAt,
        issuer: _issuer = '',
        issuee: _issuee = '',
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy');
    const issuee = issueeOverride || _issuee;
    const issuer = issuerOverride || _issuer;

    const [isFront, setIsFront] = useState(true);
    const [headerHeight, setHeaderHeight] = useState(79); // 79 is the height if the header is one line
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
            currentWorst: (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum],
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

    const backgroundStyle = {
        backgroundColor: credential.display?.backgroundColor,
        backgroundImage: credential.display?.backgroundImage
            ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.25)), url(${credential.display?.backgroundImage})`
            : undefined,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    const _title = titleOverride || title;

    return (
        <section className="vc-display-card font-mouse flex flex-col items-center border-solid border-[5px] border-white rounded-[30px] overflow-visible z-10 max-w-[400px] relative bg-white shadow-3xl">
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
                className="vc-card-header px-[20px] pb-[10px] pt-[3px] overflow-visible mt-[40px] absolute text-center bg-white border-y-[5px] border-[#EEF2FF] shadow-bottom w-[calc(100%_+_16px)] rounded-t-[8px] z-50"
                style={{ wordBreak: 'break-word' }}
            >
                <VCDisplayCardCategoryType categoryType={categoryType} />
                <FitText
                    text={_title ?? ''}
                    width={((headerWidth ?? 290) - 40).toString()}
                    options={{ maxSize: 32, minSize: 20, multiLine: true }}
                    className="vc-card-header-main-title text-[#18224E] leading-[100%] text-shadow text-[32px]"
                />
            </h1>

            {isFront && handleXClick && (
                <button
                    className="vc-card-x-button absolute top-[-25px] bg-white rounded-full h-[50px] w-[50px] flex items-center justify-center z-50"
                    onClick={handleXClick}
                >
                    <RoundedX />
                </button>
            )}

            {/* Hide content so that it doesn't appear above the header when it scrolls */}
            <div
                className="vc-card-background-hider absolute h-[40px] w-full z-20 flex grow rounded-t-[30px] "
                style={backgroundStyle}
            />

            <div className="vc-card-content-container flex flex-col items-center grow w-full rounded-t-[30px] rounded-b-[20px] overflow-scroll scrollbar-hide">
                {/* 
                    div in a div here so that we can have an outer scroll container with an inner container
                    that has a rounded bottom at the bottom of the scrollable content 
                */}
                <div
                    className="vc-card-content-scroll-container w-full flex flex-col justify-center items-center rounded-b-[200px] bg-[#353E64] pb-[50px]"
                    style={{ paddingTop: headerHeight + 70, ...backgroundStyle }}
                >
                    {isFront && (
                        <VC2FrontFaceInfo
                            issuee={issuee}
                            issuer={issuer}
                            title={title}
                            subjectImageComponent={subjectImageComponent}
                            issuerImageComponent={issuerImageComponent}
                            customBodyCardComponent={customBodyCardComponent}
                            customThumbComponent={customThumbComponent}
                            createdAt={createdAt ?? ''}
                            imageUrl={imageUrl}
                        />
                    )}
                    {!isFront && (
                        <VC2BackFace
                            credential={credential}
                            verificationItems={verificationItems}
                            // convertTagsToSkills={convertTagsToSkills}
                            issueHistory={issueHistory}
                            getFileMetadata={getFileMetadata}
                            getVideoMetadata={getVideoMetadata}
                            onMediaAttachmentClick={onMediaAttachmentClick}
                            showBackButton={showBackButton}
                            showFrontFace={() => setIsFront(true)}
                        />
                    )}
                    <button
                        type="button"
                        className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[40px] w-fit"
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
            <footer className="vc-card-footer w-full flex justify-between p-[5px] mt-[5px]">
                {customFooterComponent && customFooterComponent}
                {!customFooterComponent && (
                    <>
                        <VCVerificationCheckWithSpinner
                            spinnerSize="40px"
                            size={'32px'}
                            loading={verificationInProgress}
                        />
                        <div className="vc-footer-text font-montserrat flex flex-col items-center justify-center text-[12px] font-[700] leading-[15px]">
                            <span className="text-[#4F4F4F]">Verified Credential</span>
                            <span
                                className="vc-footer-status uppercase"
                                style={{ color: statusColor }}
                            >
                                {worstVerificationStatus}
                            </span>
                        </div>
                        <div
                            className="vc-footer-icon rounded-[20px] h-[40px] w-[40px] flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: bottomRightIcon?.color ?? '#6366F1' }}
                        >
                            {bottomRightIcon?.image ?? <AwardRibbon />}
                        </div>
                    </>
                )}
            </footer>
        </section>
    );
};

export default VCDisplayCard2;
