/**
 * External-tool policy — delegate the work to an MCP tool.
 *
 * "MCP" is technical jargon the learner/author doesn't need. We
 * label it "Tool" in the UI; the underlying schema still uses
 * `serverId` / `toolName` because they're the canonical MCP terms.
 *
 * M3 may replace the free-text inputs with an autocomplete sourced
 * from the installed MCP servers.
 */

import React from 'react';

import { constructOutline } from 'ionicons/icons';

import type { Policy } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { PolicyKindSpec } from './types';

const ExternalEditor: React.FC<{
    value: Extract<Policy, { kind: 'external' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="policy-external-server">
                Tool provider
            </label>

            <input
                id="policy-external-server"
                type="text"
                className={INPUT}
                placeholder="e.g. github"
                value={value.mcp.serverId}
                onChange={e =>
                    onChange({ ...value, mcp: { ...value.mcp, serverId: e.target.value } })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="policy-external-tool">
                Tool name
            </label>

            <input
                id="policy-external-tool"
                type="text"
                className={INPUT}
                placeholder="e.g. create_pull_request"
                value={value.mcp.toolName}
                onChange={e =>
                    onChange({ ...value, mcp: { ...value.mcp, toolName: e.target.value } })
                }
            />
        </div>
    </div>
);

const externalSpec: PolicyKindSpec<'external'> = {
    kind: 'external',
    label: 'Use a tool',
    icon: constructOutline,
    blurb: 'Connect this step to an external tool (via MCP).',

    default: () => ({
        kind: 'external',
        mcp: { serverId: '', toolName: '' },
    }),

    Editor: ({ value, onChange }) => <ExternalEditor value={value} onChange={onChange} />,

    summarize: value => {
        const { serverId, toolName } = value.mcp;

        // Degrade gracefully when the author hasn't filled the tool
        // in yet — showing "Use  → " with empty slots reads as a bug,
        // not an in-progress state.
        if (!serverId && !toolName) return 'Use a tool (not set up)';
        if (!toolName) return `Use ${serverId}`;
        if (!serverId) return `Use ${toolName}`;

        return `Use ${serverId} → ${toolName}`;
    },
};

export default externalSpec;
