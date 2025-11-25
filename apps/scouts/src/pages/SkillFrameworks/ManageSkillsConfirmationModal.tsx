import React from 'react';
import { conditionalPluralize, useModal } from 'learn-card-base';
import ExclamationCircle from 'learn-card-base/svgs/ExclamationCircle';

type ManageSkillsConfirmationModalProps = {
    onConfirm: () => void;
    mainText: string;
    secondaryText?: string;
    confirmationButtonText: string;
    changeCounts?: {
        skillsCreated: number;
        tiersCreated: number;
        skillsUpdated: number;
        tiersUpdated: number;
        skillsDeleted: number;
        tiersDeleted: number;
    };
};

const ManageSkillsConfirmationModal: React.FC<ManageSkillsConfirmationModalProps> = ({
    onConfirm,
    mainText,
    secondaryText,
    confirmationButtonText,
    changeCounts,
}) => {
    const { closeModal } = useModal();
    const {
        skillsCreated = 0,
        tiersCreated = 0,
        skillsUpdated = 0,
        tiersUpdated = 0,
        skillsDeleted = 0,
        tiersDeleted = 0,
    } = changeCounts ?? {};
    return (
        <div className="flex flex-col gap-[10px] px-[20px]">
            <div className="bg-white rounded-[15px] flex flex-col items-center gap-[10px] px-[20px] py-[30px]">
                <ExclamationCircle className="w-[60px] h-[60px] text-indigo-600" />
                <h2 className="text-[22px] font-[600] font-poppins text-grayscale-900">
                    {mainText}
                </h2>

                {secondaryText && (
                    <p className="text-[22px] font-poppins text-grayscale-900 leading-[130%] tracking-[-0.25px] text-center">
                        {secondaryText}
                    </p>
                )}

                {changeCounts && (
                    <div className="text-center text-[20px] font-poppins text-grayscale-900 space-y-[4px]">
                        {(skillsCreated > 0 || tiersCreated > 0) && (
                            <p>
                                {skillsCreated > 0 && (
                                    <>
                                        <strong className="font-[600] font-poppins">
                                            {conditionalPluralize(skillsCreated, 'skill')}
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
                                            {conditionalPluralize(skillsUpdated, 'skill')}
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
                                            {conditionalPluralize(skillsDeleted, 'skill')}
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
                )}
            </div>

            <button
                onClick={() => {
                    onConfirm();
                    closeModal();
                }}
                className="bg-emerald-501 text-white rounded-[30px] px-[20px] py-[10px] shadow-bottom-4-4 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px]"
            >
                {confirmationButtonText}
            </button>

            <button
                onClick={closeModal}
                className="bg-grayscale-10 rounded-[30px] px-[20px] py-[10px] shadow-bottom-4-4 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] text-grayscale-900"
            >
                Cancel
            </button>
        </div>
    );
};

export default ManageSkillsConfirmationModal;
