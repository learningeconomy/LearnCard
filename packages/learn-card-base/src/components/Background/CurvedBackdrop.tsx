import React from 'react';

export const CurvedBackdropEl: React.FC<{ className?: string; width?: string; height?: string }> = ({
    width = '100%',
    height = '100%',
    className = 'bg-yellow-300',
}) => {
    return (
        <section className="absolute w-full h-[-webkit-fill-available] overflow-hidden h-full">
            <div
                className={`absolute oval-warped rounded-[100%] ${className} w-[120%] min-h-[250px] translate-x-[-7%]`}
            ></div>
            <div
                className={`absolute ${className} w-full  h-[-webkit-fill-available] top-[120px]`}
            ></div>
        </section>
    );
};

export default CurvedBackdropEl;
