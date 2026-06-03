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

type SeedSkillRole = 'tier' | 'competency';

type SeedSkillInput = {
    id: string;
    statement: string;
    description?: string;
    code?: string;
    icon?: string;
    role: SeedSkillRole;
    children?: SeedSkillInput[];
};

type SeedFrameworkInput = {
    id: string;
    name: string;
    description: string;
    sourceURI: string;
    image?: string;
    skills: SeedSkillInput[];
};

const tier = (
    id: string,
    statement: string,
    description: string,
    code: string,
    icon: string,
    children: SeedSkillInput[] = []
): SeedSkillInput => ({
    id,
    statement,
    description,
    code,
    icon,
    role: 'tier',
    children,
});

const leaf = (
    id: string,
    statement: string,
    description: string,
    code: string,
    icon: string
): SeedSkillInput => ({
    id,
    statement,
    description,
    code,
    icon,
    role: 'competency',
    children: [],
});

const buildSkillNode = (node: SeedSkillInput): SeedSkillNode => ({
    id: node.id,
    statement: node.statement,
    description: node.description,
    code: node.code,
    icon: node.icon,
    type: node.role === 'tier' ? 'container' : 'competency',
    status: 'active',
    children: node.children?.map(buildSkillNode) ?? [],
});

const buildFramework = (framework: SeedFrameworkInput): SeedSkillFrameworkFixture => ({
    id: framework.id,
    name: framework.name,
    description: framework.description,
    sourceURI: framework.sourceURI,
    image: framework.image,
    status: 'active',
    isPublic: true,
    skills: framework.skills.map(buildSkillNode),
});

const WEF_GLOBAL_SKILLS_TAXONOMY: SeedFrameworkInput = {
    id: 'wef-global-skills-taxonomy',
    name: 'WEF Global Skills Taxonomy',
    description:
        'The World Economic Forum Global Skills Taxonomy creates a shared language that clarifies in-demand skills, helps employers identify the right talent, guides educators in designing relevant training programmes, and helps jobseekers showcase their skills.',
    sourceURI: 'learncard://seed/skill-frameworks/wef-global-skills-taxonomy',
    image: 'https://cdn.filestackcontent.com/MLseH895Tia5SpY5iOz2',
    skills: [
        tier(
            'wef-skills-knowledge-abilities',
            'Skills, knowledge and abilities',
            'Whether gained through experiential learning or formal instruction, skills represent developed proficiencies that support distinct tasks and outcomes.',
            'WEF-1',
            '🛠️',
            [
                tier(
                    'wef-engagement-skills',
                    'Engagement skills',
                    'Capacity to engage customers either corporately or personally.',
                    'WEF-1-4',
                    '💬',
                    [
                        tier(
                            'wef-customer-experience',
                            'Customer experience',
                            'Capacity to manage positive interactions between an organization and its customers.',
                            'WEF-1-4-2',
                            '🛍️',
                            [
                                leaf(
                                    'wef-customer-service',
                                    'Customer service',
                                    'Responding to customer enquiries in a manner that balances speed, quality, and brand values.',
                                    'WEF-1-4-2-1',
                                    '🛎️'
                                ),
                                leaf(
                                    'wef-customer-relationship-management',
                                    'Customer relationship management',
                                    'Managing and developing a portfolio of client relationships over extended periods.',
                                    'WEF-1-4-2-2',
                                    '📊'
                                ),
                            ]
                        ),
                        tier(
                            'wef-marketing-media',
                            'Marketing and media',
                            'Capacity to promote and sell products or services.',
                            'WEF-1-4-1',
                            '📈',
                            [
                                leaf(
                                    'wef-digital-marketing',
                                    'Digital marketing',
                                    'Using online and mobile channels to reach and engage audiences.',
                                    'WEF-1-4-1-2',
                                    '📲'
                                ),
                                leaf(
                                    'wef-sales-communication-marketing',
                                    'Sales, communication and marketing of products and services',
                                    'Shaping value propositions and selling products on that basis.',
                                    'WEF-1-4-1-1',
                                    '💼'
                                ),
                            ]
                        ),
                    ]
                ),
                tier(
                    'wef-physical-abilities',
                    'Physical abilities',
                    'The range of physical, psychomotor, sensory and sensory-processing abilities required to perform a job role.',
                    'WEF-1-1',
                    '🏃‍♂️',
                    [
                        tier(
                            'wef-sensory-processing-abilities',
                            'Sensory-processing abilities',
                            'Abilities that influence visual, auditory and spatial perception, as well as problem-solving.',
                            'WEF-1-1-2',
                            '👂',
                            [
                                leaf(
                                    'wef-spatial-abilities',
                                    'Spatial abilities',
                                    'The ability to mentally manipulate objects and perceive locations relative to an environment.',
                                    'WEF-1-1-2-4',
                                    '📐'
                                ),
                                leaf(
                                    'wef-information-processing-abilities',
                                    'Information-processing abilities',
                                    'Remembering, organizing, identifying patterns, concentrating, and shifting attention between sources.',
                                    'WEF-1-1-2-3',
                                    '🗂️'
                                ),
                                leaf(
                                    'wef-visual-abilities',
                                    'Visual abilities',
                                    'Resolving details, perceiving depth, differentiating colours and seeing in varied conditions.',
                                    'WEF-1-1-2-1',
                                    '👀'
                                ),
                                leaf(
                                    'wef-auditory-abilities',
                                    'Auditory abilities',
                                    'Distinguishing and isolating sounds, interpreting speech and speaking clearly.',
                                    'WEF-1-1-2-2',
                                    '👂'
                                ),
                            ]
                        ),
                        tier(
                            'wef-manual-dexterity-endurance-precision',
                            'Manual dexterity, endurance and precision',
                            'Abilities related to manipulating objects, strength, endurance, flexibility, balance and coordination.',
                            'WEF-1-1-1',
                            '✋',
                            [
                                leaf(
                                    'wef-strength-and-stamina',
                                    'Strength and stamina',
                                    'The ability to exert muscle force in short bursts or over long periods with endurance to fatigue.',
                                    'WEF-1-1-1-2',
                                    '💪'
                                ),
                                leaf(
                                    'wef-dexterity',
                                    'Dexterity',
                                    'Steadily, precisely and responsively grasping, manipulating, and assembling objects or controls.',
                                    'WEF-1-1-1-1',
                                    '🤲'
                                ),
                                leaf(
                                    'wef-flexibility-and-coordination',
                                    'Flexibility and coordination',
                                    'Bending, stretching, twisting, reaching, and coordinating movement while maintaining balance.',
                                    'WEF-1-1-1-3',
                                    '🤸‍♂️'
                                ),
                            ]
                        ),
                    ]
                ),
                tier(
                    'wef-cognitive-skills',
                    'Cognitive skills',
                    'Mental abilities including learning, thinking, reasoning, remembering, problem solving, decision making, and attention.',
                    'WEF-1-2',
                    '🧠',
                    [
                        tier(
                            'wef-creativity-and-problem-solving',
                            'Creativity and problem solving',
                            'Qualitative reasoning and ideation.',
                            'WEF-1-2-1',
                            '💡',
                            [
                                leaf(
                                    'wef-creative-thinking',
                                    'Creative thinking',
                                    'Bringing a new idea or concept into existence through imagination.',
                                    'WEF-1-2-1-1',
                                    '🎨'
                                ),
                                leaf(
                                    'wef-analytical-thinking',
                                    'Analytical thinking',
                                    'Breaking down complex ideas into principles through critical thinking.',
                                    'WEF-1-2-1-2',
                                    '📊'
                                ),
                                leaf(
                                    'wef-systems-thinking',
                                    'Systems thinking',
                                    'Understanding how concepts work together and identifying patterns over time.',
                                    'WEF-1-2-1-3',
                                    '🔗'
                                ),
                            ]
                        ),
                        tier(
                            'wef-speaking-writing-languages',
                            'Speaking, writing and languages',
                            'Communicating through reading, writing, speaking and listening in a mother tongue or a foreign language.',
                            'WEF-1-2-3',
                            '🗣️',
                            [
                                leaf(
                                    'wef-reading',
                                    'Reading',
                                    'Understanding written sentences and paragraphs in work-related documents.',
                                    'WEF-1-2-3-1',
                                    '📖'
                                ),
                                leaf(
                                    'wef-speaking',
                                    'Speaking',
                                    'Talking to others to convey information effectively.',
                                    'WEF-1-2-3-2',
                                    '🗣️'
                                ),
                                leaf(
                                    'wef-writing',
                                    'Writing',
                                    'Communicating effectively in writing for the needs of the audience.',
                                    'WEF-1-2-3-3',
                                    '📝'
                                ),
                                leaf(
                                    'wef-editing',
                                    'Editing',
                                    'Synthesising text resources into a coherent narrative with a specified style or target audience.',
                                    'WEF-1-2-3-4',
                                    '✍️'
                                ),
                                leaf(
                                    'wef-multi-lingualism',
                                    'Multi-lingualism',
                                    'Communicating through reading, writing, speaking and listening in foreign languages.',
                                    'WEF-1-2-3-5',
                                    '🌐'
                                ),
                            ]
                        ),
                        tier(
                            'wef-mathematical-and-statistical-thinking',
                            'Mathematical and statistical thinking',
                            'Quantitative reasoning used to calculate, estimate or model phenomena.',
                            'WEF-1-2-2',
                            '🔢',
                            [
                                leaf(
                                    'wef-number-facility',
                                    'Number facility',
                                    'Rapidly and accurately adding, subtracting, multiplying and dividing.',
                                    'WEF-1-2-2-1',
                                    '🔡'
                                ),
                                leaf(
                                    'wef-calculating-and-estimating',
                                    'Calculating and estimating',
                                    'Synthesising quantitative information into calculations or estimates.',
                                    'WEF-1-2-2-2',
                                    '🧮'
                                ),
                                leaf(
                                    'wef-algebraic-facility',
                                    'Algebraic facility',
                                    'Solving equations and using advanced mathematical techniques.',
                                    'WEF-1-2-2-3',
                                    '➗'
                                ),
                                leaf(
                                    'wef-data-analysis-and-mathematical-modelling',
                                    'Data analysis and mathematical modelling',
                                    'Making statistical inferences from data and using statistical techniques for complex systems.',
                                    'WEF-1-2-2-4',
                                    '📊'
                                ),
                            ]
                        ),
                    ]
                ),
                tier(
                    'wef-technology-skills',
                    'Technology skills',
                    'Effectively designing and using technology.',
                    'WEF-1-5',
                    '💻',
                    [
                        tier(
                            'wef-technology-literacy',
                            'Technology literacy',
                            'Selecting the right tools needed to perform tasks and operating technology confidently.',
                            'WEF-1-5-1',
                            '📔',
                            [
                                leaf(
                                    'wef-collaboration-and-productivity-software',
                                    'Collaboration and productivity software',
                                    'Using software designed to help get work done faster and more efficiently.',
                                    'WEF-1-5-1-1',
                                    '🤝'
                                ),
                                leaf(
                                    'wef-manufacturing-technologies',
                                    'Manufacturing technologies',
                                    'Using technologies that assist in industrial production and manufacturing processes.',
                                    'WEF-1-5-1-2',
                                    '🏭'
                                ),
                                leaf(
                                    'wef-installation',
                                    'Installation',
                                    'Installing equipment, machines, wiring or programs to meet specifications.',
                                    'WEF-1-5-1-3',
                                    '⚙️'
                                ),
                            ]
                        ),
                        tier(
                            'wef-programming',
                            'Programming',
                            'Using software and programming languages.',
                            'WEF-1-5-2',
                            '💻',
                            [
                                leaf(
                                    'wef-functional-programming',
                                    'Functional programming',
                                    'Writing simple programs using calls to subroutines.',
                                    'WEF-1-5-2-1',
                                    '🧬'
                                ),
                                leaf(
                                    'wef-object-oriented-programming',
                                    'Object-oriented programming',
                                    'Using data encapsulation and inheritance to develop well designed programming projects.',
                                    'WEF-1-5-2-2',
                                    '🔄'
                                ),
                                leaf(
                                    'wef-computational-thinking',
                                    'Computational thinking',
                                    'Looking at real-world scenarios and creating models that can be processed by a computer.',
                                    'WEF-1-5-2-3',
                                    '🧮'
                                ),
                            ]
                        ),
                        tier(
                            'wef-design-and-user-experience',
                            'Design and user experience',
                            'Developing and delivering effective and efficient physical and digital designs with users in mind.',
                            'WEF-1-5-3',
                            '🎨',
                            [
                                leaf(
                                    'wef-human-technology-interaction',
                                    'Human-technology interaction',
                                    'Balancing usability, ergonomics, perception, cognition, and consumer behaviour in design.',
                                    'WEF-1-5-3-1',
                                    '👨‍💻'
                                ),
                                leaf(
                                    'wef-mobile-development',
                                    'Mobile development',
                                    'Developing applications for mobile devices.',
                                    'WEF-1-5-3-2',
                                    '📱'
                                ),
                                leaf(
                                    'wef-web-development',
                                    'Web development',
                                    'Building and maintaining websites.',
                                    'WEF-1-5-3-3',
                                    '🌐'
                                ),
                            ]
                        ),
                        tier(
                            'wef-networks-and-cybersecurity',
                            'Networks and cybersecurity',
                            'Securely and efficiently delivering information-technology solutions.',
                            'WEF-1-5-4',
                            '🔐',
                            [
                                leaf(
                                    'wef-computer-hardware-and-networking',
                                    'Computer hardware and networking',
                                    'Setting up a connected network of computing devices.',
                                    'WEF-1-5-4-1',
                                    '🖥️'
                                ),
                                leaf(
                                    'wef-cybersecurity-and-application-security',
                                    'Cybersecurity and application security',
                                    'Protecting computers, networks, programs and data from unauthorised access or attacks.',
                                    'WEF-1-5-4-2',
                                    '🛡️'
                                ),
                                leaf(
                                    'wef-cloud-computing',
                                    'Cloud computing',
                                    'Delivering computing services over the internet.',
                                    'WEF-1-5-4-3',
                                    '☁️'
                                ),
                            ]
                        ),
                        tier(
                            'wef-artificial-intelligence-and-big-data',
                            'Artificial intelligence and big data',
                            'Building and developing machines capable of thinking autonomously and performing tasks that mimic human intelligence.',
                            'WEF-1-5-5',
                            '🤖',
                            [
                                leaf(
                                    'wef-data-mining',
                                    'Data mining',
                                    'Accessing, cleaning and sorting large data sets and using software tools to visualise results.',
                                    'WEF-1-5-5-1',
                                    '⛏️'
                                ),
                                leaf(
                                    'wef-supervised-learning',
                                    'Supervised learning',
                                    'Designing neural networks trained to reliably make decisions based on example data.',
                                    'WEF-1-5-5-2',
                                    '🖥️'
                                ),
                                leaf(
                                    'wef-unsupervised-learning',
                                    'Unsupervised learning',
                                    'Designing neural networks which detect clusters and patterns without human guidance.',
                                    'WEF-1-5-5-3',
                                    '🔍'
                                ),
                            ]
                        ),
                    ]
                ),
                tier(
                    'wef-management-skills',
                    'Management skills',
                    'Capacity to allocate resources efficiently and effectively and manage activities that organizations need every day to create value.',
                    'WEF-1-3',
                    '📊',
                    [
                        tier(
                            'wef-financial-management',
                            'Financial management',
                            'Gathering resources to achieve tasks, deciding how money will be spent, and accounting for expenditures.',
                            'WEF-1-3-3',
                            '💵',
                            [
                                leaf(
                                    'wef-accounting',
                                    'Accounting',
                                    'Tracking the flow of money that has been spent.',
                                    'WEF-1-3-3-1',
                                    '📊'
                                ),
                                leaf(
                                    'wef-finance',
                                    'Finance',
                                    'Budgeting money, managing financial portfolios, and tracking economic trends that affect performance.',
                                    'WEF-1-3-3-2',
                                    '💰'
                                ),
                            ]
                        ),
                        tier(
                            'wef-operations-and-logistics',
                            'Operations and logistics',
                            'Managing material resources and the use of equipment, facilities, and materials needed to do work.',
                            'WEF-1-3-2',
                            '🚚',
                            [
                                leaf(
                                    'wef-coordination-and-time-management',
                                    'Coordination and time management',
                                    'Coordinating time-sensitive schedules in cooperation with others.',
                                    'WEF-1-3-2-1',
                                    '🕒'
                                ),
                                leaf(
                                    'wef-project-management',
                                    'Project management',
                                    'Leading the work of a team to identify and implement the right changes, tools, and improvements.',
                                    'WEF-1-3-2-2',
                                    '📋'
                                ),
                                leaf(
                                    'wef-supply-chain-management',
                                    'Supply-chain management',
                                    'Optimising the flow of the goods and services required to realise a product or goal.',
                                    'WEF-1-3-2-3',
                                    '⚙️'
                                ),
                            ]
                        ),
                        tier(
                            'wef-talent-management',
                            'Talent management',
                            'Evaluating skills and skills gaps and gathering personnel resources to achieve tasks.',
                            'WEF-1-3-1',
                            '🧑‍🎤',
                            [
                                leaf(
                                    'wef-skill-evaluation',
                                    'Skill evaluation',
                                    'Accurately evaluating a candidate or colleague’s proficiencies over their full profile of skills, knowledge, abilities and attitudes.',
                                    'WEF-1-3-1-1',
                                    '📈'
                                ),
                                leaf(
                                    'wef-talent-planning-and-development',
                                    'Talent planning and development',
                                    'Identifying development or hiring solutions to bridge skills gaps and ensure knowledge transfer.',
                                    'WEF-1-3-1-2',
                                    '📈'
                                ),
                            ]
                        ),
                        tier(
                            'wef-quality-management',
                            'Quality management',
                            'Pursuing excellence in workplace processes, products and activities.',
                            'WEF-1-3-4',
                            '✔️',
                            [
                                leaf(
                                    'wef-quality-assurance',
                                    'Quality assurance',
                                    'Setting quality objectives, specifying operational processes, and improving them based on experience.',
                                    'WEF-1-3-4-1',
                                    '👍'
                                ),
                                leaf(
                                    'wef-quality-control',
                                    'Quality control',
                                    'Inspecting products to ensure they fulfil quality requirements.',
                                    'WEF-1-3-4-2',
                                    '🔍'
                                ),
                                leaf(
                                    'wef-risk-management',
                                    'Risk management',
                                    'Assessing, prioritising and mitigating the effect of uncertainty on objectives.',
                                    'WEF-1-3-4-3',
                                    '⚠️'
                                ),
                            ]
                        ),
                    ]
                ),
                tier(
                    'wef-attitudes',
                    'Attitudes',
                    'Behaviours, emotional-intelligence traits and beliefs that influence interpersonal interactions and approaches to ideas, persons and situations.',
                    'WEF-2',
                    '🤔',
                    [
                        tier(
                            'wef-ethics',
                            'Ethics',
                            'Ethical attitudes maintain awareness of the societal and environmental impacts of personal and organizational actions.',
                            'WEF-2-3',
                            '⚖️',
                            [
                                tier(
                                    'wef-environmental-stewardship',
                                    'Environmental stewardship',
                                    'Sustainably using natural resources and protecting the natural environment.',
                                    'WEF-2-3-2',
                                    '🌿',
                                    [
                                        leaf(
                                            'wef-environmental-awareness',
                                            'Environmental awareness',
                                            'Being mindful of the impact of humans and human activity on the planet.',
                                            'WEF-2-3-2-1',
                                            '🍀'
                                        ),
                                        leaf(
                                            'wef-sustainable-and-efficient-resource-usage',
                                            'Sustainable and efficient resource usage',
                                            'Using natural resources sustainably and efficiently.',
                                            'WEF-2-3-2-2',
                                            '💧'
                                        ),
                                        leaf(
                                            'wef-adopting-green-technologies',
                                            'Adopting green technologies',
                                            'Adopting clean and environmentally sound technologies and industrial processes.',
                                            'WEF-2-3-2-3',
                                            '♻️'
                                        ),
                                    ]
                                ),
                                tier(
                                    'wef-civic-responsibility',
                                    'Civic responsibility',
                                    'Playing an active role in the global and local community and applying civic values.',
                                    'WEF-2-3-1',
                                    '🏛️',
                                    [
                                        leaf(
                                            'wef-social-cultural-awareness',
                                            'Social-cultural awareness',
                                            'Respecting and understanding the ideas, customs, and social behaviours of others.',
                                            'WEF-2-3-1-2',
                                            '🌏'
                                        ),
                                        leaf(
                                            'wef-social-justice',
                                            'Social justice',
                                            'Actively building inclusivity and fairness across wealth, privilege and opportunity.',
                                            'WEF-2-3-1-1',
                                            '🧑‍⚖️'
                                        ),
                                        leaf(
                                            'wef-technology-ethics',
                                            'Technology ethics',
                                            'Applying moral principles for the responsible use of technology.',
                                            'WEF-2-3-1-3',
                                            '🛡️'
                                        ),
                                    ]
                                ),
                            ]
                        ),
                        tier(
                            'wef-self-efficacy',
                            'Self-efficacy',
                            'Controlling one’s thoughts, feelings and actions.',
                            'WEF-2-1',
                            '💪',
                            [
                                tier(
                                    'wef-motivation-and-self-awareness',
                                    'Motivation and self-awareness',
                                    'Seeing one’s own values, passions, reactions, strengths, weaknesses, and impact on others.',
                                    'WEF-2-1-1',
                                    '🌟',
                                    [
                                        leaf(
                                            'wef-internal-self-awareness',
                                            'Internal self-awareness',
                                            'Understanding one’s own values, passions, aspirations and reactions.',
                                            'WEF-2-1-1-1',
                                            '🧠'
                                        ),
                                        leaf(
                                            'wef-external-self-awareness',
                                            'External self-awareness',
                                            'Awareness of how one is perceived by others.',
                                            'WEF-2-1-1-2',
                                            '🌍'
                                        ),
                                        leaf(
                                            'wef-self-control',
                                            'Self-control',
                                            'Doing what is best despite short-term temptations.',
                                            'WEF-2-1-1-3',
                                            '🧘'
                                        ),
                                    ]
                                ),
                            ]
                        ),
                    ]
                ),
            ]
        ),
    ],
};

const PATHSMITH_DURABLE_SKILLS_STARTER_EDITION: SeedFrameworkInput = {
    id: 'pathsmith-durable-skills-starter-edition',
    name: 'Pathsmith Durable Skills Starter Edition',
    description:
        'A durable-skills framework for early-career learners, translating employer demand into a clear guide for growth, assessment, and economic mobility.',
    sourceURI: 'learncard://seed/skill-frameworks/pathsmith-durable-skills-starter-edition',
    image: 'https://cdn.filestackcontent.com/lFafCT74SS6dgB0xWCMo',
    skills: [
        tier(
            'pathsmith-leadership-domain',
            'Leadership Domain',
            'This early career individual can influence and motivate teams, lead others toward a common goal, model work ethic, and communicate clearly.',
            '2.0',
            '🦁',
            [
                leaf(
                    'pathsmith-project-management',
                    'Project Management',
                    'Use specific knowledge, skills, tools, and techniques to achieve project objectives and deliver value.',
                    '2.5',
                    '🗂️'
                ),
                leaf(
                    'pathsmith-decision-making',
                    'Decision Making',
                    'Analyze information, evaluate options, and make logical decisions that align with goals.',
                    '2.4',
                    '🤔'
                ),
                leaf(
                    'pathsmith-mentorship',
                    'Mentorship',
                    'Provide guidance and support to others in their personal and professional development.',
                    '2.3',
                    '👨‍🏫'
                ),
                leaf(
                    'pathsmith-thought-leadership',
                    'Thought Leadership',
                    'Develop and communicate innovative and insightful ideas that position an individual as a trusted authority.',
                    '2.8',
                    '💡'
                ),
                leaf(
                    'pathsmith-advocacy',
                    'Advocacy',
                    'Defend, promote, and support a cause or issue.',
                    '2.6',
                    '📢'
                ),
                leaf(
                    'pathsmith-leadership',
                    'Leadership',
                    'Motivate and guide a group of people toward achieving a common goal.',
                    '2.2',
                    '🦅'
                ),
                leaf(
                    'pathsmith-management',
                    'Management',
                    'Plan, organize, and coordinate resources in order to achieve specific goals and objectives.',
                    '2.1',
                    '🗃️'
                ),
                leaf(
                    'pathsmith-risk-management',
                    'Risk Management',
                    'Identify, assess, prioritize, and mitigate potential risks and uncertainties.',
                    '2.7',
                    '📉'
                ),
            ]
        ),
        tier(
            'pathsmith-critical-thinking-domain',
            'Critical Thinking Domain',
            'This early career individual can process and synthesize information, apply logic and reasoning, and articulate pros and cons.',
            '4.0',
            '🔍',
            [
                leaf(
                    'pathsmith-research',
                    'Research',
                    'Gather and analyze information systematically to gain insights and solve problems.',
                    '4.2',
                    '📖'
                ),
                leaf(
                    'pathsmith-problem-solving',
                    'Problem-Solving',
                    'Define a problem, determine its cause, evaluate alternatives, and implement a solution.',
                    '4.1',
                    '🛠️'
                ),
                leaf(
                    'pathsmith-prioritization',
                    'Prioritization',
                    'Organize and manage tasks according to importance and urgency.',
                    '4.3',
                    '📋'
                ),
                leaf(
                    'pathsmith-analytical-thinking',
                    'Analytical Thinking',
                    'Evaluate and interpret complex information to draw insights and make informed decisions.',
                    '4.7',
                    '🧠'
                ),
                leaf(
                    'pathsmith-critical-thinking',
                    'Critical Thinking',
                    'Analyze and evaluate information to make objective and informed decisions.',
                    '4.5',
                    '🧩'
                ),
                leaf(
                    'pathsmith-investigation',
                    'Investigation',
                    'Gather and analyze information from various sources to identify and resolve issues.',
                    '4.4',
                    '🔬'
                ),
                leaf(
                    'pathsmith-intellectual-curiosity',
                    'Intellectual Curiosity',
                    'Seek knowledge and understand new information by asking questions and exploring ideas.',
                    '4.6',
                    '🤔'
                ),
            ]
        ),
        tier(
            'pathsmith-collaboration-domain',
            'Collaboration Domain',
            'This early career individual can communicate effectively, respect diverse backgrounds, and align resources toward a common goal.',
            '5.0',
            '🤲',
            [
                leaf(
                    'pathsmith-team-building',
                    'Team-Building',
                    'Organize a team by strengthening relationships, celebrating strengths, and actively participating in team experiences.',
                    '5.4',
                    '🏗️'
                ),
                leaf(
                    'pathsmith-coordinating',
                    'Coordinating',
                    'Contribute to a team by clearly communicating work and adapting to change.',
                    '5.2',
                    '🔗'
                ),
                leaf(
                    'pathsmith-interpersonal-relationships',
                    'Interpersonal Relationships',
                    'Understand priorities and organize time, people, and resources to achieve a common goal.',
                    '5.1',
                    '💬'
                ),
                leaf(
                    'pathsmith-teamwork-team-oriented',
                    'Teamwork/Team-Oriented',
                    'Manage time and resource constraints to complete tasks efficiently.',
                    '5.3',
                    '👥'
                ),
                leaf(
                    'pathsmith-cooperation',
                    'Cooperation',
                    'Prioritize the common goal of a group over personal goals for the benefit of the larger group.',
                    '5.5',
                    '🤝'
                ),
                leaf(
                    'pathsmith-remote-virtual-teams',
                    'Remote/Virtual Teams',
                    'Collaborate effectively with team members who are not in the same physical location.',
                    '5.6',
                    '💻'
                ),
                leaf(
                    'pathsmith-scheduling',
                    'Scheduling',
                    'Manage time and resource constraints to plan for completion of tasks on schedule.',
                    '5.7',
                    '🗓️'
                ),
            ]
        ),
        tier(
            'pathsmith-fortitude-domain',
            'Fortitude Domain',
            'This early career individual can recover from setbacks, adapt under pressure, and trust their abilities while staying humble.',
            '10.0',
            '🛡️',
            [
                leaf(
                    'pathsmith-resilience',
                    'Resilience',
                    'Respond to adversity and recover from unexpected situations while revising the plan.',
                    '10.1',
                    '🌱'
                ),
                leaf(
                    'pathsmith-motivational-skills',
                    'Motivational Skills',
                    'Use contextually appropriate strategies to elicit a desired reaction from a group.',
                    '10.2',
                    '🏋️'
                ),
                leaf(
                    'pathsmith-optimism',
                    'Optimism',
                    'Maintain a positive attitude and focus on the best possible outcomes.',
                    '10.3',
                    '🌞'
                ),
                leaf(
                    'pathsmith-tenacity',
                    'Tenacity',
                    'Stay focused on the process and persist when completing a task.',
                    '10.4',
                    '🐢'
                ),
                leaf(
                    'pathsmith-assertiveness',
                    'Assertiveness',
                    'Advocate for oneself while engaging in constructive discourse without being aggressive.',
                    '10.5',
                    '🗣️'
                ),
                leaf(
                    'pathsmith-self-discipline',
                    'Self-Discipline',
                    'Regulate actions and emotions to stay committed to a goal and remain accountable.',
                    '10.6',
                    '🎓'
                ),
                leaf(
                    'pathsmith-calmness-under-pressure',
                    'Calmness Under Pressure',
                    'Stay composed and level-headed during challenging or high-pressure situations.',
                    '10.7',
                    '😌'
                ),
                leaf(
                    'pathsmith-self-confident',
                    'Self-Confident',
                    'Trust one’s abilities and present information with poise.',
                    '10.8',
                    '💪'
                ),
            ]
        ),
        tier(
            'pathsmith-character-domain',
            'Character Domain',
            'This early career individual is dependable, respectful, ethical, and consistent in their work and commitments.',
            '6.0',
            '⚖️',
            [
                leaf(
                    'pathsmith-reliability',
                    'Reliability',
                    'Consistently produce high-quality work and fulfill commitments to others.',
                    '6.5',
                    '⌚'
                ),
                leaf(
                    'pathsmith-self-motivation',
                    'Self-Motivation',
                    'Stay driven, focused, and committed to achieving goals without constant direction.',
                    '6.2',
                    '🏆'
                ),
                leaf(
                    'pathsmith-personal-integrity',
                    'Personal Integrity',
                    'Act in accordance with a set of values and principles, and remain honest and transparent.',
                    '6.6',
                    '🤝'
                ),
                leaf(
                    'pathsmith-tactfulness',
                    'Tactfulness',
                    'Navigate situations with sensitivity and communicate respectfully and considerately.',
                    '6.4',
                    '🎩'
                ),
                leaf(
                    'pathsmith-trustworthy',
                    'Trustworthy',
                    'Demonstrate honesty, reliability, and ethical behavior while following through on commitments.',
                    '6.3',
                    '🔒'
                ),
                leaf(
                    'pathsmith-accountability',
                    'Accountability',
                    'Take ownership of responsibilities, meet expectations, and accept the consequences of actions.',
                    '6.1',
                    '📒'
                ),
            ]
        ),
        tier(
            'pathsmith-communication-domain',
            'Communication Domain',
            'This early career individual can convey information through written, verbal, and non-verbal communication and adapt to different audiences and channels.',
            '1.0',
            '📡',
            [
                leaf(
                    'pathsmith-social-media',
                    'Social Media',
                    'Create, manage, and leverage social media platforms to reach and engage a target audience.',
                    '1.6',
                    '📱'
                ),
                leaf(
                    'pathsmith-verbal-communication',
                    'Verbal Communication',
                    'Verbally convey information, thoughts, or ideas to others.',
                    '1.4',
                    '🗨️'
                ),
                leaf(
                    'pathsmith-customer-service',
                    'Customer Service',
                    'Provide assistance and guidance to people before, during, and after they use products or services.',
                    '1.7',
                    '📞'
                ),
                leaf(
                    'pathsmith-communications-hybrid-remote',
                    'Communications (hybrid/remote)',
                    'Effectively exchange information, thoughts, and ideas in virtual and in-person environments.',
                    '1.1',
                    '📧'
                ),
                leaf(
                    'pathsmith-public-speaking',
                    'Public Speaking',
                    'Effectively deliver a message to engage, inform, and persuade an audience.',
                    '1.8',
                    '🎤'
                ),
                leaf(
                    'pathsmith-written-communication',
                    'Written Communication',
                    'Convey information, thoughts, or ideas in written form to others.',
                    '1.3',
                    '✏️'
                ),
                leaf(
                    'pathsmith-negotiation',
                    'Negotiation',
                    'Strategically guide a discussion between parties aimed at reaching an agreement or solution.',
                    '1.5',
                    '🤝'
                ),
                leaf(
                    'pathsmith-presentation',
                    'Presentation',
                    'Effectively convey ideas or information to an audience.',
                    '1.2',
                    '📊'
                ),
            ]
        ),
        tier(
            'pathsmith-mindfulness-domain',
            'Mindfulness Domain',
            'This early career individual is self-aware, welcoming, respectful, open to hearing others, and grounded in their emotional responses.',
            '9.0',
            '🧘',
            [
                leaf(
                    'pathsmith-emotional-intelligence',
                    'Emotional Intelligence',
                    'Fully concentrate on, understand, and respond to verbal and nonverbal communication.',
                    '9.6',
                    '🧠'
                ),
                leaf(
                    'pathsmith-compassion',
                    'Compassion',
                    'Provide friendly, attentive, and welcoming service to customers or clients.',
                    '9.2',
                    '❤️'
                ),
                leaf(
                    'pathsmith-patience',
                    'Patience',
                    'Understand and share the feelings, perspectives, and experiences of others.',
                    '9.4',
                    '⏳'
                ),
                leaf(
                    'pathsmith-cultural-sensitivity',
                    'Cultural Sensitivity',
                    'Recognize the influence of culture and interact with others in a respectful way.',
                    '9.8',
                    '🌍'
                ),
                leaf(
                    'pathsmith-hospitality',
                    'Hospitality',
                    'Work independently and take initiative to complete tasks without external direction.',
                    '9.1',
                    '🏨'
                ),
                leaf(
                    'pathsmith-active-listening',
                    'Active Listening',
                    'Maintain calm focus, understand what is being said, and demonstrate engagement and interest.',
                    '9.5',
                    '👂'
                ),
                leaf(
                    'pathsmith-humility',
                    'Humility',
                    'Recognize, understand, and manage emotions while empathizing with and effectively communicating with others.',
                    '9.7',
                    '🙏'
                ),
                leaf(
                    'pathsmith-empathy',
                    'Empathy',
                    'Show kindness and understanding toward others.',
                    '9.3',
                    '🤝'
                ),
            ]
        ),
        tier(
            'pathsmith-creativity-domain',
            'Creativity Domain',
            'This early career individual can generate new ideas, learn from failure, and work with others through brainstorming and iteration.',
            '7.0',
            '🎨',
            [
                leaf(
                    'pathsmith-creative-thinking',
                    'Creative Thinking',
                    'Approach problems in a non-traditional way and generate new ideas and solutions.',
                    '7.2',
                    '🖌️'
                ),
                leaf(
                    'pathsmith-ideation',
                    'Ideation',
                    'Generate and develop new ideas to address business challenges.',
                    '7.4',
                    '💭'
                ),
                leaf(
                    'pathsmith-brainstorming',
                    'Brainstorming',
                    'Contribute spontaneous ideas during group problem solving.',
                    '7.6',
                    '💡'
                ),
                leaf(
                    'pathsmith-innovation',
                    'Innovation',
                    'Generate new ideas and creatively apply them to drive growth or solve problems.',
                    '7.1',
                    '⚙️'
                ),
                leaf(
                    'pathsmith-experimentation',
                    'Experimentation',
                    'Use iterative testing and validation to improve ideas, products, and services.',
                    '7.5',
                    '🧪'
                ),
                leaf(
                    'pathsmith-visionary',
                    'Visionary',
                    'Think beyond the present and envision and plan for a future state.',
                    '7.3',
                    '👁️'
                ),
            ]
        ),
        tier(
            'pathsmith-metacognition-domain',
            'Metacognition Domain',
            'This early career individual can adapt to changing conditions, manage details and deadlines, and use feedback to improve performance.',
            '3.0',
            '🧠',
            [
                leaf(
                    'pathsmith-detail-oriented',
                    'Detail-Oriented',
                    'Pay close attention to the small details of a task and remain aware of impactful information.',
                    '3.1',
                    '🔍'
                ),
                leaf(
                    'pathsmith-planning',
                    'Planning',
                    'Envision the end goal and the process required to achieve it.',
                    '3.2',
                    '🗓️'
                ),
                leaf(
                    'pathsmith-teaching',
                    'Teaching',
                    'Effectively impart or convey knowledge, skills, and values to others.',
                    '3.3',
                    '👨‍🏫'
                ),
                leaf(
                    'pathsmith-organizational-skills',
                    'Organizational Skills',
                    'Identify the resources needed to complete a task and implement them effectively.',
                    '3.4',
                    '🗂️'
                ),
                leaf(
                    'pathsmith-time-management',
                    'Time Management',
                    'Estimate how long tasks take and assess progress against completion timelines.',
                    '3.5',
                    '⏰'
                ),
                leaf(
                    'pathsmith-adaptability',
                    'Adaptability',
                    'Be flexible to changing circumstances and adjust plans efficiently.',
                    '3.6',
                    '🌊'
                ),
                leaf(
                    'pathsmith-goal-setting',
                    'Goal Setting',
                    'Establish clear and achievable objectives and develop a plan to achieve them.',
                    '3.7',
                    '🎯'
                ),
                leaf(
                    'pathsmith-constructive-feedback',
                    'Constructive Feedback',
                    'Provide specific and actionable feedback to improve performance and achieve organizational goals.',
                    '3.8',
                    '✍️'
                ),
            ]
        ),
        tier(
            'pathsmith-growth-mindset-domain',
            'Growth Mindset Domain',
            'This early career individual is resourceful, confident, curious, and focused on learning beyond the surface.',
            '8.0',
            '🌿',
            [
                leaf(
                    'pathsmith-self-starter',
                    'Self-Starter',
                    'Work independently and take initiative to complete tasks without external direction.',
                    '8.1',
                    '🚴'
                ),
                leaf(
                    'pathsmith-proactivity',
                    'Proactivity',
                    'Take initiative and anticipate potential issues or opportunities before they arise.',
                    '8.2',
                    '📈'
                ),
                leaf(
                    'pathsmith-curiosity',
                    'Curiosity',
                    'Be eager to learn new things, seek out information, and ask questions to better understand problems.',
                    '8.3',
                    '🔍'
                ),
                leaf(
                    'pathsmith-resourcefulness',
                    'Resourcefulness',
                    'Quickly find effective solutions even when resources are limited or unclear.',
                    '8.4',
                    '🔧'
                ),
                leaf(
                    'pathsmith-action-oriented',
                    'Action-Oriented',
                    'Take initiative, set goals, and actively work toward achieving them.',
                    '8.6',
                    '🏃'
                ),
                leaf(
                    'pathsmith-results-focused',
                    'Results-Focused',
                    'Meet or exceed goals and focus on outcomes rather than the process.',
                    '8.7',
                    '🎯'
                ),
                leaf(
                    'pathsmith-self-sufficiency',
                    'Self-Sufficiency',
                    'Work independently, take ownership of tasks, and complete them with minimal guidance.',
                    '8.8',
                    '🚜'
                ),
            ]
        ),
    ],
};

export const DEFAULT_SKILL_FRAMEWORKS: SeedSkillFrameworkFixture[] = [
    buildFramework(WEF_GLOBAL_SKILLS_TAXONOMY),
    buildFramework(PATHSMITH_DURABLE_SKILLS_STARTER_EDITION),
];
