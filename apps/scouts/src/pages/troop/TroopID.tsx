import React, { useMemo } from 'react';
import moment from 'moment';
import { VC } from '@learncard/types';
import { useGetCredentialWithEdits } from 'learn-card-base';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import troopPageStore from '../../stores/troopPageStore';
import useGetTroopNetwork from '../../hooks/useGetTroopNetwork';
import {
    getDefaultBadgeThumbForCredential,
    getIdBackgroundStyles,
    getRoleFromCred,
} from '../../helpers/troop.helpers';

import ScoutIdThumbPlaceholder from '../../components/svgs/ScoutIdThumbPlaceholder';
import LeaderIdThumbPlaceholder from '../../components/svgs/LeaderIdThumbPlaceholder';
import NationalAdminIdThumbPlaceholder from '../../components/svgs/NationalAdminIdThumbPlaceholder';
import GlobalAdminIdThumbPlaceholder from '../../components/svgs/GlobalAdminIdThumbPlaceholder';

interface TroopIDProps {
    name?: string | undefined;
    thumbSrc?: string;
    credential?: VC;
    subTextOverride?: string;
    issuedDateOverride?: React.ReactNode;
    hideFooter?: boolean;
    containerClassName?: string;
    mainClassName?: string;
    showDetails?: boolean;
}

interface RoleSpecificProperties {
    PlaceholderThumbComponent: React.FC<{ className?: string }>;
    idTypeText: string;
    footerSubText?: string;
}

const ROLE_PROPERTIES: Record<ScoutsRoleEnum, RoleSpecificProperties> = {
    [ScoutsRoleEnum.scout]: {
        PlaceholderThumbComponent: ScoutIdThumbPlaceholder,
        idTypeText: 'Scout',
        footerSubText: undefined, // Will be set dynamically
    },
    [ScoutsRoleEnum.leader]: {
        PlaceholderThumbComponent: LeaderIdThumbPlaceholder,
        idTypeText: 'Leader',
        footerSubText: undefined, // Will be set dynamically
    },
    [ScoutsRoleEnum.national]: {
        PlaceholderThumbComponent: NationalAdminIdThumbPlaceholder,
        idTypeText: 'National Admin',
        footerSubText: undefined,
    },
    [ScoutsRoleEnum.global]: {
        PlaceholderThumbComponent: GlobalAdminIdThumbPlaceholder,
        idTypeText: 'Global Admin',
        footerSubText: undefined,
    },
};

const TroopID: React.FC<TroopIDProps> = ({
    credential: initialCredential,
    name,
    thumbSrc: initialThumbSrc,
    hideFooter = false,
    containerClassName = '',
    mainClassName = '',
    subTextOverride,
    issuedDateOverride,
    showDetails,
}) => {
    const { credentialWithEdits } = useGetCredentialWithEdits(initialCredential);
    const credential = credentialWithEdits ?? initialCredential;
    const network = useGetTroopNetwork({ credential });
    const role = getRoleFromCred(credential);
    const thumbSrc = initialThumbSrc || credential?.boostID?.idThumbnail;
    const issueDate = useMemo(
        () => moment(credential?.issuanceDate).format('MM/D/YYYY'),
        [credential?.issuanceDate]
    );

    const roleProperties = useMemo(() => {
        const baseProperties = ROLE_PROPERTIES[role];
        return {
            ...baseProperties,
            footerSubText:
                role === ScoutsRoleEnum.scout || role === ScoutsRoleEnum.leader
                    ? network?.name
                    : baseProperties.footerSubText,
        };
    }, [role, network?.name]);

    const backgroundStyles = useMemo(
        () => getIdBackgroundStyles(undefined, credential),
        [credential]
    );

    const handleShowDetails = () => {
        if (showDetails) {
            troopPageStore.set.showIdDetails(true);
        }
    };

    const renderMainContent = () => (
        <div
            className={`flex gap-[10px] px-[10px] py-[27.5px] bg-contain items-center ${mainClassName}`}
            style={{ ...backgroundStyles, color: credential?.boostID?.fontColor ?? 'white' }}
        >
            {thumbSrc ? (
                <img
                    src={thumbSrc}
                    alt={`${name}'s profile`}
                    className="rounded-full h-[80px] w-[80px] object-cover"
                />
            ) : (
                <roleProperties.PlaceholderThumbComponent className="rounded-full" />
            )}

            <div className="flex flex-col items-start">
                <span className="font-notoSans font-[600] text-[17px] leading-[24px] tracking-[0.25px]">
                    {name || ROLE_PROPERTIES[role].idTypeText}
                </span>
                <span className="font-notoSans font-[600] text-[12px]">
                    {subTextOverride || roleProperties.idTypeText}
                </span>
                {issuedDateOverride || (
                    <span className="font-notoSans font-[600] text-[12px]">
                        Issued {issueDate || 'Unknown'}
                    </span>
                )}
            </div>
        </div>
    );

    const renderFooter = () => (
        <>
            <div className="flex flex-col justify-center px-[10px] py-[4px] h-[45px] bg-white">
                <span className="flex items-center gap-[5px] font-notoSans text-[14px] font-[600] text-grayscale-900">
                    {credential?.name}
                </span>
                {roleProperties.footerSubText && (
                    <span
                        className="text-grayscale-900 text-[12px] font-notoSans font-[600]"
                        style={{ color: credential?.boostID?.accentFontColor }}
                    >
                        {roleProperties.footerSubText}
                    </span>
                )}
            </div>

            <div
                className="rounded-full h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center"
                style={{ backgroundColor: credential?.boostID?.accentColor }}
            >
                {credential?.boostID?.issuerThumbnail ? (
                    <img
                        src={credential.boostID.issuerThumbnail}
                        alt="Issuer thumbnail"
                        className="rounded-full h-[50px] w-[50px] object-cover"
                    />
                ) : (
                    getDefaultBadgeThumbForCredential(credential, 'h-[50px] w-[50px]')
                )}
            </div>
        </>
    );

    return (
        <div
            className={`rounded-[15px] flex flex-col overflow-hidden relative shadow-bottom-4-4 min-w-[305px] ${containerClassName}`}
            onClick={handleShowDetails}
        >
            {renderMainContent()}
            {!hideFooter && renderFooter()}
        </div>
    );
};

export default React.memo(TroopID);
