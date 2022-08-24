import React from 'react';
import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';
import CircleIcon from '../CircleIcon/CircleIcon';

import coinsGraphic from '../../assets/images/wallet-currency.png';
import idsGraphic from '../../assets/images/wallet-ids.png';
import jobhistoryGraphic from '../../assets/images/wallet-jobhistory.png';
import learningHistoryGraphic from '../../assets/images/wallet-learninghistory.png';
import skillsGraphic from '../../assets/images/wallet-skills.png';
import achievementsGraphic from '../../assets/images/walletTrophy.png';

export type RoundedSquareProps = {
    title?: string;
    description?: string;
    type?: string;
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
};

const TYPE_TO_IMG_SRC = {
    ['achievements']: achievementsGraphic,
    ['ids']: idsGraphic,
    ['jobHistory']: jobhistoryGraphic,
    ['learningHistory']: learningHistoryGraphic,
    ['currency']: coinsGraphic,
    ['skills']: skillsGraphic,
};

export const RoundedSquare: React.FC<RoundedSquareProps> = ({
    title = 'Learning History',
    description = 'Lorem ipsum sit dalor amet',
    iconSrc = ICONS_TO_SOURCE[Icons.coinsIcon],
    type = 'achievements',
    count = '28',
    onClick = () => {},
    bgColor = 'bg-cyan-200',
}) => {
    const imgSrc = TYPE_TO_IMG_SRC[type];

    return (
        <button
            onClick={onClick}
            className={`flex relative ${bgColor}  py-[15px] px-[15px] w-[170px] h-[170px] rounded-[40px] rounded-square-card-container`}
        >
            <div className="w-full py-[10px] relative">
                <h3 className="line-clamp-2 font-bold text-[17px] text-grayscale-900">{title}</h3>
            </div>

            <div className="flex w-full justify-end icon-display absolute right-[20px] bottom-[15px] max-h-[50px] max-w-[50px]">
                <img src={imgSrc} />
            </div>
        </button>
    );
};

export default RoundedSquare;
