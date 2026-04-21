/**
 * ValidationBanner — compact list of issues for the currently-selected
 * node plus pathway-level issues that don't belong to any node.
 *
 * Rendered at the top of `InspectorPane` so an author never wonders
 * "why is this step still broken?" — the banner tells them, in
 * jargon-free copy, what needs attention and where it lives.
 *
 * Issues are colour-coded by level:
 *
 *   - `error`   → red-50 background, red-600 icon
 *   - `warning` → amber-50 background, amber-600 icon
 *
 * Each row shows:
 *   - A small icon for the level
 *   - The jargon-free message
 *   - A section pill ("Identity", "What", "Done", "Connections",
 *     "Pathway") so the author knows where to find the fix
 *
 * The banner is silent (renders nothing) when there are no issues
 * — we never show a "looks good!" state, because validation is only
 * surfaced when there's something to do.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { alertCircleOutline, warningOutline } from 'ionicons/icons';

import type { Issue, IssueSection } from '../validate/validatePathway';

interface ValidationBannerProps {
    issues: Issue[];

    /**
     * Node id the inspector is editing. We show:
     *   1. Issues for this node
     *   2. Pathway-level issues (nodeId === null)
     *
     * Issues for *other* nodes are silenced here — they live in
     * those nodes' inspectors, not this one.
     */
    currentNodeId: string | null;
}

const SECTION_LABEL: Record<IssueSection, string> = {
    identity: 'Identity',
    what: 'What happens',
    done: 'Done when',
    connections: 'Connections',
    pathway: 'Pathway',
};

const ValidationBanner: React.FC<ValidationBannerProps> = ({
    issues,
    currentNodeId,
}) => {
    // Show issues for the active node + pathway-level. Suppress
    // issues for other nodes — those belong to other inspector mounts.
    const relevant = issues.filter(
        i => i.nodeId === currentNodeId || i.nodeId === null,
    );

    if (relevant.length === 0) return null;

    return (
        <ul
            className="space-y-1.5 p-2 rounded-[20px] border border-grayscale-200 bg-white shadow-sm"
            aria-label="Issues with this step"
        >
            {relevant.map((issue, idx) => (
                <li key={idx}>
                    <IssueRow issue={issue} />
                </li>
            ))}
        </ul>
    );
};

// ---------------------------------------------------------------------------
// IssueRow — one issue line.
// ---------------------------------------------------------------------------

const IssueRow: React.FC<{ issue: Issue }> = ({ issue }) => {
    const isError = issue.level === 'error';

    return (
        <div
            className={`
                flex items-start gap-2.5 py-2 px-3 rounded-xl border
                ${
                    isError
                        ? 'border-red-100 bg-red-50'
                        : 'border-amber-100 bg-amber-50'
                }
            `}
        >
            <IonIcon
                icon={isError ? alertCircleOutline : warningOutline}
                aria-hidden
                className={`
                    shrink-0 text-base mt-0.5
                    ${isError ? 'text-red-600' : 'text-amber-700'}
                `}
            />

            <div className="min-w-0 flex-1">
                <span
                    className={`block text-sm leading-snug ${
                        isError ? 'text-red-800' : 'text-amber-900'
                    }`}
                >
                    {issue.message}
                </span>

                <span
                    className={`
                        inline-block text-[10px] font-medium uppercase tracking-wide
                        mt-1 px-1.5 py-0.5 rounded
                        ${
                            isError
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                        }
                    `}
                >
                    {SECTION_LABEL[issue.section]}
                </span>
            </div>
        </div>
    );
};

export default ValidationBanner;
