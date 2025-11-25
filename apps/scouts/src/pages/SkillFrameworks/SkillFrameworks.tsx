import React from 'react';
import { useModal, ModalTypes, useWallet } from 'learn-card-base';
import { useQuery } from '@tanstack/react-query';
import { IonSpinner } from '@ionic/react';
import { ThreeDotVertical } from '@learncard/react';
import { SkillFrameworkType } from '@learncard/types';
import Plus from 'apps/scouts/src/components/svgs/Plus';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import ManageSkills from './ManageSkills';
import CreateFrameworkModal from './CreateFrameworkModal';
import SkillFrameworkActionMenu from './SkillFrameworkActionMenu';

const SkillFrameworks: React.FC = () => {
    const { newModal } = useModal();
    const { initWallet } = useWallet();

    // Fetch user's skill frameworks
    const {
        data: frameworks = [],
        isLoading,
        isError,
    } = useQuery<SkillFrameworkType[]>({
        queryKey: ['skillFrameworks'],
        queryFn: async () => {
            const wallet = await initWallet();
            return await wallet.invoke.listMySkillFrameworks();
        },
    });

    const handleManageSkills = () => {
        newModal(
            <ManageSkills />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
        );
    };

    const openCreateFrameworkModal = () => {
        newModal(
            <CreateFrameworkModal />,
            {
                sectionClassName: '!bg-transparent !shadow-none',
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <section className="h-full w-full overflow-y-auto flex flex-col gap-[20px]">
            <div className="bg-white max-w-[800px] w-full rounded-[15px] p-[15px] shadow-box-bottom flex flex-col gap-[20px]">
                <div className="flex flex-col gap-[5px]">
                    <h4 className="text-[20px] text-grayscale-900 text-left font-notoSans">
                        Manage Skill Frameworks
                    </h4>
                    <p className="text-[14px] text-grayscale-600 font-notoSans">
                        Manage and import skill frameworks.
                    </p>
                </div>

                <div className="flex flex-col gap-[10px]">
                    <button
                        onClick={openCreateFrameworkModal}
                        className="bg-indigo-500 text-white pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]"
                    >
                        <Plus className="w-[25px] h-[25px]" />
                        Create Framework
                    </button>

                    <button
                        onClick={handleManageSkills}
                        className="bg-grayscale-900 text-white pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]"
                    >
                        <UploadIcon className="w-[25px] h-[25px]" strokeWidth="2" />
                        Import Skills
                    </button>
                </div>

                {/* <div className="bg-grayscale-200 h-[1px]" /> */}

                {/* LCA will have Organization switcher here. Not applicable to Scouts */}
            </div>

            <div className="bg-white max-w-[800px] w-full rounded-[15px] p-[15px] shadow-box-bottom flex flex-col gap-[20px]">
                <h4 className="text-[20px] text-grayscale-900 text-left font-notoSans">
                    {frameworks.length} Skill Framework{frameworks.length !== 1 ? 's' : ''}
                </h4>

                {isLoading ? (
                    <div className="flex items-center justify-center py-[40px]">
                        <IonSpinner name="crescent" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-[40px]">
                        <p className="text-red-600 font-notoSans text-[14px]">
                            Failed to load frameworks. Please try again.
                        </p>
                    </div>
                ) : frameworks.length === 0 ? (
                    <div className="text-center py-[40px]">
                        <p className="text-grayscale-600 font-notoSans text-[14px]">
                            No frameworks yet. Create one to get started!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col text-grayscale-900">
                        {frameworks.map(framework => {
                            const createdDate = framework.createdAt
                                ? new Date(framework.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                  })
                                : 'Unknown date';

                            return (
                                <div
                                    key={framework.id}
                                    className="flex gap-[15px] py-[15px] border-b border-grayscale-200 last:border-b-0"
                                >
                                    {framework.image && (
                                        <img
                                            src={framework.image}
                                            alt={framework.name}
                                            className="w-[60px] h-[60px] rounded-[8px] object-cover flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex flex-col flex-1">
                                        <p className="text-[14px] font-[600] line-clamp-2 font-notoSans">
                                            {framework.name || 'Untitled Framework'}
                                        </p>
                                        {framework.description && (
                                            <p className="text-[12px] text-grayscale-600 font-notoSans line-clamp-1 mt-[2px]">
                                                {framework.description}
                                            </p>
                                        )}
                                        <p className="text-[12px] text-grayscale-500 font-notoSans mt-[4px]">
                                            Created {createdDate}
                                        </p>
                                    </div>
                                    <button
                                        className="ml-auto"
                                        onClick={() => {
                                            newModal(
                                                <SkillFrameworkActionMenu
                                                    frameworkId={framework.id}
                                                />
                                            );
                                        }}
                                    >
                                        <ThreeDotVertical className="text-[#A8ACBD]" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default SkillFrameworks;
