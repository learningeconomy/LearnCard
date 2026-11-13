import React from 'react';
import { ClrRecordDetails } from './ClrRecordDetails';
import type { ClrNormalizedRecord } from 'learn-card-base/helpers/credentials/clr/types';

import { SkillCompetencyCard } from 'learn-card-base';
import ClrRelationshipChips from './ClrRelationshipChips';
import ClrResultWithScaleList from './ClrResultWithScaleList';
import type {
    CompetencyDisplayModel,
    RelationshipDisplayModel,
} from 'learn-card-base/helpers/credentials/clr/renderer';
import { ClrRecordVerificationDetails } from './ClrVerificationSummary';
import type { ClrCredentialVerification } from 'learn-card-base/helpers/credentials/clr/verification.types';

const ClrCompetencyBlock: React.FC<{
    competency: CompetencyDisplayModel;
    record?: ClrNormalizedRecord;
    relationships?: RelationshipDisplayModel[];
    onSelectRecord?: (recordId: string) => void;
    adminMode?: boolean;
    verificationNode?: ClrCredentialVerification;
    publisherDid?: string;
}> = ({
    competency,
    record,
    relationships = [],
    onSelectRecord,
    adminMode = false,
    verificationNode,
    publisherDid,
}) => {
    const primaryAlignment = competency.alignments[0];

    return (
        <div className="space-y-v3-3">
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
            <ClrRecordVerificationDetails
                node={verificationNode}
                recordId={competency.sourceCredentialId}
                recordName={competency.name?.value ?? 'Competency'}
                publisherDid={publisherDid}
            />
            <ClrRecordDetails record={record} />
            <ClrResultWithScaleList results={competency.results} showResultType={adminMode} />
            <ClrRelationshipChips relationships={relationships} onSelectRecord={onSelectRecord} />
        </div>
    );
};

export default ClrCompetencyBlock;
