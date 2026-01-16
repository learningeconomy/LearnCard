import React from 'react';

import { BoostGenericCard } from '@learncard/react';
import BoostListItem from '../boost/BoostListItem';

import { VC } from '@learncard/types';
import { CredentialCategory } from 'learn-card-base/types/credentials';
import { WalletCategoryTypes } from '../IssueVC/types';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import {
    BoostPageViewMode,
    BoostPageViewModeType,
} from '../earned-and-managed-tabs/EarnedAndManagedTabs';
import CredentialVerificationDisplay from '../CredentialBadge/CredentialVerificationDisplay';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';

type BoostGenericCardWrapperProps = {
    title?: string;
    customTitle?: React.ReactNode | undefined;
    className?: string;
    type?: WalletCategoryTypes;
    categoryType?: CredentialCategory;
    thumbImgSrc?: string;
    customThumbClass?: string;
    customHeaderClass?: string;
    showChecked?: boolean;
    checkStatus?: boolean;
    onCheckClick?: () => void;
    customThumbComponent?: React.ReactNode;
    innerOnClick?: () => void;
    bgImgSrc?: string;
    issuerName?: string;
    customIssuerName?: React.ReactNode | undefined;
    optionsTriggerOnClick?: () => void;
    dateDisplay?: string;
    customDateDisplay?: React.ReactNode | undefined;
    boostPageViewMode?: BoostPageViewModeType;
    credential?: VC;
    loading?: boolean;
    branding?: BrandingEnum;
    isInSkillsModal?: boolean;
    linkedCredentialsCount?: number;
    linkedCredentialsClassName?: string;
    displayType?: string;
    uri?: string;
    indicatorColor?: string;
    unknownVerifierTitle?: string;
};

export const BoostGenericCardWrapper: React.FC<BoostGenericCardWrapperProps> = ({
    title,
    customTitle,
    thumbImgSrc,
    customThumbClass = '',
    customHeaderClass = '',
    type = WalletCategoryTypes.achievements,
    categoryType,
    className,
    onCheckClick,
    showChecked,
    checkStatus,
    customThumbComponent,
    innerOnClick,
    bgImgSrc,
    issuerName,
    customIssuerName,
    dateDisplay,
    customDateDisplay,
    optionsTriggerOnClick,
    boostPageViewMode = BoostPageViewMode.Card,
    credential,
    loading,
    branding,
    isInSkillsModal,
    linkedCredentialsCount,
    linkedCredentialsClassName,
    displayType,
    uri,
    indicatorColor,
    unknownVerifierTitle,
}) => {
    if (boostPageViewMode === BoostPageViewMode.List) {
        return (
            <BoostListItem
                credential={credential}
                title={title}
                categoryType={categoryType}
                onClick={innerOnClick}
                onOptionsClick={optionsTriggerOnClick}
                loading={loading}
                branding={branding}
                linkedCredentialsCount={linkedCredentialsCount}
                linkedCredentialsClassName={linkedCredentialsClassName}
                displayType={displayType}
                thumbImgSrc={thumbImgSrc}
                indicatorColor={indicatorColor}
                uri={uri}
            />
        );
    }

    return (
        <BoostGenericCard
            innerOnClick={innerOnClick}
            onCheckClick={onCheckClick}
            showChecked={showChecked}
            checkStatus={checkStatus}
            optionsTriggerOnClick={optionsTriggerOnClick}
            className={`${className} !shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)]`}
            customHeaderClass={customHeaderClass}
            customThumbClass={customThumbClass}
            thumbImgSrc={thumbImgSrc}
            dateDisplay={dateDisplay}
            issuerName={issuerName}
            bgImgSrc={bgImgSrc}
            customThumbComponent={customThumbComponent}
            title={title}
            type={type ?? WalletCategoryTypes.achievements}
            boostPageViewMode={boostPageViewMode}
            customTitle={customTitle}
            customDateDisplay={customDateDisplay}
            customIssuerName={customIssuerName}
            verifierBadge={
                loading ? null : (
                    <CredentialVerificationDisplay
                        credential={credential}
                        iconClassName="!w-[15px] !h-[15px] mr-1"
                        showText={!!unknownVerifierTitle}
                        unknownVerifierTitle={unknownVerifierTitle}
                    />
                )
            }
            credential={credential}
            isInSkillsModal={isInSkillsModal}
            linkedCredentialsCount={linkedCredentialsCount ?? 0}
            linkedCredentialsClassName={linkedCredentialsClassName}
            displayType={displayType}
        />
    );
};

export default BoostGenericCardWrapper;
