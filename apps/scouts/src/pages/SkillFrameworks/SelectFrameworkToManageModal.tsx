import React from 'react';
import { useCanManageCompetencies } from '../../hooks/useCanManageCompetencies';
import { useDismissCompetencyAdminModal } from './withCompetencyAdmin';
import * as m from '../../paraglide/messages.js';

import { useModal, useListMySkillFrameworks, ModalTypes } from 'learn-card-base';

import Plus from 'learn-card-base/svgs/Plus';
import ManageSkills from './ManageSkills';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import CreateFrameworkModal from './CreateFrameworkModal';
import SkillsAdminPanelFramework from '../skills/SkillsAdminPanelFramework';
import { IonSpinner } from '@ionic/react';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

type SelectFrameworkToManageModalProps = {
    onFrameworkSelectOverride?: (framework: ApiFrameworkInfo) => void;
    hideCreateFramework?: boolean;
};

const SelectFrameworkToManageModalContent: React.FC<SelectFrameworkToManageModalProps> = ({
    onFrameworkSelectOverride,
    hideCreateFramework,
}) => {
    const { closeModal, newModal } = useModal();
    const { data: frameworks = [], isLoading: isLoadingFrameworks } = useListMySkillFrameworks();

    const openCreateFrameworkModal = () => {
        closeModal();
        setTimeout(() => {
            newModal(
                <CreateFrameworkModal />,
                {
                    sectionClassName: 'bg-transparent! shadow-none!',
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
                    {m['skillFrameworks.selectFw']()}
                </h2>

                {isLoadingFrameworks && (
                    <div className="flex items-center justify-center py-[111px] text-grayscale-900">
                        <IonSpinner />
                    </div>
                )}

                {frameworks?.map((framework, index) => (
                    <SkillsAdminPanelFramework
                        key={index}
                        framework={framework}
                        buttonClassName="flex gap-[10px] py-[15px] bg-white items-center text-left w-full"
                        onClick={() => {
                            closeModal();
                            setTimeout(() => {
                                if (onFrameworkSelectOverride) {
                                    onFrameworkSelectOverride(framework);
                                } else {
                                    newModal(
                                        <ManageSkills initialFrameworkId={framework.id} />,
                                        {
                                            sectionClassName: 'bg-transparent! shadow-none!',
                                        },
                                        { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
                                    );
                                }
                            }, 300);
                        }}
                    />
                ))}
            </div>
            {!hideCreateFramework && (
                <button
                    onClick={openCreateFrameworkModal}
                    className="bg-indigo-500 text-white py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center font-[600] text-[17px] font-notoSans leading-[24px] tracking-[0.25px] shadow-button-bottom"
                >
                    <Plus className="w-[25px] h-[25px]" />
                    {m['skillFrameworks.createFw']()}
                </button>
            )}
            <button
                onClick={closeModal}
                className="bg-white text-grayscale-900 py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-poppins leading-[24px] tracking-[-0.25px] shadow-button-bottom"
            >
                {m['common.back']()}
            </button>
        </div>
    );
};

const SelectFrameworkToManageModal: React.FC<SelectFrameworkToManageModalProps> = props => {
    const canManageCompetencies = useCanManageCompetencies();
    const canSelectFramework = canManageCompetencies || Boolean(props.onFrameworkSelectOverride);
    useDismissCompetencyAdminModal(canSelectFramework);

    // Badge authors can select existing competencies without managing the framework.
    if (!canSelectFramework) return null;

    return (
        <SelectFrameworkToManageModalContent
            {...props}
            hideCreateFramework={props.hideCreateFramework || !canManageCompetencies}
        />
    );
};

export default SelectFrameworkToManageModal;
