import React from 'react';
import numeral from 'numeral';

import { IonFooter } from '@ionic/react';
import AiPathwayCareerPipeChart from './AiPathwayCareerPipeChart';
import CareerLaptopIcon from '../../../assets/images/career.laptop.icon.png';

import { useModal } from 'learn-card-base';

import { type AiPathwayCareer, getSalaryStats } from './ai-pathway-careers.helpers';

const AiPathwayCareerDetails: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    const { closeModal } = useModal();

    const { medianSalary, minSalary, maxSalary } = getSalaryStats(career.salaryData);

    return (
        <div
            onClick={e => e.stopPropagation()}
            className="flex flex-col gap-[10px] bg-transparent mx-auto cursor-auto min-w-[300px] h-full"
        >
            <div className="h-full relative overflow-hidden bg-grayscale-200">
                <div className="h-full overflow-y-auto pb-[150px] px-[20px] flex flex-col gap-[20px] items-center justify-start">
                    <div className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 mt-[60px] w-full">
                        {/* header */}
                        <div className="flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            <img
                                src={CareerLaptopIcon}
                                alt="career icon"
                                className="w-[80px] h-[80px]"
                            />

                            <h2 className="text-[20px] text-grayscale-900 font-poppins">
                                {career.title}
                            </h2>
                        </div>

                        {/* description */}
                        <div className="flex flex-col gap-[10px] items-start justify-start p-[20px]">
                            <p className="text-grayscale-600 font-poppins text-base tracking-[-0.25px]">
                                {career.description}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
                        <div className="w-full flex items-center justify-start">
                            <h2 className="text-xl text-grayscale-800 font-notoSans">
                                {career.title} Salaries
                            </h2>
                        </div>

                        {/* salary */}
                        <div className="w-full flex flex-col items-center justify-start">
                            <div className="w-full flex items-center justify-start">
                                <span className="text-base font-semibold gradient-salary">
                                    ${numeral(medianSalary).format('0,0')}
                                </span>
                                <span className="text-grayscale-600 text-sm">/yr </span>
                            </div>

                            <div className="w-full flex items-center justify-start">
                                <p className="text-grayscale-600 text-sm">
                                    Avg. Base Salary | Range: ${numeral(minSalary).format('0a')} - $
                                    {numeral(maxSalary).format('0a')}
                                </p>
                            </div>
                        </div>

                        <AiPathwayCareerPipeChart career={career} />
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
