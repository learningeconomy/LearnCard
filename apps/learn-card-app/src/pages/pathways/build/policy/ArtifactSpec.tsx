/**
 * Artifact policy — learner submits one piece of evidence.
 *
 * The most common kind by far. Default for any new node.
 */

import React from 'react';

import { cloudUploadOutline } from 'ionicons/icons';

import type { ArtifactType, Policy } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { PolicyKindSpec } from './types';

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

/**
 * Human nouns for each artifact type, with casing preserved so the
 * summary reads right in both the dropdown ("PDF") and the prose
 * summary ("Submit a PDF"). `text` is "note" because "submit a text"
 * reads as a message, not a document.
 *
 * Keep this shape identical to `summarizePolicy.ts`'s noun table —
 * both consume the same expected strings in the test suite.
 */
const ARTIFACT_NOUN: Record<ArtifactType, string> = {
    text: 'note',
    image: 'image',
    audio: 'audio clip',
    video: 'video',
    pdf: 'PDF',
    link: 'link',
    code: 'code snippet',
    other: 'file',
};

/** Title-cased label for the <select> dropdown. */
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

// "a" vs "an" for the leading article. Cheap, not worth a library.
const article = (word: string): 'a' | 'an' => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const ArtifactEditor: React.FC<{
    value: Extract<Policy, { kind: 'artifact' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="policy-artifact-prompt">
                Prompt to the learner
            </label>

            <textarea
                id="policy-artifact-prompt"
                rows={2}
                className={`${INPUT} resize-none`}
                placeholder="What are you asking them to produce?"
                value={value.prompt}
                onChange={e => onChange({ ...value, prompt: e.target.value })}
            />
        </div>

        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="policy-artifact-type">
                What they submit
            </label>

            <select
                id="policy-artifact-type"
                className={INPUT}
                value={value.expectedArtifact}
                onChange={e =>
                    onChange({
                        ...value,
                        expectedArtifact: e.target.value as ArtifactType,
                    })
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

const artifactSpec: PolicyKindSpec<'artifact'> = {
    kind: 'artifact',
    label: 'Submit something',
    icon: cloudUploadOutline,
    blurb: 'Learner attaches a single piece of evidence.',

    default: () => ({ kind: 'artifact', prompt: '', expectedArtifact: 'text' }),

    Editor: ({ value, onChange }) => <ArtifactEditor value={value} onChange={onChange} />,

    summarize: value => {
        const noun = ARTIFACT_NOUN[value.expectedArtifact];
        return `Submit ${article(noun)} ${noun}`;
    },
};

export default artifactSpec;
