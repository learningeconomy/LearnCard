import React from 'react';

type ScoutsLogoProps = {
    className?: string;
    size?: string;
};

const ScoutsLogo: React.FC<ScoutsLogoProps> = ({ className = '', size = '25' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 25 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clipPath="url(#clip0_10755_290528)">
                <path
                    d="M24 13.3477C24 19.6989 18.8513 24.8477 12.5 24.8477C6.14873 24.8477 1 19.6989 1 13.3477C1 6.99638 6.14873 1.84766 12.5 1.84766C18.8513 1.84766 24 6.99638 24 13.3477Z"
                    fill="white"
                />
                <path
                    d="M12.1426 14.0634C12.1426 14.7372 12.1426 15.3402 12.149 15.8818H12.8519C12.8583 15.3402 12.8583 14.7405 12.8583 14.0634C12.8583 10.0042 12.7874 7.33138 12.5005 5.98047C12.2135 7.33461 12.1426 10.0042 12.1426 14.0634Z"
                    fill="#622599"
                />
                <path
                    d="M12.5 0.847656C5.59711 0.847656 0 6.44477 0 13.3477C0 20.2505 5.59711 25.8477 12.5 25.8477C19.4029 25.8477 25 20.2505 25 13.3477C25 6.44477 19.4029 0.847656 12.5 0.847656ZM8.47305 20.0539C7.40908 20.0539 6.88354 19.1318 7.17049 18.3547C7.57996 18.6256 8.04101 18.7352 8.48272 18.6159C9.03082 18.4644 9.41772 18.0033 9.59827 17.3972H10.5043C10.2592 19.222 9.39193 20.0539 8.46982 20.0539M12.5 22.7557C11.033 22.0206 9.97872 20.7761 9.97872 20.7761C10.7364 19.8153 11.1297 18.7384 11.2619 17.394H12.1744C12.2195 19.1318 12.3194 20.07 12.5 21.0179C12.6838 20.0732 12.7805 19.1318 12.8256 17.394H13.7381C13.8703 18.7384 14.2636 19.8153 15.0213 20.7761C15.0213 20.7761 13.9638 22.0206 12.5 22.7557ZM16.527 20.0539C15.6081 20.0539 14.7376 19.222 14.4925 17.3972H15.3985C15.5823 18.0033 15.966 18.4644 16.5141 18.6159C16.959 18.7384 17.42 18.6288 17.8263 18.3547C18.1132 19.1318 17.5877 20.0539 16.5237 20.0539M18.8483 16.4106C19.4255 15.2563 18.9257 14.0731 17.7973 13.8474C16.801 13.6507 15.6403 14.3439 15.3437 15.8786H16.2884C16.3819 16.0011 16.4431 16.1527 16.4431 16.3235C16.4431 16.4944 16.3819 16.646 16.2884 16.7685H8.71486C8.61491 16.6395 8.56332 16.4847 8.5601 16.3235C8.5601 16.1527 8.62136 16.0011 8.71486 15.8786H9.65953C9.36291 14.3439 8.20222 13.6507 7.20596 13.8474C6.07751 14.0731 5.57777 15.2531 6.15489 16.4106C4.60085 16.2397 3.39502 14.9339 3.39502 13.3477C3.39502 11.6453 4.78463 10.2654 6.49665 10.2654C8.87606 10.2654 10.4333 12.8253 10.5655 15.8786H11.3103C11.1878 12.3578 9.29843 10.9844 9.29843 8.65008C9.29843 6.12235 11.8971 3.84611 12.5 3.24642C13.1029 3.84288 15.7016 6.12235 15.7016 8.65008C15.7016 10.9876 13.8154 12.3578 13.6897 15.8786H14.4345C14.5699 12.8253 16.1239 10.2654 18.5034 10.2654C20.2186 10.2654 21.605 11.6453 21.605 13.3477C21.605 14.9339 20.3959 16.2397 18.8451 16.4106"
                    fill="#622599"
                />
            </g>
            <defs>
                <clipPath id="clip0_10755_290528">
                    <rect width="25" height="25" fill="white" transform="translate(0 0.847656)" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default ScoutsLogo;