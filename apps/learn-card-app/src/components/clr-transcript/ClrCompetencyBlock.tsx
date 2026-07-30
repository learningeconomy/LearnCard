import React from 'react';

import { SkillCompetencyCard, type SkillCompetencyLevel } from '@learncard/react';
import type { CompetencyDisplayModel, ResultDisplayModel } from '../../helpers/clrRenderer.helpers';

const scaleItemsForResult = (result: ResultDisplayModel): string[] => {
    if (result.valueMin?.value && result.valueMax?.value) {
        return [`${result.valueMin.value}-${result.valueMax.value}`];
    }

    if (result.valueMax?.value) {
        return [`max ${result.valueMax.value}`];
    }

    if (result.allowedValue?.value.length) {
        return result.allowedValue.value;
    }

    return [];
};

const ClrCompetencyBlock: React.FC<{
    competency: CompetencyDisplayModel;
    adminMode?: boolean;
}> = ({ competency, adminMode = false }) => {
    const primaryAlignment = competency.alignments[0];
    const levels: SkillCompetencyLevel[] = competency.results.map(result => ({
        value: result.value.value,
        label: result.label?.value,
        scale: scaleItemsForResult(result),
        resultType: adminMode ? result.resultType?.value : undefined,
    }));

    return (
        <SkillCompetencyCard
            name={competency.name?.value ?? 'Competency'}
            frameworkName={primaryAlignment?.targetFramework?.value}
            code={primaryAlignment?.targetCode?.value}
            description={competency.description?.value}
            levels={levels}
            sourceUrl={primaryAlignment?.targetUrl?.value}
            footer={
                adminMode ? (
                    <div className="border-t border-grayscale-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-grayscale-500">
                            Source credential
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-grayscale-400">
                            {competency.sourceCredentialId}
                        </p>
                    </div>
                ) : undefined
            }
        />
    );
};

export default ClrCompetencyBlock;
