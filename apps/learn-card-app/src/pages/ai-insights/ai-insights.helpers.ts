import { z } from 'zod';

import { ConsentFlowContractDetailsValidator } from '@learncard/types';

type Insights = {
    suggestedPathways?: string[];
    roomForGrowth?: Record<string, any>;
    weakestArea?: Record<string, any>;
    strongestArea?: Record<string, any>;
};

export const quantifyInsights = (insights: Insights): number => {
    const pathwaysCount = insights?.suggestedPathways?.length ?? 0;
    const roomForGrowthExists = insights?.roomForGrowth ? 1 : 0;
    const weakestAreaExists = insights?.weakestArea ? 1 : 0;
    const strongestAreaExists = insights?.strongestArea ? 1 : 0;

    const totalInsightsCount =
        pathwaysCount + roomForGrowthExists + weakestAreaExists + strongestAreaExists;

    return totalInsightsCount;
};

export enum AiInsightsUserCardMode {
    Request = 'request',
    Share = 'share',
    View = 'view',
    Preview = 'preview',
    Cancel = 'cancel',
}
