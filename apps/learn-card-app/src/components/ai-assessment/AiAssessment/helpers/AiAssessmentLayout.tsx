import React from 'react';

export const AiAssessmentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <section className="w-full h-full bg-white overflow-y-scroll scrollbar-hide flex flex-col items-center justify-start ion-padding pt-[150px]">
            {children}
        </section>
    );
};

export default AiAssessmentLayout;
