import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';

import { useSearchFrameworkSkills } from 'learn-card-base';
import type {
    GlobalSkillFrameworkConfig,
    SemanticSearchSkillRecord,
} from '../../../helpers/globalSkillFrameworks.helpers';
import {
    convertApiSkillNodeToSkillTreeNode,
    type ApiSkillNode,
} from '../../../helpers/skillFramework.helpers';
import CompetencyIcon from '../../SkillFrameworks/CompetencyIcon';
import type { SkillFrameworkNode } from '../../../components/boost/boost';

export const keyFor = (frameworkId: string, id: string) => `${frameworkId}::${id}`;
export const normalizeName = (name?: string) => (name ?? '').trim().toLowerCase();

export const dedupeByName = (nodes: SkillFrameworkNode[]): SkillFrameworkNode[] => {
    const seen = new Set<string>();
    const result: SkillFrameworkNode[] = [];
    for (const node of nodes) {
        const key = normalizeName(node.targetName);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(node);
    }
    return result;
};

export const semanticRecordToNode = (record: SemanticSearchSkillRecord): SkillFrameworkNode =>
    ({
        id: record.id,
        frameworkId: record.frameworkId,
        targetFramework: record.targetFramework ?? record.frameworkId,
        targetName: record.targetName ?? '',
        icon: record.icon,
    } as SkillFrameworkNode);

export const nodeFrameworkId = (node: SkillFrameworkNode): string =>
    node.frameworkId ?? node.targetFramework ?? '';

export const FrameworkDefaultsLoader: React.FC<{
    framework: GlobalSkillFrameworkConfig;
    onLoaded: (frameworkId: string, nodes: SkillFrameworkNode[]) => void;
}> = ({ framework, onLoaded }) => {
    const ids = framework.defaultSkillIds ?? [];
    const { data } = useSearchFrameworkSkills(
        framework.frameworkId,
        { id: { $in: ids } },
        { enabled: ids.length > 0 }
    );

    useEffect(() => {
        const records = (data as { records?: ApiSkillNode[] } | undefined)?.records ?? [];
        onLoaded(
            framework.frameworkId,
            records.map(record => convertApiSkillNodeToSkillTreeNode(record))
        );
    }, [data, framework.frameworkId, onLoaded]);

    return null;
};

export const SkillChip: React.FC<{ label: string; icon?: string; onClick: () => void }> = ({
    label,
    icon,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 py-1.5 pl-2 pr-3 rounded-full border border-grayscale-300 text-sm text-grayscale-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
    >
        <CompetencyIcon icon={icon} size="x-small" />
        <Plus className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[200px]">{label}</span>
    </button>
);
