import React from 'react';

import SlimCaretRight from '../svgs/SlimCaretRight';

export const SwitchAccountButton: React.FC<{ handleAccountSwitcher: () => void }> = ({
    handleAccountSwitcher,
}) => {
    return (
        <button
            onClick={handleAccountSwitcher}
            className="w-full flex gap-[10px] justify-center items-center text-grayscale-900 font-notoSans text-[14px] font-[600] rounded-[20px] bg-grayscale-100 py-[5px] px-[20px] shadow-box-bottom"
        >
            Switch Account
            <SlimCaretRight className="rotate-90 h-[15px] w-[15px]" />
        </button>
    );
};

export default SwitchAccountButton;
