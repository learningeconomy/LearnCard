import React from 'react';

export type AppGridProps = {
    heading: string;
    children: React.ReactNode;
};

const AppGrid: React.FC<AppGridProps> = ({ heading, children }) => (
    <section className="w-full max-w-[820px]">
        <h2 className="font-poppins font-semibold text-[20px] text-[#353E64] mb-2">{heading}</h2>
        <div
            data-testid="app-grid"
            className="grid grid-cols-3 md:grid-cols-4 gap-y-4 justify-items-center"
        >
            {children}
        </div>
    </section>
);

export default AppGrid;
