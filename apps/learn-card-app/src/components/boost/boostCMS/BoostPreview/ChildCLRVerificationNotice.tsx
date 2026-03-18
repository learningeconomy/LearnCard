import React from 'react';

import AcuteCheckmark from './AcuteCheckmark';

const ChildCLRVerificationNotice: React.FC = () => {
    return (
        <div className="verifications-box bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom-2-4 px-[15px] py-[20px] w-full relative">
            <h3 className="text-[17px] font-notoSans text-grayscale-900">Credential Verifications</h3>
            <div className="w-full rounded-[12px] border border-grayscale-200 bg-grayscale-50 px-[12px] py-[10px]">
                <span className="font-[700] text-[11px] leading-[16px] uppercase flex items-center gap-[3px] select-none text-[#39B54A] mb-[6px]">
                    <AcuteCheckmark />
                    SUCCESS
                </span>
                <p className="text-grayscale-700 text-[13px] leading-[18px] font-poppins">
                    This achievement is verified through the parent CLR credential signature.
                </p>
            </div>
        </div>
    );
};

export default ChildCLRVerificationNotice;
