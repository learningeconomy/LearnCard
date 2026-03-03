import React, { useState } from 'react';

import X from '../../../svgs/X';
import { IonFooter } from '@ionic/react';
import OpenSyllabusMetaData from './OpenSyllabusMetaData';
import BoostSideMenuMediaDetails from './BoostSideMenuMediaDetails';
import CredentialIssuerInformation from './CredentialIssuerInformation';
import EndorsementCard from '../../../boost-endorsements/EndorsementCard';
import BoostPreviewTabs from '../../../boost-preview-tabs/BoostPreviewTabs';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import SkillsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/SkillsBox';
import BoostEndorsementDetails from '../../../boost-endorsements/BoostEndorsementDetails';
import EndorsementsList from '../../../boost-endorsements/EndorsementsList/EndorsementsList';
import AlignmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/AlignmentsBox';
import TruncateTextBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/TruncateTextBox';
import VerificationsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/VerificationsBox';
import MediaAttachmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';

import { useGetVCInfo, boostPreviewStore, BoostPreviewTabsEnum } from 'learn-card-base';

import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import {
    CredentialCategoryEnum,
    useModal,
    useDeviceTypeByWidth,
    DisplayTypeEnum,
} from 'learn-card-base';
import { VC, VerificationItem } from '@learncard/types';

type BoostDetailsSideBarProps = {
    credential: VC;
    categoryType?: CredentialCategoryEnum;
    customSkillsComponent?: React.ReactNode;
    verificationItems: VerificationItem[];
    customLinkedCredentialsComponent?: React.ReactNode;
    displayType?: DisplayTypeEnum;
    existingEndorsements?: VC[];
    hideEndorsementRequestCard?: boolean;
    isEarnedBoost?: boolean;
};
const BoostDetailsSideBar: React.FC<BoostDetailsSideBarProps> = ({
    credential,
    categoryType,
    customSkillsComponent,
    verificationItems,
    customLinkedCredentialsComponent,
    displayType,
    existingEndorsements = [],
    hideEndorsementRequestCard = false,
    isEarnedBoost,
}) => {
    const selectedTab = boostPreviewStore.useTracked.selectedTab();

    const { closeModal } = useModal();
    const { createdAt, credentialSubject } = getInfoFromCredential(credential, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });
    const { isMobile } = useDeviceTypeByWidth();

    const { description, criteria, alignment, attachments, title, evidence, skills } = useGetVCInfo(
        credential,
        categoryType
    );

    const isMediaDisplay = displayType === DisplayTypeEnum.Media;

    const credentialVerificationDisplay = (
        <div className="w-full flex items-center justify-start text-sm text-grayscale-600 font-semibold border-t-[1px] border-solid border-grayscale-200 pt-[10px]">
            <CredentialVerificationDisplay
                credential={credential}
                iconClassName="!w-[20px] !h-[20px] mr-1"
                showText
                className="!capitalize !text-grayscale-900 text-sm"
            />
            &nbsp;on {createdAt}
        </div>
    );

    let activeTabDetails = null;
    switch (selectedTab) {
        case BoostPreviewTabsEnum.Details:
            activeTabDetails = (
                <>
                    <TruncateTextBox
                        headerText="Details"
                        subHeaderText={`${isMediaDisplay ? title : 'About'}`}
                        text={description}
                        displayTextBelowChildren={isMediaDisplay}
                        subHeaderTextClassName="text-[17px] text-grayscale-900 font-semibold"
                        credentialVerificationDisplay={
                            isMediaDisplay ? credentialVerificationDisplay : undefined
                        }
                    >
                        {isMediaDisplay && <BoostSideMenuMediaDetails credential={credential} />}

                        {!isMediaDisplay && (
                            <span
                                className={`text-grayscale-600 font-poppins text-[12px] font-[600] w-full ${
                                    description
                                        ? 'pt-[10px] border-t-[1px] border-solid border-grayscale-200'
                                        : ''
                                }`}
                            >
                                Awarded on {createdAt}
                            </span>
                        )}
                    </TruncateTextBox>

                    {criteria && <TruncateTextBox headerText="Criteria" text={criteria} />}

                    <CredentialIssuerInformation credential={credential} />

                    {/* display open syllabus metadata */}
                    <OpenSyllabusMetaData credential={credential} />

                    {!hideEndorsementRequestCard && (
                        <EndorsementCard
                            credential={credential}
                            categoryType={categoryType}
                            existingEndorsements={existingEndorsements}
                        />
                    )}

                    <EndorsementsList
                        credential={credential}
                        categoryType={categoryType}
                        existingEndorsements={existingEndorsements}
                    />

                    {customLinkedCredentialsComponent && customLinkedCredentialsComponent}

                    {(credential?.skills?.length ?? 0) > 0 &&
                        (customSkillsComponent ? (
                            customSkillsComponent
                        ) : (
                            <SkillsBox skills={credential?.skills ?? []} />
                        ))}

                    {((attachments && attachments?.length > 0) ||
                        (credential?.evidence && credential?.evidence?.length > 0)) &&
                        displayType !== DisplayTypeEnum.Media && (
                            <MediaAttachmentsBox
                                attachments={attachments ?? []}
                                evidence={evidence}
                            />
                        )}

                    {alignment && <AlignmentsBox alignment={alignment} style="Certificate" />}

                    {verificationItems && verificationItems?.length > 0 && (
                        <VerificationsBox verificationItems={verificationItems} />
                    )}
                </>
            );
            break;
        case BoostPreviewTabsEnum.Endorsements:
            activeTabDetails = (
                <BoostEndorsementDetails
                    credential={credential}
                    categoryType={categoryType}
                    existingEndorsements={existingEndorsements}
                />
            );
            break;
        default:
            activeTabDetails = null;
            break;
    }

    const handleClose = () => {
        boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Details);
        closeModal();
    };

    return (
        <aside className="bg-white bg-opacity-70 h-full max-w-full min-w-[375px] px-[20px]">
            <div className="overflow-y-auto max-h-[calc(100vh-80px)] mx-auto px-[2px] overflow-x-hidden py-[30px]">
                {isMobile && (
                    <button
                        className="text-grayscale-900 flex items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[10px] bg-white/90 shadow-md mb-[20px]"
                        onClick={handleClose}
                    >
                        <X className="w-[20px]" />
                        Close
                    </button>
                )}
                <section className="flex flex-col gap-[10px] w-[335px] pb-[30%] sm:pb-[20px] mx-auto">
                    <BoostPreviewTabs
                        selectedTab={selectedTab}
                        setSelectedTab={boostPreviewStore.set.updateSelectedTab}
                        isEarnedBoost={isEarnedBoost}
                    />
                    {activeTabDetails}
                </section>
            </div>
            {isMobile && (
                <IonFooter
                    mode="ios"
                    className="flex justify-center items-center ion-no-border absolute bottom-0"
                >
                    <BoostFooter handleBack={handleClose} />
                </IonFooter>
            )}
        </aside>
    );
};

export default BoostDetailsSideBar;
