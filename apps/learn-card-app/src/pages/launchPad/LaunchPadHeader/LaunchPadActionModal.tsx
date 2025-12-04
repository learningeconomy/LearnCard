import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ModalTypes, useModal } from 'learn-card-base';
import { ProfilePicture } from 'learn-card-base';
import PassportIcon from 'learn-card-base/svgs/PassportIcon';
import Rocket from 'learn-card-base/svgs/Rocket';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import AISessionsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/AISessionsQuickNav';
import BoostsQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/BoostsQuickNav';
import CredentialQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/CredentialQuickNav';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import ResumeQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/ResumeQuickNav';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import StudiesQuickNav from 'apps/learn-card-app/src/components/svgs/quicknav/StudiesQuickNav';
import X from 'learn-card-base/svgs/X';
import LaunchPadRoleSelector from './LaunchPadRoleSelector';
import {
    LearnCardRolesEnum,
    LearnCardRoles,
} from '../../../components/onboarding/onboarding.helpers';
import { useWallet, useGetProfile, useToast, ToastTypeEnum } from 'learn-card-base';

const getIconForActionButton = (label: string) => {
    switch (label) {
        case 'New AI Session':
            return <AISessionsQuickNav className="w-[50px] h-auto" />;
        case 'Boost Someone':
            return <BoostsQuickNav className="w-[50px] h-auto" />;
        case 'Create Resume':
            return <ResumeQuickNav className="w-[50px] h-auto" />;
        case 'Add Studies':
            return <StudiesQuickNav className="w-[50px] h-auto" />;
        case 'Add Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Personalize AI Sessions':
            return <BlueMagicWand className="w-[50px] h-auto" />;
        case 'Start AI Tutoring Session':
            return <AISessionsQuickNav className="w-[50px] h-auto" />;
        case 'Claim Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Create Credential':
        case 'Issue Learner Credential':
            return <CredentialQuickNav className="w-[50px] h-auto" />;
        case 'Manage Skills Frameworks':
            return <StudiesQuickNav className="w-[50px] h-auto" />;
        case 'View Learner Insights':
        case 'Request Learner Insights':
        case 'View Child Insights':
            return <ResumeQuickNav className="w-[50px] h-auto" />;
        case 'Boost Child':
            return <BoostsQuickNav className="w-[50px] h-auto" />;
        default:
            return <SolidCircleIcon className="w-[50px] h-auto" />;
    }
};

const ActionButton: React.FC<{
    label: string;
    bg: string;
    to?: string;
}> = ({ label, bg, to }) => {
    const history = useHistory();
    const { closeModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    return (
        <button
            type="button"
            onClick={() => {
                if (to) {
                    history.push(to);
                    closeModal();
                }
            }}
            className={`${bg} w-full text-lef flex px-5 py-4  text-[18px] font-poppins font-semibold text-grayscale-900 rounded-[20px] border border-solid border-[3px] border-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)]`}
        >
            <div className="flex items-center justify-center">
                <span className="mr-2">{getIconForActionButton(label)}</span> {label}
            </div>
        </button>
    );
};

const LaunchPadActionModal: React.FC<{ showFooterNav?: boolean }> = ({ showFooterNav }) => {
    const { newModal, closeModal } = useModal();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { data: lcNetworkProfile } = useGetProfile();
    const { presentToast } = useToast();

    const [role, setRole] = useState<LearnCardRolesEnum | null>(null);

    useEffect(() => {
        if (lcNetworkProfile?.role) {
            setRole(lcNetworkProfile.role as LearnCardRolesEnum);
        } else if (role === null) {
            setRole(LearnCardRolesEnum.learner);
        }
    }, [lcNetworkProfile?.role]);

    const roleLabel = LearnCardRoles.find(r => r.type === role)?.title ?? 'Learner';

    const RoleActions: Record<LearnCardRolesEnum, string[]> = {
        [LearnCardRolesEnum.learner]: [
            'Build My LearnCard',
            'Understand My Skills',
            'Personalize AI Sessions',
            'Start AI Tutoring Session',
            'Share Insights with Teacher',
            'Claim Credential',
        ],
        [LearnCardRolesEnum.teacher]: [
            'View Learner Insights',
            'Request Learner Insights',
            'Issue Learner Credential',
            'Create Credential',
            'Manage Skills Frameworks',
        ],
        [LearnCardRolesEnum.guardian]: [
            'Create Family',
            'Add Child',
            'Switch Child',
            'Boost Child',
            'View Child Insights',
        ],
        [LearnCardRolesEnum.developer]: [
            'Create API Token',
            'Create Signing Authority',
            'Create ConsentFlow',
            'Switch Network',
            'Manage Skills Frameworks',
            'Read Docs',
        ],
        [LearnCardRolesEnum.admin]: [
            'Manage Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Switch Account',
            'Create Credential',
        ],
        [LearnCardRolesEnum.counselor]: [
            'Manage Skills Frameworks',
            'Import Credentials',
            'Create Organization',
            'Switch Account',
            'Create Credential',
        ],
    };

    const actions = RoleActions[(role ?? LearnCardRolesEnum.learner) as LearnCardRolesEnum] ?? [];
    const bgColors = [
        'bg-[#7DE3F6]',
        'bg-[#6E8BFF]',
        'bg-[#B8F36B]',
        'bg-[#69D7AE]',
        'bg-[#F7D54D]',
        'bg-[#FFD1E5]',
    ];

    return (
        <div className="relative w-full h-full flex flex-col items-stretch p-4 gap-3 max-w-[380px]">
            <button
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                className="self-end mt-[8px] h-[20px] w-[40px] rounded-full bg-transparent text-[#2A2F55] flex items-center justify-center"
            >
                <X className="w-[20px] h-[20px]" />
            </button>
            <div className="rounded-[15px] bg-white shadow-[0_2px_6px_0_rgba(0,0,0,0.25)] px-[10px] py-[15px]">
                <div className="w-full flex items-center justify-center">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[48px] min-h-[48px]"
                        customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                        customSize={120}
                    />
                </div>

                <div className="w-full flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() =>
                            newModal(
                                <LaunchPadRoleSelector
                                    role={role}
                                    setRole={newRole => {
                                        setRole(newRole);
                                        (async () => {
                                            try {
                                                const wallet = await initWallet();
                                                await wallet?.invoke?.updateProfile({
                                                    role: newRole,
                                                });
                                                presentToast('Role updated', {
                                                    type: ToastTypeEnum.Success,
                                                    hasDismissButton: true,
                                                });
                                            } catch (e) {
                                                presentToast('Unable to update role', {
                                                    type: ToastTypeEnum.Error,
                                                    hasDismissButton: true,
                                                });
                                            }
                                        })();
                                    }}
                                />,
                                {
                                    sectionClassName:
                                        '!max-w-[600px] !mx-auto !max-h-[100%] disable-scrollbars',
                                },
                                { mobile: ModalTypes.Freeform, desktop: ModalTypes.Freeform }
                            )
                        }
                        className="px-[20px] py-4px] rounded-full border border-solid border-[#E2E3E9] bg-grayscale-white text-grayscale-700 text-sm font-poppins font-semibold"
                    >
                        <span className="flex items-center justify-center">
                            {roleLabel} <CaretDown className="ml-[5px]" />
                        </span>
                    </button>
                </div>

                <h3 className="text-center text-[22px] font-poppins font-semibold text-grayscale-900 mt-[12px]">
                    What would you like to do?
                </h3>
            </div>

            <div className="mt-1 flex flex-col gap-3">
                {actions.map((label, i) => (
                    <ActionButton
                        key={`${label}-${i}`}
                        label={label}
                        bg={bgColors[i % bgColors.length]}
                    />
                ))}
            </div>
            {showFooterNav && (
                <div className="mt-1 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            history.push('/passport');
                            closeModal();
                        }}
                        className="w-full bg-white text-grayscale-900 rounded-[15px] border border-solid border-[#E2E3E9] py-3 shadow-[0_2px_6px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
                    >
                        <PassportIcon className="w-[26px] h-[26px]" />
                        <span className="text-base font-poppins font-semibold">Passport</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (history.location.pathname === '/launchpad') {
                                closeModal();
                            } else {
                                history.push('/launchpad');
                                closeModal();
                            }
                        }}
                        className="w-full bg-white text-grayscale-900 rounded-[15px] border border-solid border-[#E2E3E9] py-3 shadow-[0_2px_6px_0_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-[26px] h-[26px]" />
                        <span className="text-base font-poppins font-semibold">Launchpad</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LaunchPadActionModal;
