import React, { useState } from 'react';

import './FlippyCard.css';

export type FlippyCardProps = {
    children: React.ReactChild[];
};

const FRONT_FACE = 'front';
const BACK_FACE = 'back';

const FlippyCard: React.FC<FlippyCardProps> = ({ children }) => {
    const [flipState, setFlipState] = useState(FRONT_FACE);

    const frontCard = children?.[0];
    const backCard = children?.[1];

    const handleClick = () => {
        if (flipState === FRONT_FACE) setFlipState(BACK_FACE);
        if (flipState === BACK_FACE) setFlipState(FRONT_FACE);
    };

    const flipCardCSSClass = flipState === FRONT_FACE ? 'flippy-card' : 'flippy-card is-flipped';

    return (
        <div className="flippy-wrapper-container">
            <div className={flipCardCSSClass} onClick={handleClick}>
                <section className="card-face card-face--front">{frontCard}</section>
                <section className="card-face card-face--back">{backCard}</section>
            </div>
        </div>
    );
};

export default FlippyCard;
