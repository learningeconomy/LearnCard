import React, { useState } from 'react';

import X from '../../../svgs/X';
import OpenSyllabusMetaData from './OpenSyllabusMetaData';
import { IonPage } from '@ionic/react';
import { useRenderMethodEnabled } from '../../../../hooks/useRenderMethodEnabled';
import BoostSideMenuMediaDetails from './BoostSideMenuMediaDetails';
import BoostDisplayStyleSelector from './BoostDisplayStyleSelector';
import EndorsementThumb from 'learn-card-base/svgs/EndorsmentThumb';
import CredentialResultsBox from './CredentialResultsBox';
import SdJwtVcClaimsBox from './SdJwtVcClaimsBox';
import CredentialIssuerInformation from './CredentialIssuerInformation';
import EndorsementCard from '../../../boost-endorsements/EndorsementCard';
import BoostPreviewTabs from '../../../boost-preview-tabs/BoostPreviewTabs';
import BoostFooterLayout from 'learn-card-base/components/boost/boostFooter/BoostFooterLayout';
import SkillsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/SkillsBox';
import BoostEndorsementDetails from '../../../boost-endorsements/BoostEndorsementDetails';
import EndorsementsList from '../../../boost-endorsements/EndorsementsList/EndorsementsList';
import AlignmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/AlignmentsBox';
import TruncateTextBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/TruncateTextBox';
import VerificationsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/VerificationsBox';
import MediaAttachmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';
import PreviewVerificationBox from './PreviewVerificationBox';

import { useGetVCInfo, boostPreviewStore, BoostPreviewTabsEnum } from 'learn-card-base';

import { getCategoryDarkColor } from 'learn-card-base/helpers/credentialHelpers';
import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { CredentialCategoryEnum, useModal, DisplayTypeEnum } from 'learn-card-base';
import { VC, UnsignedVC, VerificationItem } from '@learncard/types';
import moment from 'moment';

type BoostDetailsSideMenuProps = {
    credential: VC;
    categoryType?: CredentialCategoryEnum;
    customSkillsComponent?: React.ReactNode;
    verificationItems: VerificationItem[];
    customLinkedCredentialsComponent?: React.ReactNode;
    displayType?: DisplayTypeEnum;
    existingEndorsements?: VC[];
    hideEndorsementRequestCard?: boolean;
    isEarnedBoost?: boolean;
    isClrChildCredential?: boolean;
    renderMethodCredential?: VC | UnsignedVC;
    issuancesSummaryComponent?: React.ReactNode;
    isPreview?: boolean;
};
const BoostDetailsSideMenu: React.FC<BoostDetailsSideMenuProps> = ({
    credential,
    categoryType,
    customSkillsComponent,
    verificationItems,
    customLinkedCredentialsComponent,
    displayType,
    existingEndorsements,
    hideEndorsementRequestCard,
    isEarnedBoost,
    isClrChildCredential = false,
    renderMethodCredential,
    issuancesSummaryComponent,
    isPreview = false,
}) => {
    const enableRenderMethod = useRenderMethodEnabled();
    const selectedTab = boostPreviewStore.useTracked.selectedTab();

    const { closeModal } = useModal();
    const { createdAt } = getInfoFromCredential(credential, 'MMMM DD YYYY', {
        uppercaseDate: false,
    });

    const activityStartDate = credential?.credentialSubject?.activityStartDate;
    const activityEndDate = credential?.credentialSubject?.activityEndDate;
    const dateRangeText =
        activityStartDate || activityEndDate
            ? [
                  activityStartDate && moment(activityStartDate).format('MMM YYYY'),
                  activityEndDate && moment(activityEndDate).format('MMM YYYY'),
              ]
                  .filter(Boolean)
                  .join(' – ')
            : null;
    const isMobile = window.innerWidth < 992;

    const {
        description,
        criteria,
        alignment,
        attachments,
        title,
        evidence,
        skills,
        results,
        creditsEarned,
    } = useGetVCInfo(credential, categoryType);

    const credentialDarkColor = getCategoryDarkColor(categoryType);

    let bgColor = `bg-${credentialDarkColor}`;

    if (categoryType === CredentialCategoryEnum.accommodation) {
        bgColor = 'bg-amber-700';
    } else if (categoryType === CredentialCategoryEnum.accomplishment) {
        bgColor = 'bg-lime-700';
    }

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

                        {!isMediaDisplay && dateRangeText && (
                            <span className="text-grayscale-500 font-poppins text-[12px] font-[500] w-full">
                                {dateRangeText}
                            </span>
                        )}

                        {!isMediaDisplay && (
                            <span
                                className={`text-grayscale-600 font-poppins text-[12px] font-[600] w-full ${
                                    description || dateRangeText
                                        ? 'pt-[10px] border-t-[1px] border-solid border-grayscale-200'
                                        : ''
                                }`}
                            >
                                Awarded on {createdAt}
                            </span>
                        )}
                    </TruncateTextBox>

                    {issuancesSummaryComponent && (
                        <div className="p-[15px] bg-white flex flex-col items-start gap-[10px] rounded-[20px] w-full shadow-bottom-2-4">
                            <h3 className="text-[22px] leading-[130%] tracking-[-0.25px] text-grayscale-900 font-notoSans">
                                Issuances
                            </h3>
                            {issuancesSummaryComponent}
                        </div>
                    )}

                    {!isMediaDisplay && renderMethodCredential && enableRenderMethod && (
                        <BoostDisplayStyleSelector
                            credential={renderMethodCredential}
                            enableRenderMethod={enableRenderMethod}
                        />
                    )}

                    <CredentialResultsBox results={results} creditsEarned={creditsEarned} />

                    <SdJwtVcClaimsBox credential={credential} />

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

                    {(skills?.length ?? 0) > 0 &&
                        (customSkillsComponent ? (
                            customSkillsComponent
                        ) : (
                            <SkillsBox skills={skills ?? []} />
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

                    {isPreview ? (
                        <PreviewVerificationBox />
                    ) : (
                        verificationItems &&
                        verificationItems.length > 0 && (
                            <VerificationsBox verificationItems={verificationItems} />
                        )
                    )}
                </>
            );
            break;
        case BoostPreviewTabsEnum.Endorsements:
            activeTabDetails = (
                <>
                    <BoostEndorsementDetails
                        credential={credential}
                        categoryType={categoryType}
                        existingEndorsements={existingEndorsements}
                    />
                </>
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
        <IonPage className="max-w-full !bg-white/80 !backdrop-blur-sm !overflow-y-auto">
            <BoostFooterLayout
                footerProps={isMobile ? { handleBack: handleClose } : undefined}
                contentClassName="pt-[30px] safe-area-top-margin"
            >
                <div className="min-h-full mx-auto px-[2px]">
                    {!isMobile && (
                        <button
                            className="text-grayscale-900 flex items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[10px] bg-white/90 shadow-md mb-[20px]"
                            onClick={handleClose}
                        >
                            <X className="w-[20px]" />
                            Close
                        </button>
                    )}

                    <section className="flex flex-col gap-[10px] w-[335px] pb-[20px] mx-auto">
                        <BoostPreviewTabs
                            selectedTab={selectedTab}
                            setSelectedTab={boostPreviewStore.set.updateSelectedTab}
                            isEarnedBoost={isEarnedBoost}
                        />
                        {activeTabDetails}
                    </section>
                </div>
            </BoostFooterLayout>
        </IonPage>
    );
};

export default BoostDetailsSideMenu;
