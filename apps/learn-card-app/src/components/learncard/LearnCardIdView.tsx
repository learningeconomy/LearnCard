import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
    UserProfilePicture,
    switchedProfileStore,
    useCurrentUser,
    useGetCurrentLCNUser,
    walletStore,
} from 'learn-card-base';
import { useTenantBrandingAssets, DEFAULT_BRAND_MARK } from '../../config/brandingAssets';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { getIdBackgroundStyles } from '../learncardID-CMS/learncard-cms.helpers';
import { LCNProfile } from '@learncard/types';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';

type LearnCardIdViewProps = {
    user?: LCNProfile;
    variant?: 'default' | 'contact';
    avatarLayoutId?: string;
};

const LearnCardIdView: React.FC<LearnCardIdViewProps> = ({
    user,
    variant = 'default',
    avatarLayoutId,
}) => {
    const brandingConfig = useBrandingConfig();
    const currentUser = useCurrentUser();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { brandMark } = useTenantBrandingAssets();

    const { displayName, profileId } = currentLCNUser ?? {};

    let idName = displayName || currentUser?.name || currentUser?.email || currentUser?.phoneNumber;
    idName = (idName?.length ?? 0) > 20 ? `${idName?.substring(0, 17)}...` : idName;

    if (user?.displayName) idName = user?.displayName;

    const hasParentSwitchedProfiles = switchedProfileStore.use.isSwitchedProfile();

    const backgroundStyles = getIdBackgroundStyles(user?.display ?? currentLCNUser?.display);

    const displayStyles = user?.display ?? currentLCNUser?.display;
    const prefersReducedMotion = useReducedMotion();
    const isContact = variant === 'contact';
    const avatarSize = isContact ? 'h-[100px] w-[100px]' : 'h-[80px] w-[80px]';

    return (
        <div
            className={`flex min-w-[305px] flex-col overflow-hidden relative shadow-bottom-4-4 ${
                isContact ? 'rounded-[24px] border-2 border-white/70' : 'rounded-[15px]'
            }`}
        >
            <div
                className={`flex bg-cover bg-center items-center bg-grayscale-900 ${
                    isContact
                        ? 'gap-5 px-7 py-[30px] min-h-[190px]'
                        : 'gap-[10px] px-[10px] py-[27.5px]'
                }`}
                style={{ ...backgroundStyles, color: displayStyles?.fontColor }}
            >
                <motion.div
                    className="relative shrink-0"
                    layoutId={prefersReducedMotion ? undefined : avatarLayoutId}
                >
                    <UserProfilePicture
                        customContainerClass={`${avatarSize} shrink-0 overflow-hidden rounded-[30px] border-2 border-white text-[40px]`}
                        customImageClass={`${avatarSize} shrink-0 rounded-[30px] border-2 border-white text-[40px] object-cover`}
                        customSize={isContact ? 180 : 120}
                        user={user ?? currentLCNUser}
                    />
                    {isContact && user?.approved && (
                        <span className="absolute -bottom-2 -end-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
                            <VerifiedBadge size="26" />
                        </span>
                    )}
                </motion.div>

                <div className="flex flex-col items-start pr-[10px] overflow-hidden text-white">
                    <span
                        className={`font-semibold leading-6 tracking-[0.25px] ${
                            isContact ? 'font-poppins text-xl' : 'font-notoSans text-[17px]'
                        }`}
                    >
                        {idName}
                    </span>
                    {(isContact || (!hasParentSwitchedProfiles && !user)) && (
                        <span
                            className={`font-semibold ${
                                isContact ? 'font-poppins text-sm' : 'font-notoSans text-[12px]'
                            }`}
                        >
                            @{user?.profileId ?? profileId}
                        </span>
                    )}

                    {/* {issuedDateOverride || (
                        <span className="font-notoSans font-[600] text-[12px]">
                            Issued {issueDate || 'Unkown'}
                        </span>
                    )} */}
                </div>
            </div>

            <div
                className={`flex flex-col justify-center bg-white ${
                    isContact ? 'h-[58px] px-5 py-2' : 'h-[45px] px-[10px] py-[4px]'
                }`}
                // style={{ backgroundColor: credential?.boostID?.accentColor }}
            >
                <span
                    className={`flex items-center gap-[5px] text-grayscale-900 font-[600] ${
                        isContact
                            ? 'font-poppins text-sm tracking-[1.6px] uppercase'
                            : 'font-notoSans text-[14px]'
                    }`}
                    // style={{ color: credential?.boostID?.accentFontColor }}
                >
                    {/* <CredentialVerificationDisplay
                                credential={credential}
                                iconClassName="!h-[17px] !w-[17px]"
                            /> */}
                    {brandingConfig?.name}
                </span>
            </div>

            <div
                className="rounded-full h-[54px] w-[54px] absolute end-[10px] bottom-[10px] flex items-center justify-center bg-white"
                // style={{ backgroundColor: credential?.boostID?.accentColor }}
            >
                <img
                    src={brandMark}
                    alt="Brand mark"
                    className="rounded-full h-[50px] w-[50px]"
                    onError={e => {
                        if (!e.currentTarget.dataset.fallbackApplied) {
                            e.currentTarget.dataset.fallbackApplied = 'true';
                            e.currentTarget.src = DEFAULT_BRAND_MARK;
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default LearnCardIdView;
