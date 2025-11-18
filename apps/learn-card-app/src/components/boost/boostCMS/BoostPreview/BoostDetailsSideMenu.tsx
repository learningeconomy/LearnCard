import React from 'react';

import X from '../../../svgs/X';
import { IonFooter, IonPage } from '@ionic/react';
import BoostSideMenuMediaDetails from './BoostSideMenuMediaDetails';
import CredentialIssuerInformation from './CredentialIssuerInformation';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import SkillsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/SkillsBox';
import AlignmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/AlignmentsBox';
import TruncateTextBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/TruncateTextBox';
import VerificationsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/VerificationsBox';
import MediaAttachmentsBox from 'apps/learn-card-app/src/pages/ids/view-id/IdDetails/MediaAttachmentBoxCerts';

import { useGetVCInfo } from 'learn-card-base';

import { getCategoryDarkColor } from 'learn-card-base/helpers/credentialHelpers';
import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { CredentialCategoryEnum, useModal, DisplayTypeEnum } from 'learn-card-base';
import { VC, VerificationItem } from '@learncard/types';

type BoostDetailsSideMenuProps = {
    credential: VC;
    categoryType?: CredentialCategoryEnum;
    customSkillsComponent?: React.ReactNode;
    verificationItems: VerificationItem[];
    customLinkedCredentialsComponent?: React.ReactNode;
    displayType?: DisplayTypeEnum;
};
const BoostDetailsSideMenu: React.FC<BoostDetailsSideMenuProps> = ({
    credential,
    categoryType,
    customSkillsComponent,
    verificationItems,
    customLinkedCredentialsComponent,
    displayType,
}) => {
    const { closeModal } = useModal();
    const { createdAt } = getInfoFromCredential(credential, 'MMMM DD YYYY', {
        uppercaseDate: false,
    });
    const isMobile = window.innerWidth < 992;

    const { description, criteria, alignment, attachments, title, evidence, skills } = useGetVCInfo(
        credential,
        categoryType
    );

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

    return (
        <IonPage className="max-w-full !bg-white/80 !backdrop-blur-sm !overflow-y-auto">
            <div className="h-full max-h-full overflow-y-auto pb-[80px] pt-[30px] safe-area-top-margin">
                <div className="mx-auto px-[2px]">
                    {!isMobile && (
                        <button
                            className="text-grayscale-900 flex items-center justify-center gap-[5px] px-[10px] py-[5px] rounded-[10px] bg-white/90 shadow-md mb-[20px]"
                            onClick={() => closeModal()}
                        >
                            <X className="w-[20px]" />
                            Close
                        </button>
                    )}
                    <section className="flex flex-col gap-[10px] w-[335px] pb-[30%] sm:pb-[20px] mx-auto">
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
                            {isMediaDisplay && (
                                <BoostSideMenuMediaDetails credential={credential} />
                            )}

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

                        {customLinkedCredentialsComponent && customLinkedCredentialsComponent}

                        {(skills?.length ?? 0) > 0 &&
                            (customSkillsComponent ? (
                                customSkillsComponent
                            ) : (
                                <SkillsBox skills={skills ?? []} />
                            ))}

                        {((attachments && attachments.length > 0) ||
                            (evidence && evidence.length > 0)) && (
                            <MediaAttachmentsBox attachments={attachments} evidence={evidence} />
                        )}

                        {alignment && <AlignmentsBox alignment={alignment} style="Certificate" />}

                        {verificationItems && verificationItems.length > 0 && (
                            <VerificationsBox verificationItems={verificationItems} />
                        )}
                    </section>
                </div>
            </div>
            {isMobile && (
                <IonFooter
                    mode="ios"
                    className="flex justify-center items-center ion-no-border absolute bottom-0"
                >
                    <BoostFooter handleBack={closeModal} />
                </IonFooter>
            )}
        </IonPage>
    );
};

export default BoostDetailsSideMenu;
