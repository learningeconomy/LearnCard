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
import VCIDDisplayFrontFace from './VCIDDisplayFrontFace';
import { CredentialIconType } from './VCDisplayCard2';

export type VCIDDisplayCardProps = {
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
};

export const VCIDDisplayCard: React.FC<VCIDDisplayCardProps> = ({
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

    return (
        <Flipper className="w-full" flipKey={isFront}>
            <Flipped flipId="card">
                <section
                    className={`vc-display-card font-mouse flex flex-col items-center border-solid border-white rounded-[30px] z-10 max-w-[400px] relative bg-white shadow-3xl ${
                        isFront ? '' : 'min-h-[800px]'
                    }`}
                >
                    <div
                        className="relative vc-card-content-container flex flex-col items-center grow min-h-0 w-full rounded-t-[30px] rounded-b-[30px] bg-yellow-300 overflow-hidden"
                        style={backgroundStyle}
                    >
                        <Flipped flipId="scroll-container">
                            <div className="vc-card-content-scroll-container w-full min-h-full flex flex-col justify-start items-center rounded-t-[30px] rounded-b-[30px]  scrollbar-hide pt-[20px]">
                                {isFront && (
                                    <Flipped flipId="face">
                                        <VCIDDisplayFrontFace
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
                                            showBackButton={showBackButton && !hideNavButtons}
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

                                {!hideNavButtons && (
                                    <>
                                        {isFront && customFrontButton}
                                        {isFront && !customFrontButton && (
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
                </section>
            </Flipped>
        </Flipper>
    );
};

export default VCIDDisplayCard;
