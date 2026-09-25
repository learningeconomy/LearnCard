import React from 'react';
import { ChevronRight } from 'lucide-react';

import ClrSourceInfo from './ClrSourceInfo';

import type { RelationshipDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrRelationshipChips: React.FC<{
    relationships: RelationshipDisplayModel[];
    onSelectRecord?: (recordId: string) => void;
}> = ({ relationships, onSelectRecord }) => {
    if (relationships.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2" aria-label="Related records">
            {relationships.map(relationship => (
                <div
                    key={`${relationship.kind}-${relationship.relatedRecordId}`}
                    className={`inline-flex items-center rounded-full border border-grayscale-300 bg-grayscale-100 text-grayscale-700 ${
                        relationship.kind === 'supersededBy' ? 'opacity-60' : ''
                    }`}
                >
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1 text-left text-xs font-medium hover:text-grayscale-900"
                        onClick={() => onSelectRecord?.(relationship.relatedRecordId)}
                        aria-label={`Open ${relationship.relatedRecordName}: ${relationship.label}`}
                    >
                        <span>{relationship.label}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <div className="pr-1.5">
                        <ClrSourceInfo field={relationship.source} label={relationship.label} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClrRelationshipChips;
