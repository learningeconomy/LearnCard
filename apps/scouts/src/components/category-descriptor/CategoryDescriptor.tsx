import React from 'react';

type CategoryDescriptorProps = {
    description: string;
    className: string;
};

export const CategoryDescriptor: React.FC<CategoryDescriptorProps> = ({
    description,
    className,
}) => {
    return (
        <div className="relative text-grayscale-900 z-9999">
            <p className={className || 'text-black max-w-[400px] text-center mx-auto mt-10 pb-5'}>
                {description}
            </p>
        </div>
    );
};

export default CategoryDescriptor;
