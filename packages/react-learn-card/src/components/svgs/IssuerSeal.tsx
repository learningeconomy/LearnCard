import React from 'react';

type IssuerSealProps = {
    className?: string;
};

const IssuerSeal: React.FC<IssuerSealProps> = ({ className = '' }) => {
    return (
        <svg
            width="77"
            height="77"
            viewBox="0 0 77 77"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M63.505 67.2679C56.4382 65.6232 52.6788 67.6475 50.6184 74.3528C49.9316 76.5939 47.1844 77.3169 45.5036 75.6903C40.5514 70.9369 36.4486 70.9369 31.4964 75.6903C29.7975 77.3169 27.0684 76.612 26.3816 74.3528C24.3393 67.6475 20.5799 65.6232 13.495 67.2679C11.2539 67.7921 9.28385 65.8039 9.80799 63.5809C11.4527 56.514 9.42844 52.7547 2.72309 50.6943C0.481945 50.0075 -0.241003 47.2603 1.38563 45.5794C6.13902 40.6273 6.13902 36.5245 1.38563 31.5723C-0.241003 29.8734 0.463872 27.1443 2.72309 26.4575C9.42844 24.4151 11.4527 20.6558 9.80799 13.5709C9.28385 11.3297 11.272 9.35971 13.495 9.88385C20.5618 11.5286 24.3212 9.5043 26.3816 2.79895C27.0684 0.557812 29.8156 -0.165137 31.4964 1.4615C36.4486 6.21489 40.5514 6.21489 45.5036 1.4615C47.2025 -0.165137 49.9316 0.539738 50.6184 2.79895C52.6608 9.5043 56.4201 11.5286 63.505 9.88385C65.7461 9.35971 67.7162 11.3478 67.192 13.5709C65.5473 20.6377 67.5716 24.397 74.2769 26.4575C76.5181 27.1443 77.241 29.8915 75.6144 31.5723C70.861 36.5245 70.861 40.6273 75.6144 45.5794C77.241 47.2784 76.5362 50.0075 74.2769 50.6943C67.5716 52.7366 65.5473 56.496 67.192 63.5809C67.7162 65.822 65.7281 67.7921 63.505 67.2679Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default IssuerSeal;