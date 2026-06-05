import WEFGlobalSkillsTaxonomy from './data/wef-global-skills-taxonomy.json';
import PathsmithDurableSkillsStarterEdition from './data/pathsmith-durable-skills-starter-edition.json';

export type SeedSkillNode = {
    id: string;
    statement: string;
    description?: string;
    code?: string;
    icon?: string;
    type?: string;
    status?: 'active' | 'archived';
    children?: SeedSkillNode[];
};

export type SeedSkillFrameworkFixture = {
    id: string;
    name: string;
    description: string;
    sourceURI: string;
    image?: string;
    status: 'active';
    isPublic: true;
    skills: SeedSkillNode[];
};

type SourceSkillNode = {
    id: string;
    targetName: string;
    targetDescription?: string;
    targetCode?: string;
    icon?: string;
    role?: 'tier' | 'competency';
    subskills?: SourceSkillNode[];
};

type SourceSkillFramework = {
    name: string;
    description: string;
    skills: SourceSkillNode[];
};

type FrameworkSource = {
    id: string;
    sourceURI: string;
    image?: string;
    data: SourceSkillFramework;
};

const normalizeSkillNode = (node: SourceSkillNode): SeedSkillNode => ({
    id: node.id,
    statement: node.targetName,
    description: node.targetDescription,
    code: node.targetCode,
    icon: node.icon,
    type: node.role === 'tier' ? 'container' : 'competency',
    status: 'active',
    children: node.subskills?.map(normalizeSkillNode) ?? [],
});

const FRAMEWORK_SOURCES: FrameworkSource[] = [
    {
        id: 'wef-global-skills-taxonomy',
        sourceURI: 'learncard://seed/skill-frameworks/wef-global-skills-taxonomy',
        image: 'https://cdn.filestackcontent.com/MLseH895Tia5SpY5iOz2',
        data: WEFGlobalSkillsTaxonomy as SourceSkillFramework,
    },
    {
        id: 'pathsmith-durable-skills-starter-edition',
        sourceURI: 'learncard://seed/skill-frameworks/pathsmith-durable-skills-starter-edition',
        image: 'https://cdn.filestackcontent.com/lFafCT74SS6dgB0xWCMo',
        data: PathsmithDurableSkillsStarterEdition as SourceSkillFramework,
    },
];

const buildFramework = (framework: FrameworkSource): SeedSkillFrameworkFixture => ({
    id: framework.id,
    name: framework.data.name,
    description: framework.data.description,
    sourceURI: framework.sourceURI,
    image: framework.image,
    status: 'active',
    isPublic: true,
    skills: framework.data.skills.map(normalizeSkillNode),
});

export const DEFAULT_SKILL_FRAMEWORKS: SeedSkillFrameworkFixture[] = FRAMEWORK_SOURCES.map(
    buildFramework
);
