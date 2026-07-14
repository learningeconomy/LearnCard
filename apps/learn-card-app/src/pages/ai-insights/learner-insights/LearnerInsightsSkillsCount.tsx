import React from 'react';
import * as m from '../../../paraglide/messages.js';

import { useSkillsCountByDid } from '../../../hooks/useSkillsCount';
import { LCNProfile } from '@learncard/types';

export const LearnerInsightsSkillsCount: React.FC<{ profile: LCNProfile }> = ({ profile }) => {
    const { total, isLoadingResolved } = useSkillsCountByDid(profile.did);

    return (
        <span>
            {isLoadingResolved ? m['common.loading']() : total || 0}{' '}
            {total === 1 ? 'Skill' : 'Skills'}
        </span>
    );
};

export default LearnerInsightsSkillsCount;
