import React, { MouseEventHandler } from 'react'

export type ButtonProps = {
    text?: string;        
    onClick: MouseEventHandler<HTMLButtonElement>;
};

const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
    return (
        <button type="button" onClick={onClick} >
            {text}
        </button>   
    )
}

export default Button;
