import React from 'react';

type CircleTextProps = {
    className?: string;
    text: string;
};

const CircleText: React.FC<CircleTextProps> = ({ className = '', text }) => {
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
                        m 0, 37
                        a 37,37 0 1,1 0,-74
                        a 37,37 0 1,1 0,74"
                />
            </defs>
            <text textAnchor="middle" dominantBaseline="middle" fontSize="12">
                <textPath xlinkHref="#circle" startOffset="50%">
                    {_text}
                </textPath>
            </text>
        </svg>
    );
};

export default CircleText;
