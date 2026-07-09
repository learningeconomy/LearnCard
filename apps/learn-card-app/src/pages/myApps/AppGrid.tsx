import React from 'react';

export type AppGridProps = {
    heading?: string;
    children: React.ReactNode;
};

const AppGrid: React.FC<AppGridProps> = ({ heading, children }) => (
    <section className="w-full max-w-[820px]">
        {heading && (
            <h2 className="mb-4 font-poppins text-[20px] font-medium text-[#353E64] md:mb-6">
                {heading}
            </h2>
        )}
        <div
            data-testid="app-grid"
            className="grid grid-cols-3 items-start justify-items-center gap-x-3 gap-y-5 sm:grid-cols-4 md:gap-x-6 md:gap-y-8"
        >
            {children}
        </div>
    </section>
);

export default AppGrid;
