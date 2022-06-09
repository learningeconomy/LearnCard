import React, { useState } from 'react';

export type FlippyCardProps = {
    children: React.ReactChild[];
};

const FRONT_FACE = 'front';
const BACK_FACE = 'back';

export const FlippyCard: React.FC<FlippyCardProps> = ({ children }) => {
    const [flipState, setFlipState] = useState(FRONT_FACE);

    if (children?.length > 3) {
        console.warn('More than two children passed into Flippy Card! 😳😳😳 Picking first two...');
    }

    if (!children) return <></>;

    const frontCard = children?.[0];
    const backCard = children?.[1] || children?.[0];

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
