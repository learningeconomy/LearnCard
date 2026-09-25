import React from 'react';

import { SkillCompetencyCard } from 'learn-card-base';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import type {
    CompetencyDisplayModel,
    RelationshipDisplayModel,
} from '../../helpers/clrRenderer.helpers';

const ClrCompetencyBlock: React.FC<{
    competency: CompetencyDisplayModel;
    relationships?: RelationshipDisplayModel[];
    onSelectRecord?: (recordId: string) => void;
    adminMode?: boolean;
}> = ({ competency, relationships = [], onSelectRecord, adminMode = false }) => {
    const primaryAlignment = competency.alignments[0];

    return (
        <div className="space-y-3">
            <SkillCompetencyCard
                name={competency.name?.value ?? 'Competency'}
                frameworkName={primaryAlignment?.targetFramework?.value}
                code={primaryAlignment?.targetCode?.value}
                description={competency.description?.value}
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
            <ClrResultWithScaleList results={competency.results} showResultType={adminMode} />
            <ClrRelationshipChips relationships={relationships} onSelectRecord={onSelectRecord} />
        </div>
    );
};

export default ClrCompetencyBlock;
