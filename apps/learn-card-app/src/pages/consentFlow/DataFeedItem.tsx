import React from 'react';

import useTheme from '../../theme/hooks/useTheme';

type XAPIStatement = {
    actor: {
        objectType: string;
        name: string;
        account: {
            homePage: string;
            name: string;
        };
    };
    verb: {
        id: string;
        display: {
            'en-US': string;
        };
    };
    object: {
        id: string;
        definition: {
            name: { 'en-US': string };
            description: { 'en-US': string };
            type: string;
        };
    };
};

type DataFeedItemProps = {
    apiStatement: XAPIStatement;
};
const DataFeedItem: React.FC<DataFeedItemProps> = ({ apiStatement }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const ACTION_COLOR: Record<string, string> = {
        attempted: 'text-amber-500',
        completed: 'text-emerald-500',
        mastered: 'text-blue-500',
        demonstrated: 'text-cyan-500',
        failed: 'text-rose-500',
        progressed: `text-${primaryColor}`,
    };

    const ACTION_TEXT: Record<string, string> = {
        attempted: 'Attempted',
        completed: 'Completed',
        mastered: 'Mastered',
        demonstrated: 'Demonstrated',
        failed: 'Failed',
        progressed: 'Progressed',
    };

    const verb = apiStatement?.verb.display['en-US'];
    return (
        <li className="w-full py-4 border-b last:border-b-0 flex flex-col gap-2">
            <header className="flex gap-1 text-sm font-poppins">
                <span className={`${ACTION_COLOR[verb]} font-bold`}>{ACTION_TEXT[verb]}</span>
            </header>
            <section className="text-[13px] font-poppins text-grayscale-700">
                <strong>{apiStatement?.object?.definition?.name['en-US']}:</strong>{' '}
                {apiStatement?.object?.definition?.description['en-US']}
            </section>
        </li>
    );
};

export default DataFeedItem;
