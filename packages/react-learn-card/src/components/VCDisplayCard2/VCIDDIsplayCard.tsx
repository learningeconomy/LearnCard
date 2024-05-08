import React, { useState } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';

import VC2BackFace from './VC2BackFace';
import VCIDDisplayFrontFace from './VCIDDisplayFrontFace';

import {
    BoostAchievementCredential,
    IssueHistory,
    MediaMetadata,
    VideoMetadata,
} from '../../types';
import { VC, VerificationItem } from '@learncard/types';

export type VCIDDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
    verificationItems: VerificationItem[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    customThumbComponent?: React.ReactNode;
    customDescription?: React.ReactNode;
    customCriteria?: React.ReactNode;
    customIssueHistoryComponent?: React.ReactNode;
    issueHistory?: IssueHistory[];
    showBackButton?: boolean;
    enableLightbox?: boolean;
    trustedAppRegistry?: any[];
    customSkillsComponent?: React.ReactNode;
    isFrontOverride?: boolean;
    setIsFrontOverride?: (value: boolean) => void;
    hideNavButtons?: boolean;
    qrCodeOnClick?: () => void;
    showDetailsBtn?: boolean;
};

export const VCIDDisplayCard: React.FC<VCIDDisplayCardProps> = ({
    credential,
    verificationItems,
    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    customThumbComponent,
    customCriteria,
    customDescription,
    customIssueHistoryComponent,
    issueHistory,
    showBackButton = true,
    enableLightbox,
    trustedAppRegistry,
    customSkillsComponent,
    isFrontOverride,
    setIsFrontOverride,
    hideNavButtons,
    qrCodeOnClick,
    showDetailsBtn = false,
}) => {
    const [_isFront, _setIsFront] = useState<boolean>(isFrontOverride ?? true);
    const isFront = isFrontOverride ?? _isFront;
    const setIsFront = setIsFrontOverride ?? _setIsFront;

    const backgroundStyle = {
        backgroundColor: 'linear-gradient(180deg, rgba(139,145,167,1) 0%, rgba(24,34,78,1) 100%)',
        backgroundImage: 'linear-gradient(180deg, rgba(139,145,167,1) 0%, rgba(24,34,78,1) 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    return (
        <Flipper className="w-full" flipKey={isFront}>
            <Flipped flipId="card">
                <section
                    className={`vc-display-card font-mouse flex flex-col items-center border-solid border-white rounded-[30px] z-10 max-w-[400px] relative bg-white shadow-3xl ${
                        isFront ? '' : 'min-h-[800px]'
                    }`}
                >
                    <div
                        className="relative vc-card-content-container flex flex-col items-center grow min-h-0 w-full rounded-t-[30px] rounded-b-[30px] overflow-hidden"
                        style={backgroundStyle}
                    >
                        <Flipped flipId="scroll-container">
                            <div className="vc-card-content-scroll-container w-full min-h-full flex flex-col justify-start items-center rounded-t-[30px] rounded-b-[30px]  scrollbar-hide pt-[20px]">
                                {isFront && (
                                    <Flipped flipId="face">
                                        <VCIDDisplayFrontFace
                                            isFront={_isFront}
                                            setIsFront={setIsFront}
                                            showDetailsBtn={showDetailsBtn}
                                            customThumbComponent={customThumbComponent}
                                            credential={credential}
                                            trustedAppRegistry={trustedAppRegistry}
                                            qrCodeOnClick={qrCodeOnClick}
                                        />
                                    </Flipped>
                                )}
                                {!isFront && (
                                    <Flipped flipId="face">
                                        <VC2BackFace
                                            credential={credential}
                                            verificationItems={verificationItems}
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
                            </div>
                        </Flipped>
                    </div>
                </section>
            </Flipped>
        </Flipper>
    );
};

export default VCIDDisplayCard;
