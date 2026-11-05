import { describe, expect, it } from 'vitest';

import { assertValidTool } from './annotations';
import { HCP_TOOL_NAMES, hcpTools } from './tools';

const GOVERNANCE_NAME_FRAGMENTS = [
    'grant',
    'audit',
    'export',
    'import',
    'hard_delete',
    'hardDelete',
    'confirm',
    'standing_rule',
    'standingRule',
];

describe('hcp Draft2 §10 stub tools', () => {
    it('exports exactly the five Draft2 MCP Binding tool names', () => {
        expect(hcpTools.map(t => t.name)).toEqual([...HCP_TOOL_NAMES]);
    });

    it('requires full annotation sets (shared-core mirror)', () => {
        for (const tool of hcpTools) {
            expect(() => assertValidTool(tool)).not.toThrow();
            expect(tool.annotations).toEqual(
                expect.objectContaining({
                    readOnlyHint: expect.any(Boolean),
                    destructiveHint: expect.any(Boolean),
                    idempotentHint: expect.any(Boolean),
                    openWorldHint: expect.any(Boolean),
                })
            );
        }
    });

    it('does not expose governance tool names over MCP', () => {
        const names = hcpTools.map(t => t.name.toLowerCase());
        for (const fragment of GOVERNANCE_NAME_FRAGMENTS) {
            expect(names.some(n => n.includes(fragment.toLowerCase()))).toBe(false);
        }
    });

    it('stub handlers return structuredContent without throwing', async () => {
        for (const tool of hcpTools) {
            const result = await tool.handler({}, {});
            expect(result.structuredContent?.stub).toBe(true);
            expect(result.structuredContent?.tool).toBe(tool.name);
            expect(result.content[0]?.type).toBe('text');
        }
    });
});
