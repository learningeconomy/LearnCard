import React from 'react';

import useTheme from '../../../../theme/hooks/useTheme';

type InfoBoxProps = {
    text: string;
    handleClose: () => void;
    backgroundColor?: string;
};

const InfoBox: React.FC<InfoBoxProps> = ({ text, handleClose, backgroundColor = '#6366F1' }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const bgColorWithOpacity = `${backgroundColor}1F`; // 12% opacity
    return (
        <div
            className="info-box p-[10px] rounded-[10px] w-full font-notoSans text-grayscale-900 text-[12px] leading[18px]"
            style={{ backgroundColor: bgColorWithOpacity }}
        >
            {text}{' '}
            <button
                onClick={e => {
                    e.stopPropagation();
                    handleClose();
                }}
                className={`text-${primaryColor} font-[700] select-none`}
            >
                Close
            </button>
        </div>
    );
};

export default InfoBox;
