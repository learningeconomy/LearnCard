import React from 'react';
import * as m from '../../paraglide/messages.js';
import { useModal } from 'learn-card-base';
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
                                            {skillsCreated === 1
                                                ? m['skillFrameworks.compOne']()
                                                : m['skillFrameworks.compOther']({
                                                      count: skillsCreated,
                                                  })}
                                        </strong>
                                        {tiersCreated > 0 && m['skillFrameworks.andWord']()}
                                    </>
                                )}
                                {tiersCreated > 0 && (
                                    <strong className="font-[600] font-poppins">
                                        {tiersCreated === 1
                                            ? m['skillFrameworks.tierOne']()
                                            : m['skillFrameworks.tierOther']({
                                                  count: tiersCreated,
                                              })}
                                    </strong>
                                )}{' '}
                                {skillsCreated + tiersCreated === 1
                                    ? m['skillFrameworks.hasAdded']()
                                    : m['skillFrameworks.haveAdded']()}
                            </p>
                        )}
                        {(skillsUpdated > 0 || tiersUpdated > 0) && (
                            <p>
                                {skillsUpdated > 0 && (
                                    <>
                                        <strong className="font-[600] font-poppins">
                                            {skillsUpdated === 1
                                                ? m['skillFrameworks.compOne']()
                                                : m['skillFrameworks.compOther']({
                                                      count: skillsUpdated,
                                                  })}
                                        </strong>
                                        {tiersUpdated > 0 && m['skillFrameworks.andWord']()}
                                    </>
                                )}
                                {tiersUpdated > 0 && (
                                    <strong className="font-[600] font-poppins">
                                        {tiersUpdated === 1
                                            ? m['skillFrameworks.tierOne']()
                                            : m['skillFrameworks.tierOther']({
                                                  count: tiersUpdated,
                                              })}
                                    </strong>
                                )}{' '}
                                {skillsUpdated + tiersUpdated === 1
                                    ? m['skillFrameworks.hasUpdated']()
                                    : m['skillFrameworks.haveUpdated']()}
                            </p>
                        )}
                        {(skillsDeleted > 0 || tiersDeleted > 0) && (
                            <p>
                                {skillsDeleted > 0 && (
                                    <>
                                        <strong className="font-[600] font-poppins">
                                            {skillsDeleted === 1
                                                ? m['skillFrameworks.compOne']()
                                                : m['skillFrameworks.compOther']({
                                                      count: skillsDeleted,
                                                  })}
                                        </strong>
                                        {tiersDeleted > 0 && m['skillFrameworks.andWord']()}
                                    </>
                                )}
                                {tiersDeleted > 0 && (
                                    <strong className="font-[600] font-poppins">
                                        {tiersDeleted === 1
                                            ? m['skillFrameworks.tierOne']()
                                            : m['skillFrameworks.tierOther']({
                                                  count: tiersDeleted,
                                              })}
                                    </strong>
                                )}{' '}
                                {skillsDeleted + tiersDeleted === 1
                                    ? m['skillFrameworks.hasRemoved']()
                                    : m['skillFrameworks.haveRemoved']()}
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
                {m['common.cancel']()}
            </button>
        </div>
    );
};

export default ManageSkillsConfirmationModal;
