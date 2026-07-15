import React from 'react';
import { useModal } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
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
                    {m['skillFrameworks.updSuccess']()}
                </div>

                <div className="text-center text-[22px] font-poppins text-grayscale-900 space-y-[4px]">
                    {(skillsCreated > 0 || tiersCreated > 0) && (
                        <p>
                            {skillsCreated > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsCreated === 1
                                            ? m['skillFrameworks.skillOne']()
                                            : m['skillFrameworks.skillOther']({ count: skillsCreated })}
                                    </strong>
                                    {tiersCreated > 0 && m['skillFrameworks.andWord']()}
                                </>
                            )}
                            {tiersCreated > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {tiersCreated === 1
                                        ? m['skillFrameworks.tierOne']()
                                        : m['skillFrameworks.tierOther']({ count: tiersCreated })}
                                </strong>
                            )}{' '}
                            {skillsCreated + tiersCreated === 1 ? m['skillFrameworks.hasAdded']() : m['skillFrameworks.haveAdded']()}
                        </p>
                    )}
                    {(skillsUpdated > 0 || tiersUpdated > 0) && (
                        <p>
                            {skillsUpdated > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsUpdated === 1
                                            ? m['skillFrameworks.skillOne']()
                                            : m['skillFrameworks.skillOther']({ count: skillsUpdated })}
                                    </strong>
                                    {tiersUpdated > 0 && m['skillFrameworks.andWord']()}
                                </>
                            )}
                            {tiersUpdated > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {tiersUpdated === 1
                                        ? m['skillFrameworks.tierOne']()
                                        : m['skillFrameworks.tierOther']({ count: tiersUpdated })}
                                </strong>
                            )}{' '}
                            {skillsUpdated + tiersUpdated === 1 ? m['skillFrameworks.hasUpdated']() : m['skillFrameworks.haveUpdated']()}
                        </p>
                    )}
                    {(skillsDeleted > 0 || tiersDeleted > 0) && (
                        <p>
                            {skillsDeleted > 0 && (
                                <>
                                    <strong className="font-[600] font-poppins">
                                        {skillsDeleted === 1
                                            ? m['skillFrameworks.skillOne']()
                                            : m['skillFrameworks.skillOther']({ count: skillsDeleted })}
                                    </strong>
                                    {tiersDeleted > 0 && m['skillFrameworks.andWord']()}
                                </>
                            )}
                            {tiersDeleted > 0 && (
                                <strong className="font-[600] font-poppins">
                                    {tiersDeleted === 1
                                        ? m['skillFrameworks.tierOne']()
                                        : m['skillFrameworks.tierOther']({ count: tiersDeleted })}
                                </strong>
                            )}{' '}
                            {skillsDeleted + tiersDeleted === 1 ? m['skillFrameworks.hasRemoved']() : m['skillFrameworks.haveRemoved']()}
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
                    {m['skillFrameworks.browseFw']()}
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
                {m['common.close']()}
            </button>
        </div>
    );
};

export default FrameworkUpdatedSucessModal;
