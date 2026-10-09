import React from 'react';
import * as m from '../../paraglide/messages.js';
import { mDynamic } from '../../i18n/mDynamic';
import { ChevronRight } from 'lucide-react';

import ClrSourceInfo from './ClrSourceInfo';

import type { RelationshipDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';

const ClrRelationshipChips: React.FC<{
    relationships: RelationshipDisplayModel[];
    onSelectRecord?: (recordId: string) => void;
}> = ({ relationships, onSelectRecord }) => {
    if (relationships.length === 0) return null;

    return (
        <div
            className="flex flex-wrap gap-2"
            aria-label={m['clrTranscript.relationships.relatedRecords']()}
        >
            {relationships.map(relationship => {
                const messageKey = `clrTranscript.relationships.${relationship.kind}`;
                const translatedLabel = mDynamic(messageKey, {
                    name: relationship.relatedRecordName,
                });
                // Unknown kinds or missing messages retain the compatibility label without throwing.
                const label = translatedLabel === messageKey ? relationship.label : translatedLabel;
                const isNavigable = relationship.navigable && onSelectRecord !== undefined;

                return (
                    <div
                        key={`${relationship.kind}-${relationship.relatedRecordId}`}
                        className={`inline-flex items-center rounded-full border border-grayscale-300 bg-grayscale-100 text-grayscale-700 ${
                            relationship.kind === 'supersededBy' ? 'opacity-60' : ''
                        }`}
                    >
                        {isNavigable ? (
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-1 text-left text-xs font-medium hover:text-grayscale-900"
                                onClick={() => onSelectRecord(relationship.relatedRecordId)}
                                aria-label={m['clrTranscript.relationships.openRecord']({
                                    name: relationship.relatedRecordName,
                                    label,
                                })}
                            >
                                <span>{label}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <span className="py-1.5 pl-3 pr-2 text-xs font-medium">
                                {label}
                                {relationship.resolution &&
                                    relationship.resolution !== 'resolved' && (
                                        <span className="ml-1 text-grayscale-500">
                                            (
                                            {relationship.resolution === 'ambiguous'
                                                ? m['clrTranscript.relationships.targetAmbiguous']()
                                                : m[
                                                      'clrTranscript.relationships.targetUnresolved'
                                                  ]()}
                                            )
                                        </span>
                                    )}
                            </span>
                        )}
                        <div className="pr-1.5">
                            <ClrSourceInfo field={relationship.source} label={label} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ClrRelationshipChips;
