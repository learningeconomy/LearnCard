import React from 'react';

import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

export const AiPathwayCareerQualifications: React.FC<{ occupation: OccupationDetailsResponse }> = ({
    occupation,
}) => {
    const edu = occupation.EducationTraining;

    const qualifications = edu
        ? {
              education: edu.EducationTitle ?? 'No formal education required',
              experience: edu.ExperienceTitle ?? 'No prior experience required',
              training: edu.TrainingTitle,
          }
        : {
              education: 'Not specified',
              experience: 'Not specified',
          };

    const { education, experience } = qualifications;

    if (!education || !experience) return null;

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">
                    Education & Qualifications
                </h2>
            </div>

            <div className="w-full flex items-start justify-start gap-2">
                <p className="text-grayscale-800 text-sm text-left">
                    Most job listings for this role ask for a minimum of a{' '}
                    <span className="font-semibold">{education}</span>,{' '}
                    <span className="font-semibold">{experience}</span>
                    {qualifications.training && (
                        <>
                            , and{' '}
                            <span className="font-semibold">
                                {qualifications.training.toLowerCase()}
                            </span>
                        </>
                    )}
                    .
                </p>
            </div>
        </div>
    );
};

export default AiPathwayCareerQualifications;
