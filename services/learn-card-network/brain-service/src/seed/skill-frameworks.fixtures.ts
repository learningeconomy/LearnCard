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

export const DEFAULT_SKILL_FRAMEWORKS: SeedSkillFrameworkFixture[] = [
    {
        id: 'power-skills',
        name: 'Power Skills',
        description: 'Core workplace skills for communication, collaboration, and adaptability.',
        sourceURI: 'learncard://seed/skill-frameworks/power-skills',
        status: 'active',
        isPublic: true,
        skills: [
            {
                id: 'power-skills-communication',
                statement: 'Communicate clearly in writing and speaking',
                description: 'Express ideas clearly for teammates, learners, and partners.',
                code: 'COMMUNICATION',
                children: [
                    {
                        id: 'power-skills-communication-listening',
                        statement: 'Listen actively before responding',
                        description: 'Confirm understanding before jumping to a conclusion.',
                        code: 'ACTIVE_LISTENING',
                    },
                    {
                        id: 'power-skills-communication-writing',
                        statement: 'Write concise, useful updates',
                        description: 'Share the right level of detail for the audience.',
                        code: 'CLEAR_WRITING',
                    },
                ],
            },
            {
                id: 'power-skills-collaboration',
                statement: 'Work effectively with others',
                description: 'Contribute reliably to shared goals and team outcomes.',
                code: 'COLLABORATION',
                children: [
                    {
                        id: 'power-skills-collaboration-feedback',
                        statement: 'Give helpful feedback',
                        description: 'Offer feedback that is specific, timely, and respectful.',
                        code: 'FEEDBACK',
                    },
                    {
                        id: 'power-skills-collaboration-conflict',
                        statement: 'Resolve disagreements productively',
                        description: 'Focus on the problem and the shared outcome.',
                        code: 'CONFLICT_RESOLUTION',
                    },
                ],
            },
            {
                id: 'power-skills-critical-thinking',
                statement: 'Evaluate information critically',
                description: 'Separate signal from noise and make grounded decisions.',
                code: 'CRITICAL_THINKING',
                children: [
                    {
                        id: 'power-skills-critical-thinking-sources',
                        statement: 'Compare sources before deciding',
                        description: 'Check reliability and look for supporting evidence.',
                        code: 'SOURCE_COMPARISON',
                    },
                    {
                        id: 'power-skills-critical-thinking-questions',
                        statement: 'Ask better questions',
                        description: 'Use questions to clarify assumptions and goals.',
                        code: 'QUESTIONING',
                    },
                ],
            },
        ],
    },
    {
        id: 'digital-literacy',
        name: 'Digital Literacy',
        description: 'Foundational skills for navigating tools, data, and online spaces.',
        sourceURI: 'learncard://seed/skill-frameworks/digital-literacy',
        status: 'active',
        isPublic: true,
        skills: [
            {
                id: 'digital-literacy-information',
                statement: 'Find and verify information online',
                description: 'Use search, filters, and source checks to find trustworthy information.',
                code: 'INFORMATION_LITERACY',
            },
            {
                id: 'digital-literacy-safety',
                statement: 'Stay safe and respectful online',
                description: 'Protect accounts, data, and people while using digital tools.',
                code: 'ONLINE_SAFETY',
            },
            {
                id: 'digital-literacy-productivity',
                statement: 'Use digital tools to stay organized',
                description: 'Manage documents, calendars, and tasks with confidence.',
                code: 'PRODUCTIVITY_TOOLS',
                children: [
                    {
                        id: 'digital-literacy-productivity-files',
                        statement: 'Organize files and shared folders',
                        description: 'Keep materials easy to find and reuse.',
                        code: 'FILE_ORGANIZATION',
                    },
                    {
                        id: 'digital-literacy-productivity-workflow',
                        statement: 'Automate simple repeatable work',
                        description: 'Use templates and routines to save time.',
                        code: 'WORKFLOW_AUTOMATION',
                    },
                ],
            },
            {
                id: 'digital-literacy-data',
                statement: 'Read and interpret basic data',
                description: 'Understand charts, tables, and simple trends.',
                code: 'DATA_BASICS',
            },
        ],
    },
    {
        id: 'learncard-demo-skills',
        name: 'LearnCard Demo Skills',
        description: 'A tiny demo framework for alignment and issuance workflows.',
        sourceURI: 'learncard://seed/skill-frameworks/learncard-demo-skills',
        status: 'active',
        isPublic: true,
        skills: [
            {
                id: 'learncard-demo-alignments',
                statement: 'Map a skill to an outcome',
                description: 'Connect a learner action to a framework alignment.',
                code: 'ALIGNMENT_MAPPINGS',
                children: [
                    {
                        id: 'learncard-demo-alignments-obv3',
                        statement: 'Build OBv3-style alignments',
                        description: 'Generate alignment payloads for a skill set.',
                        code: 'OBV3_ALIGNMENTS',
                    },
                ],
            },
            {
                id: 'learncard-demo-issuance',
                statement: 'Issue a credential from a skill flow',
                description: 'Trigger credential issuance after a learner completes a task.',
                code: 'ISSUANCE_FLOW',
            },
            {
                id: 'learncard-demo-search',
                statement: 'Search for relevant skills quickly',
                description: 'Use semantic or exact search to find the right skill.',
                code: 'SKILL_SEARCH',
            },
        ],
    },
];
