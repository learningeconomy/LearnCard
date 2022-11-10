import React from 'react';

export type FlippyCardProps = {
    children: React.ReactChild[];
    flipState?: 'front' | 'back' | undefined | string;
};

export const FlippyCard: React.FC<FlippyCardProps> = ({ children, flipState }) => {
    console.log('//flipState', flipState)
    if (children?.length > 3) {
        console.warn('More than two children passed into Flippy Card! 😳😳😳 Picking first two...');
    }

    if (!children) return <></>;

    const frontCard = children?.[0] as React.ReactNode;
    const backCard = (children?.[1] as React.ReactNode) || (children?.[0] as React.ReactNode);

    const flipCardCSSClass = flipState === 'front' ? 'flippy-card' : 'flippy-card is-flipped';

    return (
        <div data-testid="flippy-card-wrapper" className="flippy-wrapper-container">
            <div data-testid="flippy-card" className={flipCardCSSClass}>
                <section data-testid="flippy-card-front" className="card-face card-face--front">
                    {frontCard}
                </section>
                <section data-testid="flippy-card-back" className="card-face card-face--back">
                    {backCard}
                </section>
            </div>
        </div>
    );
};

export default FlippyCard;
