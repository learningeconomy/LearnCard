import { SkillFramework, FrameworkNodeRole, SkillFrameworkNode } from '../components/boost/boost';
// import { SkillTreeNode } from '@learncard/types';

// shoulud be identical to @learncard/types -> SkillTreeNode (but not seeing that available right now 🤷‍♂️)
export type ApiSkillNode = {
    id: string;
    statement: string; // name
    icon: string;
    description: string;
    code: string;
    type: 'container' | 'competency';
    children: ApiSkillNode[];
    childrenCursor: string | null;
    frameworkId: string;
    hasChildren: boolean;
    status: 'active' | 'archived';
    createdAt?: string;
    updatedAt?: string;
};

export type ApiFrameworkInfo = {
    id: string;
    name: string;
    image: string;
    description: string;
    status: string;
    // createdAt: string;
    // updatedAt: string;
};

export type ApiSkillFramework = {
    framework: ApiFrameworkInfo;
    skills: ApiSkillNode[];
};

export const convertApiSkillNodeToSkillTreeNode = (
    apiSkillNode: ApiSkillNode
): SkillFrameworkNode => {
    return {
        id: apiSkillNode.id,
        targetName: apiSkillNode.statement,
        targetDescription: apiSkillNode.description,
        targetFramework: apiSkillNode.frameworkId,
        // targetType: 'Alignment',
        icon: apiSkillNode.icon,
        role:
            apiSkillNode.type === 'container'
                ? FrameworkNodeRole.tier
                : FrameworkNodeRole.competency,
        subskills:
            apiSkillNode.children?.map(child => convertApiSkillNodeToSkillTreeNode(child)) ?? [],
        targetCode: apiSkillNode.code,
        type: 'Alignment',
    };
};

export const convertApiSkillNodesToSkillFrameworkNodes = (
    apiSkillNodes: ApiSkillNode[]
): SkillFrameworkNode[] => {
    return apiSkillNodes.map(skillNode => convertApiSkillNodeToSkillTreeNode(skillNode));
};

export const convertApiSkillFrameworkToSkillFramework = (
    apiSkillFramework: ApiSkillFramework
): SkillFramework => {
    return {
        id: apiSkillFramework.framework.id,
        name: apiSkillFramework.framework.name,
        description: apiSkillFramework.framework.description,
        skills: convertApiSkillNodesToSkillFrameworkNodes(apiSkillFramework.skills),
    };
};

export const downloadFramework = (frameworkToDownload: SkillFramework) => {
    const blob = new Blob([JSON.stringify(frameworkToDownload, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    const kebabCaseName = frameworkToDownload.name
        // .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
    a.download = `${kebabCaseName.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
};

export const handleDownloadTemplate = () => {
    const template: SkillFramework = {
        id: 'example-framework-1',
        name: 'Example Skills Framework',
        description: 'A template with 1 tier and 2 competencies',
        skills: [
            {
                type: 'Alignment',
                targetName: 'Foundational Skills',
                targetDescription: 'Foundational skills tier',
                targetCode: 'FS',
                targetFramework: 'Example Skills Framework',
                targetType: 'ceasn:Competency',
                role: FrameworkNodeRole.tier,
                subskills: [
                    {
                        type: 'Alignment',
                        targetName: 'Critical Thinking',
                        targetCode: 'FS-1',
                        targetDescription: 'Ability to analyze facts to form a judgment',
                        targetFramework: 'Example Skills Framework',
                        targetType: 'ceasn:Competency',
                        role: FrameworkNodeRole.competency,
                    },
                    {
                        type: 'Alignment',
                        targetName: 'Communication',
                        targetCode: 'FS-2',
                        targetDescription: 'Effectively convey information through various methods',
                        targetFramework: 'Example Skills Framework',
                        targetType: 'ceasn:Competency',
                        role: FrameworkNodeRole.competency,
                    },
                ],
            },
        ],
    };

    downloadFramework(template);
};

export const generateSkillId = () => {
    return `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const convertSkillToBackendFormat = (node: SkillFrameworkNode): any => {
    return {
        id: node.id || generateSkillId(),
        statement: node.targetName,
        description: node.targetDescription,
        code: node.targetCode,
        type: node.role === 'tier' ? 'container' : 'competency',
        status: 'active' as const,
        icon: node.icon,
        children: node.subskills ? convertSkillsToBackendFormat(node.subskills) : undefined,
    };
};

export const convertSkillsToBackendFormat = (nodes: SkillFrameworkNode[]): any[] => {
    return nodes.map(node => convertSkillToBackendFormat(node));
};

// Count competencies in a single node and its subskills
export const countCompetenciesInNode = (node: SkillFrameworkNode | null): number => {
    if (!node) return 0;

    let count = node.role === FrameworkNodeRole.competency ? 1 : 0;

    if (node.subskills) {
        count += node.subskills.reduce(
            (sum, subskill) => sum + countCompetenciesInNode(subskill),
            0
        );
    }

    return count;
};

// Count all competencies in the entire framework
export const countCompetenciesInNodes = (nodes: SkillFrameworkNode[]): number => {
    if (!nodes?.length) return 0;
    return nodes.reduce((total, node) => total + countCompetenciesInNode(node), 0);
};

export const countNodeRoles = (
    nodes?: SkillFrameworkNode[]
): { tiers: number; competencies: number } => {
    if (!nodes || nodes.length === 0) return { tiers: 0, competencies: 0 };

    return nodes.reduce(
        (counts, node) => {
            const subCounts = countNodeRoles(node.subskills);
            const isTier = node.role === FrameworkNodeRole.tier ? 1 : 0;
            const isCompetency = node.role === FrameworkNodeRole.competency ? 1 : 0;

            return {
                tiers: counts.tiers + isTier + subCounts.tiers,
                competencies: counts.competencies + isCompetency + subCounts.competencies,
            };
        },
        { tiers: 0, competencies: 0 }
    );
};
