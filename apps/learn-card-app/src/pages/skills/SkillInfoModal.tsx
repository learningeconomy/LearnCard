import React, { useState } from 'react';

import { useModal } from 'learn-card-base';

import { IonFooter } from '@ionic/react';
import SkillDetails from './SkillDetails';

import { VC } from '@learncard/types';
import MainSkillInfoBox from './MainSkillInfoBox';
import SkillIssuances from './SkillIssuances';
import SkillFrameworkInfoBox from './SkillFrameworkInfoBox';
import RelatedSkills from './RelatedSkills';

type SkillInfoModalProps = {
    frameworkId: string;
    skillId: string;
    credentials: VC[];
};

enum SkillTabEnum {
    Skill = 'Skill',
    Details = 'Details',
}

const SkillInfoModal: React.FC<SkillInfoModalProps> = ({ frameworkId, skillId, credentials }) => {
    const { closeModal } = useModal();

    const [selectedTab, setSelectedTab] = useState<SkillTabEnum>(SkillTabEnum.Skill);

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-100">
                <div className="h-full overflow-y-auto pb-[150px] pt-[40px] px-[20px]">
                    <div className="w-full max-w-[600px] flex flex-col items-center gap-[25px] mx-auto">
                        <div className="flex items-start w-full">
                            {Object.keys(SkillTabEnum).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedTab(tab as SkillTabEnum)}
                                    className={`text-[14px] font-[500] font-poppins px-[14px] py-[7px] rounded-[5px] ${
                                        tab === selectedTab
                                            ? 'bg-grayscale-200 text-grayscale-900'
                                            : 'text-grayscale-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {selectedTab === SkillTabEnum.Skill && (
                            <>
                                <MainSkillInfoBox frameworkId={frameworkId} skillId={skillId} />
                                <SkillIssuances
                                    frameworkId={frameworkId}
                                    skillId={skillId}
                                    credentials={credentials}
                                />
                            </>
                        )}
                        {selectedTab === SkillTabEnum.Details && (
                            <>
                                <SkillFrameworkInfoBox
                                    frameworkId={frameworkId}
                                    skillId={skillId}
                                />
                                <RelatedSkills frameworkId={frameworkId} skillId={skillId} />
                            </>
                        )}
                    </div>
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

export default SkillInfoModal;
