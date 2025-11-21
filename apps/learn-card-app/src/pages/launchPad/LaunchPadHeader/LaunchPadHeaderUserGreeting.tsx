import React from 'react';
import moment from 'moment';

import { getFirstName, useCurrentUser } from 'learn-card-base';
import { getGreetingAndEmoji } from './launchPadHeader.helpers';

export const LaunchPadHeaderUserGreeting: React.FC<{}> = () => {
    const currentUser = useCurrentUser();
    const currentHour = moment().hour(); // returns 0–23

    const { emoji, greeting } = getGreetingAndEmoji(currentHour);

    const todaysDate = moment().format('MMMM D');
    const name = getFirstName(currentUser?.name ?? '');

    return (
        <div className="w-full flex items-center justify-center bg-white py-4">
            <div className="w-full flex flex-col items-center justify-center">
                <p className="text-grayscale-500 font-semibold text-[17px] font-poppins">
                    {emoji} {todaysDate}
                </p>
                <h2 className="text-grayscale-700 font-semibold text-[22px] font-poppins">
                    {greeting}
                    {name && <span>,</span>} {name}.
                </h2>
            </div>
        </div>
    );
};

export default LaunchPadHeaderUserGreeting;
