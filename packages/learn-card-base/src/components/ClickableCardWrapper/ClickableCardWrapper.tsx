import React, { useState } from 'react';

type ClickableCardWrapperProps = {
    children: React.ReactNode;
    cardProps?: any;
    onClick?: () => void; 
    initialCheckState?: boolean;
};

const ClickableCardWrapper: React.FC<ClickableCardWrapperProps> = ({ cardProps, children, onClick, initialCheckState = false }) => {
    const [isClicked, setIsClicked] = useState(initialCheckState || false);

    const handleClick = () => {
        setIsClicked(!isClicked);
        onClick?.();
    };

    return (
        <>
            {React.cloneElement(children, {
                ...cardProps,
                checked: isClicked,
                onCheckClick: handleClick,
            })}
        </>
    );
};

export default ClickableCardWrapper;
