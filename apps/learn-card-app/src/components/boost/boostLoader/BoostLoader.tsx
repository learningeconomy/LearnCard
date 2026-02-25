import React from 'react';
import Lottie from 'react-lottie-player';

const FactoryMachine = '/lotties/factory.json';

export const BoostLoader: React.FC<{
    text: string;
    darkBackground?: boolean;
    className?: string;
}> = ({ text, darkBackground = false, className = '' }) => {
    return (
        <div
            className={`absolute w-full h-full top-0 left-0 z-50 flex items-center justify-center flex-col ${darkBackground ? 'bg-grayscale-800' : 'bg-grayscale-50 '
                } ${className}`}
        >
            <div className="max-w-[450px] m-auto h-full flex flex-col items-center justify-center">
                <Lottie loop path={FactoryMachine} play style={{ width: '100%' }} />
                <p
                    className={`text-center mt-[-25px] text-lg font-semibold ${darkBackground ? 'text-grayscale-50' : 'text-grayscale-900'
                        }`}
                >
                    {text}
                </p>
            </div>
        </div>
    );
};

export default BoostLoader;

export const BoostIssuanceLoading: React.FC<{ text?: string }> = ({ text = 'Issuing Boost' }) => {
    return (
        <section className="boost-issue-loading-modal flex flex-col items-center justify-center h-full w-full boost-loading-wrapper">
            <div className=" flex flex-col items-center justify-center rounded-[20px] max-w-[350px] max-h-[350px] w-full h-full bg-transparent">
                <div className="max-w-[350px] m-auto mt-[5px]">
                    <Lottie
                        loop
                        path={FactoryMachine}
                        play
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>
            <p className="mt-[0px] font-poppins font-medium text-white text-[20px]">{text}</p>
        </section>
    );
};
