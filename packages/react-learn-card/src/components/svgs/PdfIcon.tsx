import React from 'react';

type PdfIconProps = {
    className?: string;
};

const PdfIcon: React.FC<PdfIconProps> = ({ className }) => {
    return (
        <svg
            width="41"
            height="40"
            viewBox="0 0 41 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M5.5 4.66675C5.5 3.0099 6.84315 1.66675 8.5 1.66675H18.6813C21.3361 1.66675 23.8555 2.83885 25.5655 4.86953L33.3842 14.1542C34.7507 15.7769 35.5 17.8301 35.5 19.9515V35.3334C35.5 36.9903 34.1569 38.3334 32.5 38.3334H8.5C6.84315 38.3334 5.5 36.9903 5.5 35.3334V4.66675Z"
                fill="#FF3636"
            />
            <path d="M22 13V2.5C26 3.5 34.5 14 35.5 18H27C23 18 22 16 22 13Z" fill="#FF7A7A" />
            <path
                d="M15.626 25.024C15.626 25.5467 15.5 26.0367 15.248 26.494C15.0053 26.9513 14.618 27.32 14.086 27.6C13.5633 27.88 12.9007 28.02 12.098 28.02H10.46V31.772H8.5V22H12.098C12.854 22 13.498 22.1307 14.03 22.392C14.562 22.6533 14.9587 23.0127 15.22 23.47C15.4907 23.9273 15.626 24.4453 15.626 25.024ZM12.014 26.438C12.5553 26.438 12.9567 26.3167 13.218 26.074C13.4793 25.822 13.61 25.472 13.61 25.024C13.61 24.072 13.078 23.596 12.014 23.596H10.46V26.438H12.014Z"
                fill="white"
            />
            <path
                d="M20.1002 22C21.1269 22 22.0276 22.2007 22.8022 22.602C23.5862 23.0033 24.1882 23.5773 24.6082 24.324C25.0376 25.0613 25.2522 25.92 25.2522 26.9C25.2522 27.88 25.0376 28.7387 24.6082 29.476C24.1882 30.204 23.5862 30.7687 22.8022 31.17C22.0276 31.5713 21.1269 31.772 20.1002 31.772H16.6842V22H20.1002ZM20.0302 30.106C21.0569 30.106 21.8502 29.826 22.4102 29.266C22.9702 28.706 23.2502 27.9173 23.2502 26.9C23.2502 25.8827 22.9702 25.0893 22.4102 24.52C21.8502 23.9413 21.0569 23.652 20.0302 23.652H18.6442V30.106H20.0302Z"
                fill="white"
            />
            <path
                d="M32.4201 22V23.582H28.3461V26.088H31.4681V27.642H28.3461V31.772H26.3861V22H32.4201Z"
                fill="white"
            />
        </svg>
    );
};

export default PdfIcon;