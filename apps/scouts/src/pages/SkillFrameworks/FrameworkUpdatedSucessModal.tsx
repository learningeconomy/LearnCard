import React from 'react';
import { conditionalPluralize, useModal } from 'learn-card-base';
import CheckCircle from 'learn-card-base/svgs/CheckCircle';
import FrameworkImage from './FrameworkImage';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

type FrameworkUpdatedSucessModalProps = {
    frameworkInfo: ApiFrameworkInfo;
    handleBrowseFramework?: () => void;
    onClose?: () => void;
    changeCounts: {
        skillsCreated: number;
        tiersCreated: number;
        skillsUpdated: number;
        tiersUpdated: number;
        skillsDeleted: number;
        tiersDeleted: number;
    };
    useCloseAllModals?: boolean;
};

const FrameworkUpdatedSucessModal: React.FC<FrameworkUpdatedSucessModalProps> = ({
    frameworkInfo,
    changeCounts,
    handleBrowseFramework,
    onClose,
    useCloseAllModals,
}) => {
    const { closeAllModals, closeModal } = useModal();

    const {
        skillsCreated,
        tiersCreated,
        skillsUpdated,
        tiersUpdated,
        skillsDeleted,
        tiersDeleted,
    } = changeCounts;

    return (
        <div className="flex flex-col gap-[10px] px-[20px]">
            <div className="flex flex-col items-center gap-[10px] px-[20px] py-[30px] bg-white rounded-[15px] overflow-hidden">
                <FrameworkImage
                    image={frameworkInfo.image}
                    sizeClassName="w-[75px] h-[75px]"
                    iconSizeClassName="w-[35px] h-[35px]"
                />

                <div className="flex gap-[5px] items-center text-emerald-501 font-poppins text-[22px] font-[600]">
                    <CheckCircle className="w-[30px] h-[30px]" color="currentColor" />
                    Update Successful
                </div>

                <div className="text-center text-[22px] font-poppins text-grayscale-900 space-y-[4px]">
                    {(skillsCreated > 0 || tiersCreated > 0) && (
                        <p>
                            {skillsCreated > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsCreated === 1
                                            ? '1 competency'
                                            : `${skillsCreated} competencies`}
                                    </strong>
                                    {tiersCreated > 0 && ' and '}
                                </>
                            )}
                            {tiersCreated > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {conditionalPluralize(tiersCreated, 'tier')}
                                </strong>
                            )}{' '}
                            {skillsCreated + tiersCreated === 1 ? 'has' : 'have'} been added
                        </p>
                    )}
                    {(skillsUpdated > 0 || tiersUpdated > 0) && (
                        <p>
                            {skillsUpdated > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsUpdated === 1
                                            ? '1 competency'
                                            : `${skillsUpdated} competencies`}
                                    </strong>
                                    {tiersUpdated > 0 && ' and '}
                                </>
                            )}
                            {tiersUpdated > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {conditionalPluralize(tiersUpdated, 'tier')}
                                </strong>
                            )}{' '}
                            {skillsUpdated + tiersUpdated === 1 ? 'has' : 'have'} been updated
                        </p>
                    )}
                    {(skillsDeleted > 0 || tiersDeleted > 0) && (
                        <p>
                            {skillsDeleted > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsDeleted === 1
                                            ? '1 competency'
                                            : `${skillsDeleted} competencies`}
                                    </strong>
                                    {tiersDeleted > 0 && ' and '}
                                </>
                            )}
                            {tiersDeleted > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {conditionalPluralize(tiersDeleted, 'tier')}
                                </strong>
                            )}{' '}
                            {skillsDeleted + tiersDeleted === 1 ? 'has' : 'have'} been removed
                        </p>
                    )}
                </div>
            </div>
            {handleBrowseFramework && (
                <button
                    onClick={() => {
                        closeModal();
                        handleBrowseFramework?.();
                    }}
                    className="bg-indigo-500 text-white py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center font-[600] text-[17px] font-notoSans leading-[24px] tracking-[0.25px] shadow-bottom-3-4"
                >
                    <SkillsFrameworkIcon className="w-[25px] h-[25px]" version="outlined" />
                    Browse Framework
                </button>
            )}
            <button
                onClick={() => {
                    if (useCloseAllModals) closeAllModals();
                    else closeModal();
                    onClose?.();
                }}
                className="bg-white text-grayscale-900 py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-poppins leading-[24px] tracking-[-0.25px] shadow-bottom-3-4"
            >
                Close
            </button>
        </div>
    );
};

export default FrameworkUpdatedSucessModal;
