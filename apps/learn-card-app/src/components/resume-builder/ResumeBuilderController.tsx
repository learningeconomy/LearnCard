import React from 'react';
import { useHistory } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import SlimCaretRight from '../svgs/SlimCaretRight';
import ResumeBuilderIcon from '../../assets/images/resume-builder-icon.png';

import useLCNGatedAction from '../network-prompts/hooks/useLCNGatedAction';
type ResumeBuilderControllerMode = 'default' | 'inline';

export const ResumeBuilderController: React.FC<{
    className?: string;
    mode?: ResumeBuilderControllerMode;
}> = ({ className = '', mode = 'default' }) => {
    const flags = useFlags();
    const history = useHistory();
    const { gate } = useLCNGatedAction();

    const handleResumeBuilderButton = async () => {
        const { prompted } = await gate();
        if (prompted) return;
        history.push('/resume-builder');
    };

    if (!flags?.enableResumeBuilder) return null;

    const resumeExists = false; // TODO: Check if resume exists

    if (mode === 'inline') {
        return (
            <div
                role="button"
                onClick={handleResumeBuilderButton}
                className={`w-full h-[150px] max-h-[150px] bg-white rounded-[28px] p-4 flex flex-col justify-start shadow-[0_8px_20px_rgba(15,23,42,0.12)] overflow-hidden ${className}`}
            >
                <div className="flex justify-center mb-2">
                    <div className="rounded-[14px] p-[8px] bg-white">
                        <img
                            src={ResumeBuilderIcon}
                            alt="Resume Builder"
                            className="w-[36px] h-[36px]"
                        />
                    </div>
                </div>

                <h5 className="text-[17px] leading-[130%] font-poppins font-[600] text-grayscale-900 text-center">
                    Resume Builder
                </h5>
                <p className="mt-1 text-[13px] leading-[125%] text-grayscale-700 font-poppins text-center line-clamp-2">
                    Create &amp; share your resume built with your LearnCard credentials.
                </p>
            </div>
        );
    }

    return (
        <div
            role="button"
            onClick={handleResumeBuilderButton}
            className={`w-full flex items-center justify-between max-w-[900px] bg-white rounded-[15px] p-[10px] shadow-[0_8px_20px_rgba(15,23,42,0.12)] ${className}`}
        >
            <div className="flex items-center gap-[10px]">
                <div className={`rounded-[10px] p-[5px] bg-white max-h-[40px] max-w-[40px]`}>
                    <img
                        src={ResumeBuilderIcon}
                        alt="Resume Builder"
                        className="w-[30px] h-[30px]"
                    />
                    {/* <IonIcon
                        color="grayscale-600"
                        icon={documentTextOutline}
                        className="w-[30px] h-[30px]"
                    /> */}
                </div>
                <div className="flex flex-col">
                    <h5 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[130%]">
                        {resumeExists ? 'Your Resume' : 'Build Your Resume'}
                    </h5>
                    <p className="text-[14px] text-grayscale-900 font-poppins">
                        {resumeExists ? (
                            <span>
                                Updated <span className="font-semibold">today</span>
                            </span>
                        ) : (
                            'Stand out with a tailored resume'
                        )}
                    </p>
                </div>
            </div>
            <button className="cursor-pointer">
                <SlimCaretRight className="w-[20px] h-[20px] text-grayscale-400" />
            </button>
        </div>
    );
};

export default ResumeBuilderController;
