import React from 'react';

import { AwardRibbon, VCVerificationCheckWithSpinner } from '@learncard/react';
import { VerificationStatusEnum } from '@learncard/types';

const VerifiedChildCLRFooter: React.FC = () => {
    return (
        <>
            <VCVerificationCheckWithSpinner spinnerSize="40px" size={'32px'} loading={false} />
            <div className="vc-footer-text font-montserrat flex flex-col items-center justify-center text-[12px] font-[700] leading-[15px] select-none">
                <span className="text-[#4F4F4F]">Verified Credential</span>
                <span className="vc-footer-status uppercase" style={{ color: '#39B54A' }}>
                    {VerificationStatusEnum.Success}
                </span>
            </div>
            <div
                className="vc-footer-icon rounded-[20px] h-[40px] w-[40px] flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#6366F1' }}
            >
                <AwardRibbon />
            </div>
        </>
    );
};

export default VerifiedChildCLRFooter;
