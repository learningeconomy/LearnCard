import React from 'react';

type InfoBoxProps = {
    text: string;
    handleClose: () => void;
    backgroundColor?: string;
};

const InfoBox: React.FC<InfoBoxProps> = ({ text, handleClose, backgroundColor = '#6366F1' }) => {
    const bgColorWithOpacity = `${backgroundColor}1F`; // 12% opacity
    return (
        <div
            className="info-box p-[10px] rounded-[10px] w-full font-poppins text-[12px] leading[18px]"
            style={{ backgroundColor: bgColorWithOpacity }}
        >
            {text}{' '}
            <button onClick={handleClose} className="text-indigo-500 font-[700] select-none">
                Close
            </button>
        </div>
    );
};

export default InfoBox;
