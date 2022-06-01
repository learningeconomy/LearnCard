import React from 'react';

import './FlippyCard.css';

export type FlippyCardProps = {
    frontCard: JSX.Element;
    backCard: JSX.Element;
};

const FlippyCard: React.FC<FlippyCardProps> = ({ frontCard, backCard }) => {
    return (
        <div className="flippy-wrapper-container">
            <div className="flippy-card">
                <section className="card-face card-face--front">{frontCard}</section>
                <section className="card-face card-face--back">{backCard}</section>
            </div>
        </div>
    );
};

export default FlippyCard;
