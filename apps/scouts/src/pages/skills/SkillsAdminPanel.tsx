import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import Pencil from '../../components/svgs/Pencil';
import BrowseFrameworkPage from '../SkillFrameworks/BrowseFrameworkPage';
import CreateFrameworkModal from '../SkillFrameworks/CreateFrameworkModal';
import SkillsAdminPanelFramework from './SkillsAdminPanelFramework';
import SelectFrameworkToManageModal from '../SkillFrameworks/SelectFrameworkToManageModal';
import { IonSpinner } from '@ionic/react';

import {
    useModal,
    ModalTypes,
    conditionalPluralize,
    useListMySkillFrameworks,
} from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';
import { SkillFramework } from '../../components/boost/boost';

type SkillsAdminPanelProps = { setFrameworkToBrowse: SetState<SkillFramework | null> };

const SkillsAdminPanel: React.FC<SkillsAdminPanelProps> = ({ setFrameworkToBrowse }) => {
    const { newModal, closeModal } = useModal();

    const { data: frameworks = [], isLoading: isLoadingFrameworks } = useListMySkillFrameworks();

    const frameworksExist = frameworks?.length > 0;

    const openCreateFrameworkModal = () => {
        newModal(
            <CreateFrameworkModal />,
            {
                sectionClassName: '!bg-transparent !shadow-none',
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
        );
    };

    const openSelectFrameworkToManageModal = () => {
        newModal(
            <SelectFrameworkToManageModal />,
            {
                sectionClassName: '!bg-transparent !shadow-none !overflow-visible',
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    return (
        <section className="flex flex-col gap-[15px] w-full pb-[222px]">
            {isLoadingFrameworks && (
                <div className="flex items-center justify-center pt-[111px]">
                    <IonSpinner />
                </div>
            )}
            {!isLoadingFrameworks && (
                <>
                    <h2 className="text-left text-grayscale-900 text-[20px] font-poppins">
                        {conditionalPluralize(frameworks?.length, 'Skill Framework')}
                    </h2>

                    <div className="flex flex-col gap-[10px]">
                        <button
                            onClick={openCreateFrameworkModal}
                            className="flex items-center justify-center gap-[10px] pl-[20px] pr-[15px] py-[7px] rounded-[30px] bg-indigo-500 text-white text-[17px] font-notoSans font-[600] leading-[24px] tracking-[0.25px]"
                        >
                            <Plus className="w-[25px] h-[25px]" />
                            Create Framework
                        </button>
                        {frameworksExist && (
                            <button
                                onClick={openSelectFrameworkToManageModal}
                                className="flex items-center justify-center gap-[10px] pl-[20px] pr-[15px] py-[7px] rounded-[30px] bg-grayscale-900 text-white text-[17px] font-notoSans font-[600] leading-[24px] tracking-[0.25px]"
                            >
                                <Pencil className="w-[25px] h-[25px]" version={3} />
                                {/* <PuzzlePiece version="with-plus" className="w-[25px] h-[25px]" /> */}
                                Manage Skills
                            </button>
                        )}
                    </div>

                    {frameworksExist && (
                        <div className="flex flex-col gap-[15px] border-t-[1px] border-violet-300 border-solid pt-[15px]">
                            {/* @ts-ignore */}
                            {frameworks?.map((framework, index) => (
                                <SkillsAdminPanelFramework
                                    key={index}
                                    framework={framework}
                                    buttonClassName="flex gap-[10px] p-[10px] bg-white rounded-[15px] shadow-bottom-2-4 items-center text-left"
                                    onClick={() => {
                                        newModal(
                                            <BrowseFrameworkPage
                                                frameworkInfo={framework}
                                                handleClose={closeModal}
                                            />,
                                            undefined,
                                            {
                                                desktop: ModalTypes.FullScreen,
                                                mobile: ModalTypes.FullScreen,
                                            }
                                        );
                                        // setFrameworkToBrowse(framework);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default SkillsAdminPanel;
