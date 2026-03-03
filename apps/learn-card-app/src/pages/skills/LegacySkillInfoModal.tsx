import React from 'react';

import { useModal } from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillDetails from './SkillDetails';
import { IonFooter } from '@ionic/react';

import { VC } from '@learncard/types';

type LegacySkillInfoModalProps = {
    skillName: string;
    skillDescription: string;
    iconSrc: string;
    credentials: VC[];
};

const LegacySkillInfoModal: React.FC<LegacySkillInfoModalProps> = ({
    skillName,
    skillDescription,
    iconSrc,
    credentials,
}) => {
    const { closeModal } = useModal();

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] pt-[60px] px-[20px] flex flex-col items-center justify-center">
                    <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 mt-[60px] w-full">
                        <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            <img src={iconSrc} alt={skillName} className="w-[80px] h-[80px]" />

                            <h2 className="text-[20px] text-grayscale-900 font-poppins">
                                {skillName}
                            </h2>

                            <div
                                className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden bg-violet-100`}
                            >
                                <PuzzlePiece
                                    className="w-[20px] h-[20px] text-grayscale-800"
                                    version="filled"
                                />
                                <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                                    Skill
                                </p>
                            </div>
                        </div>

                        {skillDescription && (
                            <div className="flex flex-col gap-[15px] p-[20px]">
                                <p className="text-grayscale-700 font-poppins text-[16px] tracking-[-0.25px]">
                                    {skillDescription}
                                </p>
                            </div>
                        )}
                    </section>

                    <SkillDetails frameworkId="" skillId="" credentials={credentials} />
                </div>
                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
                >
                    <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                        <button
                            onClick={closeModal}
                            className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                        >
                            Close
                        </button>
                    </div>
                </IonFooter>
            </div>
        </div>
    );
};

export default LegacySkillInfoModal;
