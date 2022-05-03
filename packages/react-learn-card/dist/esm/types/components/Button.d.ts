import React, { MouseEventHandler } from 'react';
declare type ButtonProps = {
    text?: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
};
declare const Button: React.FC<ButtonProps>;
export default Button;
