import React from 'react';

import { EarnedAndManagedTabs, EarnedAndManagedTabsProps } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';

const ScoutPassEarnedAndManagedTabs: React.FC<EarnedAndManagedTabsProps> = props => (
    <EarnedAndManagedTabs
        {...props}
        earnedLabel={m['common.earned']()}
        managedLabel={m['common.managed']()}
    />
);

export default ScoutPassEarnedAndManagedTabs;
