import React, { useState } from 'react';
import { getInfoFromCredential } from '../../helpers/credential.helpers';
import { VC, VerificationStatusEnum } from '@learncard/types';
import { TYPE_TO_WALLET_DARK_COLOR } from '../../constants';
import { BoostAchievementCredential } from '../../types';
import CertificateImageDisplay from './CertificateImageDisplay';

type CertificateDisplayCardProps = {
    credential: VC | BoostAchievementCredential;
};

export const CertificateDisplayCard: React.FC<CertificateDisplayCardProps> = ({ credential }) => {
    console.log('🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆🎆 CertificateDisplayCard');
    console.log('credential:', credential);
    const [isFront, setIsFront] = useState(true);

    const {
        title = '',
        createdAt,
        issuer = '',
        issuee = '',
        credentialSubject,
        imageUrl,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy');

    const { description, type } = credentialSubject.achievement ?? {};

    const credentialType = type?.[0];

    console.log('credentialSubject:', credentialSubject);

    // console.log('🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧');
    // console.log('TYPE_TO_WALLET_DARK_COLOR:', TYPE_TO_WALLET_DARK_COLOR);
    // console.log('credentialType:', credentialType);
    // console.log(
    //     'TYPE_TO_WALLET_DARK_COLOR[credentialType]:',
    //     TYPE_TO_WALLET_DARK_COLOR[credentialType]
    // );

    // const credentialPrimaryColor = TYPE_TO_WALLET_DARK_COLOR[credentialType] ?? 'emerald-500';
    const credentialPrimaryColor = 'emerald-500';

    return (
        <section className="border-solid border-[5px] border-grayscale-200 bg-white rounded-[30px] p-[13px] relative">
            <div className="w-[calc(100%-26px)] absolute top-[-52px]">
                <CertificateImageDisplay
                    imageUrl={imageUrl ?? ''}
                    className="mx-auto"
                    ribbonColor={credentialPrimaryColor}
                />
            </div>

            <div
                className={`flex flex-col gap-[15px] items-center p-[20px] !pt-[75px] border-solid border-[4px] border-${credentialPrimaryColor} rounded-[30px]`}
            >
                <div className="flex flex-col gap-[5px] items-center">
                    <div
                        className={`text-${credentialPrimaryColor} uppercase text-[14px] font-poppins`}
                    >
                        {credentialType}
                    </div>

                    <h1 className="text-grayscale-900 text-center text-[20px]">{title}</h1>
                </div>

                <img
                    className="h-[50px] w-[50px] rounded-full"
                    src="https://imgs.search.brave.com/mR-qTglzpGl8uw83n_ErbMNuZKXcqnfulrRGN17nsn0/rs:fit:860:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJzLmNvbS9p/bWFnZXMvZmVhdHVy/ZWQvY29vbC1wcm9m/aWxlLXBpY3R1cmUt/ODdoNDZnY29iamw1/ZTR4dS5qcGc"
                />

                <div>
                    Awarded to {issuee || '[No Issuee Name]'} on {createdAt}
                </div>

                <div className="flex flex-col gap-[10px] items-center">
                    {description && <div>{description}</div>}

                    <div>+2 Skills</div>
                </div>

                <div className="flex flex-col gap-[5px] items-center">
                    <span>Certified by</span>
                    <span className="mb-[3px]">{issuer || 'Someone'}</span>
                    <span className="uppercase">Trusted Verifier</span>
                </div>
            </div>

            {/* isFront && handleXClick && (
                <button
                    className="vc-card-x-button absolute top-[-25px] bg-white rounded-full h-[50px] w-[50px] flex items-center justify-center z-50"
                    onClick={handleXClick}
                >
                    <RoundedX />
                </button>
            ) */}

            {/* Hide content so that it doesn't appear above the header when it scrolls */}
            {/* <div
                className="vc-card-background-hider absolute h-[40px] w-full z-20 flex grow rounded-t-[30px] "
                style={backgroundStyle}
            /> */}

            {/* <div className="vc-card-content-container flex flex-col items-center grow w-full rounded-t-[30px] rounded-b-[20px] overflow-scroll scrollbar-hide"> */}
            {/* 
                    div in a div here so that we can have an outer scroll container with an inner container
                    that has a rounded bottom at the bottom of the scrollable content 
                */}
            {/* <div
                    className="vc-card-content-scroll-container w-full flex flex-col justify-center items-center rounded-b-[200px] bg-[#353E64] pb-[50px]"
                    style={{ paddingTop: '170px', ...backgroundStyle }}
                >
                    {isFront && (
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
                            customDescription={customDescription}
                            customCriteria={customCriteria}
                            customIssueHistoryComponent={customIssueHistoryComponent}
                            enableLightbox={enableLightbox}
                        />
                    )}
                    {isFront && customFrontButton}
                    {isFront && !customFrontButton && (
                        <button
                            type="button"
                            className="vc-toggle-side-button text-white shadow-bottom bg-[#00000099] px-[30px] py-[8px] rounded-[40px] text-[28px] tracking-[0.75px] uppercase leading-[28px] mt-[40px] w-fit select-none"
                            onClick={() => setIsFront(!isFront)}
                        >
                            Details
                        </button>
                    )}
                    {!isFront && (
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
                    )}
                </div> */}
            {/* </div> */}
            {/* <footer className="vc-card-footer w-full flex justify-between p-[5px] mt-[5px]">
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
            </footer> */}
        </section>
    );
};

export default CertificateDisplayCard;
