import React from 'react';

type InfoIconProps = {
    className?: string;
    color?: string;
};

const InfoIcon: React.FC<InfoIconProps> = ({ className = '', color = '#A8ACBD' }) => {
    return (
        <svg
            width="22"
            height="21"
            viewBox="0 0 22 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M11.0003 0.34375C8.99153 0.34375 7.02793 0.939404 5.35774 2.05539C3.68755 3.17137 2.3858 4.75756 1.6171 6.61337C0.848395 8.46918 0.647267 10.5113 1.03915 12.4814C1.43103 14.4515 2.39832 16.2612 3.8187 17.6816C5.23907 19.1019 7.04874 20.0692 9.01886 20.4611C10.989 20.853 13.0311 20.6519 14.8869 19.8832C16.7427 19.1144 18.3289 17.8127 19.4449 16.1425C20.5608 14.4723 21.1565 12.5087 21.1565 10.5C21.1534 7.80735 20.0824 5.22588 18.1784 3.32188C16.2744 1.41789 13.6929 0.346862 11.0003 0.34375V0.34375ZM11.0002 5.03125C11.2319 5.03125 11.4585 5.09998 11.6512 5.22875C11.8439 5.35751 11.9941 5.54054 12.0828 5.75467C12.1715 5.9688 12.1947 6.20443 12.1495 6.43175C12.1043 6.65907 11.9927 6.86788 11.8288 7.03177C11.6649 7.19566 11.4561 7.30727 11.2288 7.35248C11.0015 7.3977 10.7658 7.37449 10.5517 7.2858C10.3376 7.1971 10.1545 7.0469 10.0258 6.85418C9.89701 6.66147 9.82828 6.4349 9.82828 6.20313C9.82828 6.04923 9.85859 5.89685 9.91748 5.75467C9.97637 5.61249 10.0627 5.4833 10.1715 5.37448C10.2803 5.26566 10.4095 5.17934 10.5517 5.12045C10.6939 5.06156 10.8463 5.03125 11.0002 5.03125H11.0002ZM11.7815 15.9688H11.0003C10.8976 15.9688 10.796 15.9486 10.7012 15.9094C10.6064 15.8702 10.5202 15.8126 10.4477 15.7401C10.3751 15.6675 10.3176 15.5814 10.2783 15.4865C10.2391 15.3917 10.2189 15.2901 10.219 15.1875V10.5C10.0118 10.5 9.81309 10.4177 9.66657 10.2712C9.52006 10.1247 9.43775 9.92595 9.43775 9.71875C9.43775 9.51155 9.52006 9.31284 9.66657 9.16632C9.81309 9.01981 10.0118 8.9375 10.219 8.9375H11.0003C11.1029 8.93744 11.2045 8.95761 11.2993 8.99685C11.3941 9.03609 11.4803 9.09363 11.5528 9.16619C11.6254 9.23875 11.6829 9.3249 11.7222 9.41971C11.7614 9.51452 11.7816 9.61614 11.7815 9.71875V14.4063C11.9887 14.4063 12.1874 14.4886 12.3339 14.6351C12.4804 14.7816 12.5628 14.9803 12.5628 15.1875C12.5628 15.3947 12.4804 15.5934 12.3339 15.7399C12.1874 15.8864 11.9887 15.9688 11.7815 15.9688Z"
                fill={color}
            />
        </svg>
    );
};

export default InfoIcon;