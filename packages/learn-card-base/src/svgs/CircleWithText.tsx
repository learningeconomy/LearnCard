import React from 'react';

type CircleTextProps = {
    className?: string;
    textClassName?: string;
    text: string;
};

const CircleText: React.FC<CircleTextProps> = ({ className = '', text, textClassName }) => {
    let _text = text;

    if (_text?.length >= 24) {
        _text = `${text.substring(0, 24)}...`;
    }

    return (
        <svg className={className} viewBox="0 0 100 100" fill="currentColor">
            <defs>
                <path
                    id="circle"
                    d="
                        M 50, 50
                        m 0, 38.5
                        a 38.5,38.5 0 1,1 0,-77
                        a 38.5,38.5 0 1,1 0,77"
                />
            </defs>
            <text
                textAnchor="middle"
                dy="0.25em"
                fontSize="12"
                className={`${textClassName}`}
            >
                <textPath xlinkHref="#circle" startOffset="50%">
                    {_text}
                </textPath>
            </text>
        </svg>
    );
};

export default CircleText;
