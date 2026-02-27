import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    useModal,
    useListMySkillFrameworks,
    ModalTypes,
    useWallet,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import Plus from 'learn-card-base/svgs/Plus';
import RefreshIcon from 'learn-card-base/svgs/Refresh';
import ManageSkills from './ManageSkills';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import CreateFrameworkModal from './CreateFrameworkModal';
import SkillsAdminPanelFramework from '../skills/SkillsAdminPanelFramework';
import { IonInput, IonSpinner } from '@ionic/react';
import type { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';
import type { SkillFramework } from '../../components/boost/boost';
import {
    isFrameworkAllowedByOpenSaltAllowlist,
    isOpenSaltFramework,
    isOpenSaltRef,
} from '../../helpers/opensalt.helpers';

type SelectFrameworkToManageModalProps = {
    onFrameworkSelectOverride?: (framework: ApiFrameworkInfo) => void;
    hideCreateFramework?: boolean;
    isBoostSkillSelection?: boolean;
};

type Flags = {
    enableOpenSaltBoostSkillSection?: boolean;
    openSaltFrameworkAllowlist?: string[] | string;
};

const normalizeAllowlistFlag = (allowlist: Flags['openSaltFrameworkAllowlist']): string[] => {
    if (!allowlist) return [];

    if (Array.isArray(allowlist)) {
        return allowlist.map(entry => entry?.trim()).filter(Boolean) as string[];
    }

    return allowlist
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
};

const SelectFrameworkToManageModal: React.FC<SelectFrameworkToManageModalProps> = ({
    onFrameworkSelectOverride,
    hideCreateFramework,
    isBoostSkillSelection,
}) => {
    const { closeModal, newModal } = useModal();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const queryClient = useQueryClient();
    const flags = useFlags<Flags>();

    const { data: frameworks = [], isLoading: isLoadingFrameworks } = useListMySkillFrameworks();

    const [openSaltRef, setOpenSaltRef] = React.useState('');
    const [isImportingOpenSaltFramework, setIsImportingOpenSaltFramework] = React.useState(false);
    const [syncingFrameworkId, setSyncingFrameworkId] = React.useState<string | null>(null);

    const shouldShowOpenSaltSection =
        Boolean(isBoostSkillSelection) && Boolean(flags.enableOpenSaltBoostSkillSection);

    const { data: availableFrameworks = [], isLoading: isLoadingAvailableFrameworks } = useQuery({
        queryKey: ['allAvailableSkillFrameworks', shouldShowOpenSaltSection],
        enabled: shouldShowOpenSaltSection,
        queryFn: async () => {
            const wallet = await initWallet();
            const records: ApiFrameworkInfo[] = [];
            let cursor: string | null | undefined = null;

            for (let i = 0; i < 40; i++) {
                const page = await wallet.invoke.getAllAvailableFrameworks({
                    limit: 100,
                    cursor,
                });

                records.push(...(page.records as ApiFrameworkInfo[]));

                if (!page.hasMore || !page.cursor) break;
                cursor = page.cursor;
            }

            return records;
        },
    });

    const openSaltAllowlist = normalizeAllowlistFlag(flags.openSaltFrameworkAllowlist);
    const myFrameworkIds = React.useMemo(
        () => new Set(frameworks.map(framework => framework.id)),
        [frameworks]
    );

    const openSaltFrameworks = React.useMemo(
        () =>
            availableFrameworks
                .filter(framework => !myFrameworkIds.has(framework.id))
                .filter(isOpenSaltFramework)
                .filter(framework =>
                    isFrameworkAllowedByOpenSaltAllowlist(framework, openSaltAllowlist)
                ),
        [availableFrameworks, myFrameworkIds, openSaltAllowlist]
    );

    const handleFrameworkSelect = (framework: ApiFrameworkInfo) => {
        closeModal();
        setTimeout(() => {
            if (onFrameworkSelectOverride) {
                onFrameworkSelectOverride(framework);
            } else {
                newModal(
                    <ManageSkills initialFrameworkId={framework.id} />,
                    {
                        sectionClassName: '!bg-transparent !shadow-none',
                    },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
                );
            }
        }, 300);
    };

    const handleSyncFramework = async (framework: ApiFrameworkInfo) => {
        try {
            setSyncingFrameworkId(framework.id);
            const wallet = await initWallet();
            await wallet.invoke.syncFrameworkSkills({ id: framework.id });
            await queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            presentToast('Framework synced successfully.', {
                type: ToastTypeEnum.Success,
                duration: 2500,
            });
        } catch (error: unknown) {
            presentToast(error instanceof Error ? error.message : 'Unable to sync framework.', {
                type: ToastTypeEnum.Error,
                duration: 3000,
            });
        } finally {
            setSyncingFrameworkId(null);
        }
    };

    const toDisplayFramework = (framework: ApiFrameworkInfo): SkillFramework => ({
        id: framework.id,
        name: framework.name,
        image: framework.image || '',
        description: framework.description || '',
        skills: [],
    });

    const handleImportOpenSaltFramework = async () => {
        const ref = openSaltRef.trim();
        if (!isOpenSaltRef(ref)) {
            presentToast('Please paste a valid OpenSALT framework link.', {
                type: ToastTypeEnum.Error,
                duration: 2500,
            });
            return;
        }

        try {
            setIsImportingOpenSaltFramework(true);

            const wallet = await initWallet();
            const framework = await wallet.invoke.createSkillFramework({ frameworkId: ref });
            await wallet.invoke.syncFrameworkSkills({ id: framework.id });

            await queryClient.invalidateQueries({ queryKey: ['listMySkillFrameworks'] });
            await queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            await queryClient.invalidateQueries({ queryKey: ['allAvailableSkillFrameworks'] });

            setOpenSaltRef('');
            presentToast('OpenSALT framework imported and synced.', {
                type: ToastTypeEnum.Success,
                duration: 2500,
            });
        } catch (error: unknown) {
            presentToast(error instanceof Error ? error.message : 'Unable to import framework.', {
                type: ToastTypeEnum.Error,
                duration: 3000,
            });
        } finally {
            setIsImportingOpenSaltFramework(false);
        }
    };

    const openCreateFrameworkModal = () => {
        closeModal();
        setTimeout(() => {
            newModal(
                <CreateFrameworkModal />,
                {
                    sectionClassName: '!bg-transparent !shadow-none',
                },
                { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
            );
        }, 300);
    };

    return (
        <div className="flex flex-col gap-[10px] px-[20px]">
            <div className="bg-white rounded-[15px] p-[20px] max-h-[600px] overflow-y-auto">
                <h2 className="flex items-center justify-center gap-[10px] text-grayscale-900 font-poppins text-[22px] leading-[130%] tracking-[-0.25px] py-[10px]">
                    <SkillsFrameworkIcon
                        className="w-[35px] h-[35px]"
                        version="filled-dots"
                        color="currentColor"
                    />
                    Select a Framework
                </h2>

                {isLoadingFrameworks && (
                    <div className="flex items-center justify-center py-[111px] text-grayscale-900">
                        <IonSpinner />
                    </div>
                )}

                {frameworks?.map(framework => (
                    <div key={framework.id} className="flex items-center gap-[5px]">
                        <div className="flex-1">
                            <SkillsAdminPanelFramework
                                framework={toDisplayFramework(framework)}
                                buttonClassName="flex gap-[10px] py-[15px] bg-white items-center text-left w-full"
                                onClick={() => handleFrameworkSelect(framework)}
                            />
                        </div>
                        {!isBoostSkillSelection && isOpenSaltFramework(framework) && (
                            <button
                                type="button"
                                onClick={() => handleSyncFramework(framework)}
                                disabled={syncingFrameworkId === framework.id}
                                className="p-[8px] text-grayscale-600 hover:text-emerald-700 disabled:opacity-50"
                                title="Sync framework"
                            >
                                {syncingFrameworkId === framework.id ? (
                                    <IonSpinner name="lines" className="w-[20px] h-[20px]" />
                                ) : (
                                    <RefreshIcon className="w-[20px] h-[20px]" />
                                )}
                            </button>
                        )}
                    </div>
                ))}

                {shouldShowOpenSaltSection && (
                    <div className="pt-[10px] mt-[10px] border-t border-grayscale-200 border-solid">
                        <h3 className="font-poppins text-[16px] font-[600] text-grayscale-900 mb-[5px]">
                            OpenSALT Frameworks
                        </h3>
                        <p className="font-poppins text-[13px] text-grayscale-600 mb-[10px]">
                            Public standards available for boost skill selection.
                        </p>

                        {isLoadingAvailableFrameworks && (
                            <div className="flex items-center justify-center py-[20px] text-grayscale-900">
                                <IonSpinner />
                            </div>
                        )}

                        {!isLoadingAvailableFrameworks && openSaltFrameworks.length === 0 && (
                            <p className="font-poppins text-[13px] text-grayscale-500 py-[10px]">
                                No OpenSALT frameworks are currently available.
                            </p>
                        )}

                        {openSaltFrameworks.map(framework => (
                            <SkillsAdminPanelFramework
                                key={`opensalt-${framework.id}`}
                                framework={toDisplayFramework(framework)}
                                buttonClassName="flex gap-[10px] py-[15px] bg-white items-center text-left w-full"
                                onClick={() => handleFrameworkSelect(framework)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {!hideCreateFramework && (
                <div className="bg-white rounded-[15px] p-[15px] flex flex-col gap-[10px]">
                    <h3 className="font-poppins text-[16px] font-[600] text-grayscale-900">
                        Import OpenSALT Framework
                    </h3>
                    <IonInput
                        value={openSaltRef}
                        onIonInput={event => setOpenSaltRef(event.detail.value ?? '')}
                        placeholder="Paste an OpenSALT framework link"
                        className="bg-grayscale-100 rounded-[12px] !px-[12px] text-[14px] font-poppins !text-grayscale-900 placeholder:text-grayscale-500"
                    />
                    <button
                        type="button"
                        onClick={handleImportOpenSaltFramework}
                        disabled={isImportingOpenSaltFramework || !openSaltRef.trim()}
                        className="bg-emerald-700 disabled:bg-grayscale-300 text-white py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center font-[600] text-[16px] font-notoSans"
                    >
                        {isImportingOpenSaltFramework ? 'Importing...' : 'Import & Sync OpenSALT'}
                    </button>
                </div>
            )}

            {!hideCreateFramework && (
                <button
                    type="button"
                    onClick={openCreateFrameworkModal}
                    className="bg-indigo-500 text-white py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center font-[600] text-[17px] font-notoSans leading-[24px] tracking-[0.25px] shadow-button-bottom"
                >
                    <Plus className="w-[25px] h-[25px]" />
                    Create Framework
                </button>
            )}
            <button
                type="button"
                onClick={closeModal}
                className="bg-white text-grayscale-900 py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-poppins leading-[24px] tracking-[-0.25px] shadow-button-bottom"
            >
                Back
            </button>
        </div>
    );
};

export default SelectFrameworkToManageModal;
