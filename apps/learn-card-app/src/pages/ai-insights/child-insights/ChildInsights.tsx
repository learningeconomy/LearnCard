import React from 'react';

import ShareChildInsightsList from './ShareChildInsightsList';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- existing empty props type; replacing it changes the accepted props type
export const ChildInsights: React.FC<{}> = () => {
    return (
        <>
            <ShareChildInsightsList />
        </>
    );
};

export default ChildInsights;
