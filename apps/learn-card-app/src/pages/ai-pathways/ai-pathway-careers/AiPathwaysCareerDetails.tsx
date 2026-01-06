import React from 'react';

import { IonFooter } from '@ionic/react';
import AiPathwayCareerHeader from './AiPathwayCareerHeader';
import AiPathwayCareerSkills from './AiPathwayCareerSkills';
import AiPathwayCareerSalaries from './AiPathwayCareerSalaries';

import { useModal } from 'learn-card-base';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

const AiPathwayCareerDetails: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    const { closeModal } = useModal();

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] px-[20px] flex flex-col gap-[20px] items-center justify-start">
                    <AiPathwayCareerHeader career={career} />

                    <AiPathwayCareerSalaries career={career} />

                    <AiPathwayCareerSkills career={career} />
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
                        <button className="p-[11px] bg-emerald-700 rounded-full text-white shadow-button-bottom flex-1 font-poppins text-[17px] font-semibold">
                            Start
                        </button>
                    </div>
                </IonFooter>
            </div>
        </div>
    );
};

export default AiPathwayCareerDetails;
