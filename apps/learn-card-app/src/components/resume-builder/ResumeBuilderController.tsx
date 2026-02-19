import React from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonIcon } from '@ionic/react';
import SlimCaretRight from '../svgs/SlimCaretRight';
import { documentTextOutline } from 'ionicons/icons';
import useLCNGatedAction from '../network-prompts/hooks/useLCNGatedAction';

import { useTheme } from '../../theme/hooks/useTheme';
import { useModal, ModalTypes } from 'learn-card-base';

export const ResumeBuilderController: React.FC<{ className?: string }> = ({ className = '' }) => {
    const flags = useFlags();
    const { newModal } = useModal();
    const { gate } = useLCNGatedAction();

    const { theme, colors } = useTheme();

    const handleResumeBuilderButton = async () => {
        const { prompted } = await gate();
        if (prompted) return;
        newModal(
            <div>Resume Builder</div>,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (!flags?.enableResumeBuilder) return null;

    const resumeExists = false; // TODO: Check if resume exists

    return (
        <div
            role="button"
            onClick={handleResumeBuilderButton}
            className={`w-full flex items-center justify-between max-w-[900px] bg-grayscale-100 rounded-[15px] p-[10px] ${className}`}
        >
            <div className="flex items-center gap-[10px]">
                <div className={`rounded-[10px] p-[5px] bg-white max-h-[40px] max-w-[40px]`}>
                    <IonIcon
                        color="grayscale-600"
                        icon={documentTextOutline}
                        className="w-[30px] h-[30px]"
                    />
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
