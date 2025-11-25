import React from 'react';
import moment from 'moment';

// import useGetTroopNetwork from '../../hooks/useGetTroopNetwork';
// import troopPageStore, { ScoutsRoleEnum } from '../../stores/troopPageStore';

// import ScoutIdThumbPlaceholder from '../../components/svgs/ScoutIdThumbPlaceholder';
// import LeaderIdThumbPlaceholder from '../../components/svgs/LeaderIdThumbPlaceholder';
// import NationalAdminIdThumbPlaceholder from '../../components/svgs/NationalAdminIdThumbPlaceholder';
// import GlobalAdminIdThumbPlaceholder from '../../components/svgs/GlobalAdminIdThumbPlaceholder';
import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
// import { getIdBackgroundStyles, getRoleFromCred } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';

type TroopIDProps = {
    name: string;
    thumbSrc?: string;
    credential?: VC;

    subTextOverride?: string;
    issuedDateOverride?: React.ReactNode;

    hideFooter?: boolean;
    containerClassName?: string;
    mainClassName?: string;
};

const TroopID: React.FC<TroopIDProps> = ({
    credential,
    name,
    thumbSrc,
    hideFooter = false,
    containerClassName = '',
    mainClassName = '',

    subTextOverride,
    issuedDateOverride,
}) => {
    const { createdAt } = getInfoFromCredential(credential, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });
    const issueDate = moment(createdAt).format('MM/D/YYYY');

    // const backgroundStyles = getIdBackgroundStyles(undefined, credential);
    const backgroundStyles = {};

    return (
        <div
            className={`rounded-[15px] flex flex-col overflow-hidden relative shadow-bottom-4-4 min-w-[305px] ${containerClassName}`}
        >
            <div
                className={`flex gap-[10px] px-[10px] py-[27.5px] bg-contain items-center ${mainClassName}`}
                style={{ ...backgroundStyles, color: credential?.boostID?.fontColor ?? 'white' }}
            >
                {thumbSrc ? (
                    <img src={thumbSrc} className="rounded-full h-[80px] w-[80px] object-cover" />
                ) : (
                    <div className="h-[80px] w-[80px] rounded-full bg-red" />
                )}

                <div className="flex flex-col items-start">
                    <span className="font-notoSans font-[600] text-[17px] leading-[24px] tracking-[0.25px]">
                        {name}
                    </span>
                    <span className="font-notoSans font-[600] text-[12px]">
                        {subTextOverride || `todo idtypetext ID`}
                    </span>

                    {issuedDateOverride || (
                        <span className="font-notoSans font-[600] text-[12px]">
                            Issued {issueDate || 'Unkown'}
                        </span>
                    )}
                </div>
            </div>
            {!hideFooter && (
                <>
                    <div
                        className="flex flex-col justify-center px-[10px] py-[4px] h-[45px]"
                        style={{ backgroundColor: credential?.boostID?.accentColor }}
                    >
                        <span
                            className="flex items-center gap-[5px] font-notoSans text-[14px] font-[600]"
                            style={{ color: credential?.boostID?.accentFontColor }}
                        >
                            <CredentialVerificationDisplay
                                credential={credential}
                                iconClassName="!h-[17px] !w-[17px]"
                            />
                            {credential?.name}
                        </span>
                        <span
                            className="text-grayscale-900 text-[12px] font-notoSans font-[600]"
                            style={{ color: credential?.boostID?.accentFontColor }}
                        >
                            TODO footerSubText
                        </span>
                    </div>

                    <div
                        className="rounded-full h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center"
                        style={{ backgroundColor: credential?.boostID?.accentColor }}
                    >
                        <img
                            src={credential?.boostID?.issuerThumbnail}
                            className="rounded-full h-[50px] w-[50px] object-cover"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default TroopID;
