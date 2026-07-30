/**
 * Artifact-count termination — "Attach N X's".
 *
 * The natural pairing with `practice` or `artifact` policies. The
 * noun table is kept identical to the policy Artifact spec so a
 * "submit a link" policy paired with a "2 links" termination reads
 * consistently.
 */

import React from 'react';

import { attachOutline } from 'ionicons/icons';

import type { ArtifactType, Termination } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

const ARTIFACT_OPTIONS: readonly ArtifactType[] = [
    'text',
    'image',
    'audio',
    'video',
    'pdf',
    'link',
    'code',
    'other',
];

const ARTIFACT_NOUN: Record<ArtifactType, { one: string; many: string }> = {
    text: { one: 'note', many: 'notes' },
    image: { one: 'image', many: 'images' },
    audio: { one: 'audio clip', many: 'audio clips' },
    video: { one: 'video', many: 'videos' },
    pdf: { one: 'PDF', many: 'PDFs' },
    link: { one: 'link', many: 'links' },
    code: { one: 'code snippet', many: 'code snippets' },
    other: { one: 'file', many: 'files' },
};

const ARTIFACT_LABEL: Record<ArtifactType, string> = {
    text: 'Note',
    image: 'Image',
    audio: 'Audio clip',
    video: 'Video',
    pdf: 'PDF',
    link: 'Link',
    code: 'Code snippet',
    other: 'File',
};

const ArtifactCountEditor: React.FC<{
    value: Extract<Termination, { kind: 'artifact-count' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="term-count">
                How many
            </label>

            <input
                id="term-count"
                type="number"
                min={1}
                className={INPUT}
                value={value.count}
                onChange={e =>
                    onChange({ ...value, count: Math.max(1, Number(e.target.value) || 1) })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="term-type">
                Of what
            </label>

            <select
                id="term-type"
                className={INPUT}
                value={value.artifactType}
                onChange={e =>
                    onChange({ ...value, artifactType: e.target.value as ArtifactType })
                }
            >
                {ARTIFACT_OPTIONS.map(t => (
                    <option key={t} value={t}>
                        {ARTIFACT_LABEL[t]}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

const artifactCountSpec: TerminationKindSpec<'artifact-count'> = {
    kind: 'artifact-count',
    label: 'Attach things',
    icon: attachOutline,
    blurb: 'Done when a target number of artifacts have been submitted.',
    selectable: true,

    default: () => ({ kind: 'artifact-count', count: 1, artifactType: 'text' }),

    Editor: ({ value, onChange }) => (
        <ArtifactCountEditor value={value} onChange={onChange} />
    ),

    summarize: value => {
        const noun =
            value.count === 1
                ? ARTIFACT_NOUN[value.artifactType].one
                : ARTIFACT_NOUN[value.artifactType].many;

        return `Attach ${value.count} ${noun}`;
    },
};

export default artifactCountSpec;
