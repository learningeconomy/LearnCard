import React from 'react';

type InfoBoxProps = {
    text: string;
    handleClose: () => void;
};

const InfoBox: React.FC<InfoBoxProps> = ({ text, handleClose }) => {
    return (
        <div className="bg-indigo-50 p-[5px] rounded-[10px] w-full font-poppins text-[12px] leading[18px]">
            {text}{' '}
            <button onClick={handleClose} className="text-indigo-500 font-[700]">
                Close
            </button>
        </div>
    );
};

export default InfoBox;
