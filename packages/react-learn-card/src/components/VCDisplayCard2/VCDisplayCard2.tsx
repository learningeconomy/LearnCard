import React, { useLayoutEffect, useRef, useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';

import { VCVerificationCheckWithSpinner } from '../VCVerificationCheck/VCVerificationCheck';
import VC2FrontFaceInfo from './VC2FrontFaceInfo';
import VC2BackFace from './VC2BackFace';
import RibbonEnd from './RibbonEnd';
import FitText from './FitText';
import AwardRibbon from '../svgs/AwardRibbon';
import LeftArrow from '../svgs/LeftArrow';
import RoundedX from '../svgs/RoundedX';
import VCDisplayCardCategoryType from './VCDisplayCardCategoryType';
import VCDisplayCardSkillsCount from './VCDisplayCardSkillsCount';
import VCIDDisplayCard from './VCIDDIsplayCard';

import { Profile, VC, VerificationItem, VerificationStatusEnum } from '@learncard/types';
import {
    getColorForVerificationStatus,
    getInfoFromCredential,
} from '../../helpers/credential.helpers';
import {
    BoostAchievementCredential,
    IssueHistory,
    LCCategoryEnum,
    MediaMetadata,
    VideoMetadata,
} from '../../types';
import { CertificateDisplayCard } from '../CertificateDisplayCard';

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
    subjectDID?: string;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    verificationInProgress?: boolean;
    // convertTagsToSkills?: (tags: string[]) => { [skill: string]: string[] };
    handleXClick?: () => void;
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    bottomRightIcon?: CredentialIconType;
    customFooterComponent?: React.ReactNode;
    customBodyCardComponent?: React.ReactNode;
    customThumbComponent?: React.ReactNode;
    customDescription?: React.ReactNode;
    customCriteria?: React.ReactNode;
    customIssueHistoryComponent?: React.ReactNode;
    issueHistory?: IssueHistory[];
    titleOverride?: string;
    showBackButton?: boolean;
    enableLightbox?: boolean;
    customRibbonCategoryComponent?: React.ReactNode;
    customFrontButton?: React.ReactNode;
    trustedAppRegistry?: any[];
    hideIssueDate?: boolean;
    onDotsClick?: () => void;
    customSkillsComponent?: React.ReactNode;
    isFrontOverride?: boolean;
    setIsFrontOverride?: (value: boolean) => void;
    hideNavButtons?: boolean;
    hideQRCode?: boolean;
    qrCodeOnClick?: () => void; // exclusive to the ID display type
    showDetailsBtn?: boolean;
    customIDDescription?: React.ReactNode;
    hideGradientBackground?: boolean;
};

export const VCDisplayCard2: React.FC<VCDisplayCard2Props> = ({
    categoryType,
    credential,
    verificationItems,
    issueeOverride,
    issuerOverride,
    subjectDID,
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
    customCriteria,
    customDescription,
    customIssueHistoryComponent,
    issueHistory,
    titleOverride,
    showBackButton = true,
    enableLightbox,
    customRibbonCategoryComponent,
    customFrontButton,
    trustedAppRegistry,
    hideIssueDate,
    onDotsClick,
    customSkillsComponent,
    isFrontOverride,
    setIsFrontOverride,
    hideNavButtons,
    hideQRCode = false,
    qrCodeOnClick,
    showDetailsBtn = false,
    customIDDescription,
    hideGradientBackground = false,
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

    const [_isFront, _setIsFront] = useState(isFrontOverride ?? true);
    const isFront = isFrontOverride ?? _isFront;
    const setIsFront = setIsFrontOverride ?? _setIsFront;

    const [headerHeight, setHeaderHeight] = useState(100); // 79 is the height if the header is one line
    const [headerWidth, setHeaderWidth] = useState(0);

    const headerRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        // Needs a small setTimeout otherwise it'll be wrong sometimes with multiline header.
        //   Probably because of the interaction with FitText
        setTimeout(() => {
            setHeaderHeight(headerRef.current?.clientHeight ?? 100);
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
        backgroundColor: credential?.display?.backgroundColor,
        backgroundImage: credential?.display?.backgroundImage
            ? `linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.25)), url(${credential.display?.backgroundImage})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    const _title = titleOverride || title;

    if (credential?.display?.displayType === 'certificate') {
        return (
            <CertificateDisplayCard
                credential={credential}
                categoryType={categoryType}
                issueeOverride={issuee}
                issuerOverride={issuer}
                verificationItems={verificationItems}
                getFileMetadata={getFileMetadata}
                getVideoMetadata={getVideoMetadata}
                onMediaAttachmentClick={onMediaAttachmentClick}
                enableLightbox={enableLightbox}
                trustedAppRegistry={trustedAppRegistry}
                handleXClick={handleXClick}
                subjectImageComponent={subjectImageComponent}
                issuerImageComponent={issuerImageComponent}
                customBodyCardComponent={customBodyCardComponent}
                hideIssueDate={hideIssueDate}
                onDotsClick={onDotsClick}
                isFrontOverride={isFrontOverride}
                setIsFrontOverride={setIsFrontOverride}
                hideNavButtons={hideNavButtons}
                showBackButton={showBackButton}
                showDetailsBtn={showDetailsBtn}
            />
        );
    } else if (credential?.display?.displayType === 'id' || categoryType === 'ID') {
        return (
            <div>
                <VCIDDisplayCard
                    credential={credential}
                    verificationItems={verificationItems}
                    getFileMetadata={getFileMetadata}
                    getVideoMetadata={getVideoMetadata}
                    onMediaAttachmentClick={onMediaAttachmentClick}
                    customThumbComponent={customThumbComponent}
                    customCriteria={customCriteria}
                    customDescription={customDescription}
                    customIssueHistoryComponent={customIssueHistoryComponent}
                    issueHistory={issueHistory}
                    enableLightbox={enableLightbox}
                    trustedAppRegistry={trustedAppRegistry}
                    customSkillsComponent={customSkillsComponent}
                    isFrontOverride={isFrontOverride}
                    setIsFrontOverride={setIsFrontOverride}
                    hideNavButtons={hideNavButtons}
                    hideQRCode={hideQRCode}
                    qrCodeOnClick={qrCodeOnClick}
                    showBackButton={showBackButton}
                    showDetailsBtn={showDetailsBtn}
                    customIDDescription={customIDDescription}
                    hideGradientBackground={hideGradientBackground}
                />
            </div>
        );
    }

    return (
        <Flipper className="w-full" flipKey={isFront}>
            <Flipped flipId="card">
                <section className="vc-display-card font-mouse flex flex-col items-center border-solid border-[5px] border-white rounded-[30px] z-10 min-h-[800px] max-w-[400px] relative bg-white shadow-3xl">
                    <RibbonEnd
                        side="left"
                        className="absolute left-[-30px] top-[50px] z-0"
                        height={'100'}
                    />
                    <RibbonEnd
                        side="right"
                        className="absolute right-[-30px] top-[50px] z-0"
                        height={'100'}
                    />

                    <h1
                        ref={headerRef}
                        className="vc-card-header px-[20px] pb-[10px] pt-[3px] overflow-visible mt-[40px] absolute text-center bg-white border-y-[5px] border-[#EEF2FF] shadow-bottom w-[calc(100%_+_16px)] rounded-t-[8px] z-50"
                        style={{ wordBreak: 'break-word' }}
                    >
                        {customRibbonCategoryComponent && customRibbonCategoryComponent}
                        {!customRibbonCategoryComponent && (
                            <VCDisplayCardCategoryType categoryType={categoryType} />
                        )}

                        <FitText
                            text={_title ?? ''}
                            maxFontSize={32}
                            minFontSize={20}
                            width={((headerWidth ?? 290) - 40).toString()}
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

                    <div
                        className="relative pt-[114px] vc-card-content-container flex flex-col items-center grow min-h-0 w-full rounded-t-[30px] bg-[#353E64] rounded-b-[200px]"
                        style={backgroundStyle}
                    >
                        {/* 
                    div in a div here so that we can have an outer scroll container with an inner container
                    that has a rounded bottom at the bottom of the scrollable content 
                */}
                        <Flipped flipId="scroll-container">
                            <div className="vc-card-content-scroll-container w-full pt-[20px] min-h-full flex flex-col justify-start items-center rounded-t-[30px] rounded-b-[200px] scrollbar-hide pb-[50px]">
                                {isFront && (
                                    <Flipped flipId="face">
                                        <VC2FrontFaceInfo
                                            issuee={issuee}
                                            subjectDID={subjectDID}
                                            issuer={issuer}
                                            title={title}
                                            subjectImageComponent={subjectImageComponent}
                                            issuerImageComponent={issuerImageComponent}
                                            customBodyCardComponent={customBodyCardComponent}
                                            customThumbComponent={customThumbComponent}
                                            createdAt={createdAt ?? ''}
                                            imageUrl={imageUrl}
                                        />
                                    </Flipped>
                                )}
                                {!isFront && (
                                    <Flipped flipId="face">
                                        <VC2BackFace
                                            credential={credential}
                                            verificationItems={verificationItems}
                                            // convertTagsToSkills={convertTagsToSkills}
                                            issueHistory={issueHistory}
                                            getFileMetadata={getFileMetadata}
                                            getVideoMetadata={getVideoMetadata}
                                            onMediaAttachmentClick={onMediaAttachmentClick}
                                            showBackButton={
                                                (showBackButton && !hideNavButtons) ||
                                                showDetailsBtn
                                            }
                                            showFrontFace={() => setIsFront(true)}
                                            customDescription={customDescription}
                                            customCriteria={customCriteria}
                                            customIssueHistoryComponent={
                                                customIssueHistoryComponent
                                            }
                                            enableLightbox={enableLightbox}
                                            customSkillsComponent={customSkillsComponent}
                                        />
                                    </Flipped>
                                )}

                                {isFront && (
                                    <VCDisplayCardSkillsCount
                                        skills={credential?.skills}
                                        onClick={() => setIsFront(!isFront)}
                                    />
                                )}

                                {(!hideNavButtons || showDetailsBtn) && (
                                    <>
                                        {isFront && customFrontButton}
                                        {((isFront && !customFrontButton) ||
                                            (isFront && showDetailsBtn)) && (
                                            <Flipped flipId="details-back-button">
                                                <button
                                                    type="button"
                                                    className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[40px] w-fit select-none"
                                                    onClick={() => setIsFront(!isFront)}
                                                >
                                                    Details
                                                </button>
                                            </Flipped>
                                        )}
                                        {!isFront && (
                                            <Flipped flipId="details-back-button">
                                                <button
                                                    type="button"
                                                    className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[40px] w-fit select-none"
                                                    onClick={() => setIsFront(!isFront)}
                                                >
                                                    <span className="flex gap-[10px] items-center">
                                                        <LeftArrow />
                                                        Back
                                                    </span>
                                                </button>
                                            </Flipped>
                                        )}
                                    </>
                                )}
                            </div>
                        </Flipped>
                    </div>
                    <footer className="vc-card-footer w-full flex justify-between p-[5px] mt-[5px]">
                        {customFooterComponent && customFooterComponent}
                        {!customFooterComponent && (
                            <>
                                {worstVerificationStatus === VerificationStatusEnum.Failed ? (
                                    <div className="w-[40px]" role="presentation" />
                                ) : (
                                    <VCVerificationCheckWithSpinner
                                        spinnerSize="40px"
                                        size={'32px'}
                                        loading={verificationInProgress}
                                    />
                                )}
                                <div className="vc-footer-text font-montserrat flex flex-col items-center justify-center text-[12px] font-[700] leading-[15px] select-none">
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
            </Flipped>
        </Flipper>
    );
};

export default VCDisplayCard2;
