import React from 'react';
import moment from 'moment';

import SlimCaretRight from '../../svgs/SlimCaretRight';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import BoostPreview from '../../boost/boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../../boost/boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostLinkedCredentialsBox from '../../boost/boostLinkedCredentials/BoostLinkedCredentialsBox';

import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import {
    useModal,
    ModalTypes,
    useGetVCInfo,
    DisplayTypeEnum,
    CredentialCategoryEnum,
    CredentialSubjectDisplay,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { VC } from '@learncard/types';
import { ID_CARD_DISPLAY_TYPES } from 'learn-card-base/helpers/credentials/ids';
import {
    getClrLinkedCredentials,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

export const EndorsementFormBoostPreviewCard: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    className?: string;
    dateFormat?: string;
    showDetails?: boolean;
    existingEndorsements?: VC[];
}> = ({
    credential,
    categoryType,
    className,
    dateFormat = 'MMMM DD YYYY',
    showDetails = false,
    existingEndorsements = [],
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    let {
        issuerName,
        issuerProfileImageElement,

        // subject
        issueeName,
        subjectProfileImageElement,

        // ID overrides
        idDisplayType,
        idIssuerName,
        idIssuerThumbnailSrc,
        showIdIssuerThumbnail,
        idSubjectDID,
        mappedInputs,

        // VC metadata
        title,
        achievementType,
        formattedAchievementType,
        badgeThumbnail,
        isClrCredential,
        linkedCredentialCount,
        address,

        // VC Display Metadata
        displayType,
        idBackgroundImage,
        idDimBackgroundImage,
        idFontColor,
        idAccentColor,
        backgroundImage,
        backgroundColor,

        loading: vcInfoLoading,
    } = useGetVCInfo(credential, categoryType);

    const { createdAt } = getInfoFromCredential(credential, dateFormat, {
        uppercaseDate: false,
    });

    const isBoost = credential && isBoostCredential(credential);

    const issueDate = moment(createdAt).format(dateFormat);

    const isAwardDisplay = displayType === 'award';
    const isCertDisplayType = displayType === 'certificate';
    const isMeritBadge = displayType === 'meritBadge';
    const isID = displayType === DisplayTypeEnum.ID || categoryType === 'ID';

    let customDescription: JSX.Element;

    if (idSubjectDID && idDisplayType === ID_CARD_DISPLAY_TYPES.PermanentResidentCard) {
        customDescription = <CredentialSubjectDisplay credentialSubject={idSubjectDID} />;
    }

    const customLinkedCredentialsComponent =
        linkedCredentialCount > 0 ? (
            <BoostLinkedCredentialsBox
                displayType={displayType}
                credential={credential}
                categoryType={categoryType as BoostCategoryOptionsEnum}
                linkedCredentialCount={linkedCredentialCount}
                linkedCredentials={getClrLinkedCredentials(credential)}
            />
        ) : undefined;

    const previewCredential = () => {
        const earnedBoostIdCardProps = {
            credential: credential,
            categoryType: categoryType,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: undefined,
            handleCloseModal: () => closeModal(),
            subjectDID: idSubjectDID,
            subjectImageComponent: subjectProfileImageElement,
            issuerImageComponent: issuerProfileImageElement,
            customThumbComponent: isID ? (
                <IDDisplayCard
                    cred={credential}
                    idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                    idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                    customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                    name={title}
                    location={address}
                    issuerThumbnail={idIssuerThumbnailSrc}
                    showIssuerImage={showIdIssuerThumbnail}
                    backgroundImage={idBackgroundImage}
                    dimBackgroundImage={idDimBackgroundImage}
                    fontColor={idFontColor}
                    accentColor={idAccentColor}
                    idIssuerName={idIssuerName}
                    {...mappedInputs}
                />
            ) : (
                <CredentialBadge
                    achievementType={achievementType}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                />
            ),
            customDescription: customDescription,
            titleOverride: title,
            formattedDisplayType: formattedAchievementType,
            existingEndorsements,
        };

        const earnedBoostModalProps = {
            credential: credential,
            categoryType: categoryType,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: isBoost ? undefined : [],

            handleCloseModal: () => closeModal(),
            subjectImageComponent: subjectProfileImageElement,
            issuerImageComponent: issuerProfileImageElement,

            customThumbComponent: (
                <CredentialBadge
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={credential}
                />
            ),
            formattedDisplayType: formattedAchievementType,
            customLinkedCredentialsComponent,
            displayType: displayType,
            existingEndorsements,
        };

        const bgImage = isCertDisplayType || isID || isAwardDisplay ? backgroundImage : undefined;

        const props = isID ? earnedBoostIdCardProps : earnedBoostModalProps;

        if (isBoost) {
            newModal(
                <BoostPreview
                    {...props}
                    showEndorsementBadge
                    existingEndorsements={existingEndorsements}
                />,
                {
                    backgroundImage: bgImage,
                }
            );
        } else {
            newModal(
                <NonBoostPreview
                    {...props}
                    showEndorsementBadge
                    existingEndorsements={existingEndorsements}
                />,
                {
                    backgroundImage: bgImage,
                }
            );
        }
    };

    return (
        <div
            role="button"
            onClick={previewCredential}
            className={`w-full flex items-center gap-4 justify-start pt-2 pb-4 px-4 cursor-pointer bg-white rounded-[20px] mt-2 shadow-bottom-2-4 ${className}`}
        >
            <div className="flex items-center justify-start">
                <CredentialBadge
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail as string}
                    backgroundImage={backgroundImage as string}
                    backgroundColor={backgroundColor as string}
                    badgeContainerCustomClass={
                        isCertDisplayType || isAwardDisplay || isMeritBadge
                            ? 'hidden'
                            : 'mt-[0px] mb-[8px]'
                    }
                    badgeCircleCustomClass={`!w-[80px] h-[80px] mt-1 ${
                        isAwardDisplay || isMeritBadge ? '' : 'shadow-3xl'
                    }`}
                    badgeRibbonContainerCustomClass="left-[34%] bottom-[-40%]"
                    badgeRibbonCustomClass="w-[24px]"
                    badgeRibbonIconCustomClass="w-[70%] mt-[4px]"
                    displayType={displayType}
                    credential={credential}
                />
            </div>
            <div className="flex flex-col items-start w-full gap-1">
                <p className="text-sm text-grayscale-900 text-left font-semibold">{title}</p>
                <p className="text-xs text-grayscale-700 text-left">{formattedAchievementType}</p>
                <p className="flex text-xs text-grayscale-700 text-left">
                    <CredentialVerificationDisplay
                        credential={credential}
                        iconClassName="!w-[15px] !h-[15px] mr-1"
                    />
                    {issuerName} • {issueDate}
                </p>
            </div>
            {showDetails && (
                <span>
                    <SlimCaretRight className="w-[20px] h-[20px] min-w-[20px] min-h-[20px] text-grayscale-600" />
                </span>
            )}
        </div>
    );
};

export default EndorsementFormBoostPreviewCard;
