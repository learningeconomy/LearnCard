import React from 'react';

import { IonFooter } from '@ionic/react';
import AiPathwayCareerHeader from './AiPathwayCareerHeader';
import AiPathwayCareerSkills from './AiPathwayCareerSkills';
import AiPathwayCareerSalaries from './AiPathwayCareerSalaries';
import AiPathwayTopPayLocations from './AiPathwayTopPayLocations';
import AiPathwayCareerJobGrowthInfo from './AiPathwayCareersJobGrowthInfo';
import AiPathwayCareerQualifications from './AiPathwayCareerQualifications';
import AiPathwayCareerQualitativeInsights from './AiPathwayCareerQualitativeInsights';

import { useModal } from 'learn-card-base';

import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

const AiPathwayCareerDetails: React.FC<{ occupation: OccupationDetailsResponse }> = ({
    occupation,
}) => {
    const { closeModal } = useModal();

    console.log(occupation);

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] px-[20px] flex flex-col gap-[20px] items-center justify-start">
                    <AiPathwayCareerHeader occupation={occupation} />

                    <AiPathwayCareerSalaries occupation={occupation} />

                    {/* 

                    <AiPathwayCareerSkills career={career} />

                    <AiPathwayCareerQualitativeInsights career={career} />

                    <AiPathwayCareerJobGrowthInfo career={career} />

                    <AiPathwayCareerQualifications career={career} />

                    <AiPathwayTopPayLocations career={career} /> */}
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

export default AiPathwayCareerDetails;
