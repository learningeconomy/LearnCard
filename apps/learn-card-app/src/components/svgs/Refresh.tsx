import React from 'react';

const Refresh: React.FC<{ className?: string; color?: string }> = ({
    className = '',
    color = '#6366F1',
}) => (
    <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M5.33164 9.90311C5.87978 7.99154 7.01901 6.30257 8.58605 5.07826C10.1531 3.85396 12.0675 3.15717 14.0549 3.08777C16.0423 3.01837 18.0006 3.57991 19.6493 4.69193C21.2979 5.80394 22.5522 7.40933 23.2323 9.27801"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M23.0595 16.162C22.3511 17.8409 21.1708 19.2782 19.6618 20.2996C18.1528 21.321 16.3799 21.8826 14.558 21.9164C12.7361 21.9501 10.9436 21.4546 9.39773 20.4898C7.8519 19.525 6.6192 18.1324 5.8491 16.481"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7.95209 15.5586L5.27818 15.9551L3.99105 18.3321"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M20.889 10.1367L23.5629 9.7402L24.85 7.36317"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default Refresh;
