import React from 'react';
import { useT } from '../../i18n';

type InfoBoxProps = {
    text: string;
    handleClose: () => void;
    backgroundColor?: string;
};

const InfoBox: React.FC<InfoBoxProps> = ({ text, handleClose, backgroundColor = '#6366F1' }) => {
    const t = useT();
    const bgColorWithOpacity = `${backgroundColor}1F`; // 12% opacity
    return (
        <div
            className="info-box p-[10px] rounded-[10px] w-full font-poppins text-[12px] leading[18px]"
            style={{ backgroundColor: bgColorWithOpacity }}
        >
            {text}{' '}
            <button
                onClick={e => {
                    e.stopPropagation();
                    handleClose();
                }}
                className="text-indigo-500 font-[700] select-none"
            >
                {t('credential.close')}
            </button>
        </div>
    );
};

export default InfoBox;
