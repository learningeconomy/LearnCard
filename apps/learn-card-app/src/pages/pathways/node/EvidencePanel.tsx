/**
 * EvidencePanel — list of artifacts attached to a node.
 *
 * Extracted from NodeDetail so the overlay can compose the panels
 * independently (docs § 5).
 */

import React from 'react';

import type { Evidence } from '../types';

interface EvidencePanelProps {
    evidence: readonly Evidence[];
    title?: string;
}

const EvidencePanel: React.FC<EvidencePanelProps> = ({
    evidence,
    title = 'Attached',
}) => {
    if (evidence.length === 0) return null;

    return (
        <section className="space-y-2">
            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                {title}
            </p>

            <ul className="space-y-2">
                {evidence.map(artifact => (
                    <li
                        key={artifact.id}
                        className="p-3 rounded-xl border border-grayscale-200 bg-white"
                    >
                        <p className="text-xs text-grayscale-500 mb-1">
                            {artifact.artifactType} ·{' '}
                            {new Date(artifact.submittedAt).toLocaleString()}
                        </p>

                        {artifact.note && (
                            <p className="text-sm text-grayscale-800 leading-relaxed whitespace-pre-wrap">
                                {artifact.note}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default EvidencePanel;
