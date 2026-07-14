import React, { useEffect, useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

import {
    useWallet,
    useGetProfile,
    useToast,
    ToastTypeEnum,
    useDeviceTypeByWidth,
    switchedProfileStore,
    useModal,
    ModalTypes,
    getLogger,
} from 'learn-card-base';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import Checkmark from 'learn-card-base/svgs/Checkmark';

import {
    roleIcons,
    iconBgColors,
} from '../../../components/onboarding/onboardingRoles/OnboardingRoleItem';
import {
    LearnCardRolesEnum,
    LearnCardRoles,
} from '../../../components/onboarding/onboarding.helpers';
import LaunchPadRoleSelector from '../../launchPad/LaunchPadHeader/LaunchPadRoleSelector';

import * as m from '../../../paraglide/messages.js';

const log = getLogger('dashboard-role-switcher');

// Counselor is hidden from the picker everywhere else (OnboardingRoles + the
// LaunchPad menu both filter it), so we replicate that here for parity.
const visibleRoles = LearnCardRoles.filter(r => r.type !== LearnCardRolesEnum.counselor);

const DashboardRoleSwitcher: React.FC = () => {
    const { initWallet } = useWallet();
    const { data: lcNetworkProfile, refetch: refetchProfile } = useGetProfile();
    const { presentToast } = useToast();
    const { isDesktop } = useDeviceTypeByWidth();
    const { newModal } = useModal();

    const profileType = switchedProfileStore.use.profileType();
    const isChildProfile = profileType === 'child';

    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);
    const [optimisticRole, setOptimisticRole] = useState<LearnCardRolesEnum | null>(null);

    useEffect(() => {
        if (lcNetworkProfile?.role && optimisticRole === lcNetworkProfile.role) {
            setOptimisticRole(null);
            return;
        }
        if (optimisticRole) return;
        if (lcNetworkProfile?.role) {
            setRole(lcNetworkProfile.role as LearnCardRolesEnum);
        } else if (role === null) {
            setRole(LearnCardRolesEnum.learner);
        }
    }, [lcNetworkProfile?.role, optimisticRole]);

    const activeRole = (
        isChildProfile ? LearnCardRolesEnum.learner : role ?? LearnCardRolesEnum.learner
    ) as LearnCardRolesEnum;

    const roleLabel =
        LearnCardRoles.find(r => r.type === activeRole)?.title ??
        m['onboarding.role.learner.title']();

    const handleRoleChange = async (newRole: LearnCardRolesEnum) => {
        if (newRole === activeRole) return;

        setRole(newRole);
        setOptimisticRole(newRole);

        // The wallet write is the only step whose failure means the role did NOT
        // actually change. Roll back optimistic state + surface an error toast
        // only if THIS step throws — cache-refresh failures below should not
        // trigger a rollback (server state already reflects the new role).
        try {
            const wallet = await initWallet();
            await wallet?.invoke?.updateProfile({ role: newRole });
        } catch (e) {
            setOptimisticRole(null);
            setRole((lcNetworkProfile?.role as LearnCardRolesEnum) ?? LearnCardRolesEnum.learner);
            presentToast(m['launchpad.modal.unableToUpdateRole'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }

        // useGetProfile has a long staleTime and updateProfile does not invalidate
        // its cache — explicitly refetch so other surfaces see the new role. A
        // failed refetch is non-fatal (server already updated); don't roll back.
        try {
            await refetchProfile();
        } catch (e) {
            log.error('Failed to refresh profile cache after role change', e);
        }

        const newRoleTitle =
            LearnCardRoles.find(r => r.type === newRole)?.title ??
            m['onboarding.role.learner.title']();
        presentToast(m['toasts.launchpad.nowRole']({ role: newRoleTitle }), {
            title: m['launchpad.modal.roleUpdated'](),
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
            hasCheckmark: true,
            autoDismiss: false,
        });
    };

    const pillClassName = `inline-flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium transition-colors ${
        isChildProfile ? 'cursor-default' : 'cursor-pointer hover:bg-grayscale-200'
    }`;

    const pillContents = (
        <>
            <span
                className="flex items-center justify-center h-[16px] w-[16px] rounded-full shrink-0"
                style={{ backgroundColor: iconBgColors[activeRole] }}
            >
                <img
                    src={roleIcons[activeRole]}
                    alt={m['dashboard.roleSwitcher.iconAlt']({ role: roleLabel })}
                    className="h-[12px] w-[12px] object-contain"
                />
            </span>
            <span>{roleLabel}</span>
            {!isChildProfile && <CaretDown className="ml-0.5 text-grayscale-400 w-[9px]" />}
        </>
    );

    if (isChildProfile) {
        return (
            <span
                className={pillClassName}
                aria-label={m['dashboard.roleSwitcher.roleAria']({ role: roleLabel })}
            >
                {pillContents}
            </span>
        );
    }

    if (isDesktop) {
        return (
            <Menu as="div" className="relative inline-block">
                <MenuButton
                    className={pillClassName}
                    aria-label={m['dashboard.roleSwitcher.switchAria']({ role: roleLabel })}
                >
                    {pillContents}
                </MenuButton>
                <MenuItems
                    anchor="bottom start"
                    className="bg-white rounded-[15px] shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] p-[8px] my-[6px] focus:outline-none z-[1000] min-w-[220px] flex flex-col gap-[4px]"
                >
                    {visibleRoles.map(roleItem => {
                        const isSelected = roleItem.type === activeRole;
                        return (
                            <MenuItem key={roleItem.id}>
                                {({ focus }) => (
                                    <button
                                        type="button"
                                        onClick={() => handleRoleChange(roleItem.type)}
                                        className={`w-full flex items-center gap-2 p-[8px] rounded-[10px] font-poppins font-semibold text-[14px] text-grayscale-900 ${
                                            focus ? 'bg-grayscale-100' : ''
                                        }`}
                                    >
                                        <span
                                            className="flex items-center justify-center h-[22px] w-[22px] rounded-full"
                                            style={{ backgroundColor: iconBgColors[roleItem.type] }}
                                        >
                                            <img
                                                src={roleIcons[roleItem.type]}
                                                alt={m['dashboard.roleSwitcher.iconAlt']({
                                                    role: roleItem.title,
                                                })}
                                                className="h-[20px] w-[20px] object-contain"
                                            />
                                        </span>
                                        <span className="flex-1 text-left">{roleItem.title}</span>
                                        {isSelected && (
                                            <Checkmark className="w-[15px] h-[15px] text-[#2A2F55]" />
                                        )}
                                    </button>
                                )}
                            </MenuItem>
                        );
                    })}
                </MenuItems>
            </Menu>
        );
    }

    return (
        <button
            type="button"
            aria-label={m['dashboard.roleSwitcher.switchAria']({ role: roleLabel })}
            onClick={() =>
                newModal(
                    <LaunchPadRoleSelector role={activeRole} setRole={handleRoleChange} />,
                    { sectionClassName: '!max-w-[600px] !mx-auto !max-h-[100%]' },
                    { mobile: ModalTypes.BottomSheet, desktop: ModalTypes.BottomSheet }
                )
            }
            className={pillClassName}
        >
            {pillContents}
        </button>
    );
};

export default DashboardRoleSwitcher;
