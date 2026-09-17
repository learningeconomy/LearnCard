const DEMO_SCHOOL_PROFILE = {
    id: 'https://demo.learncard.app/issuers/demo-school',
    type: ['Profile'],
    name: 'Demo School',
    url: 'https://www.learncard.com/',
};

export const STUDENT_ACHIEVEMENTS = {
    civicLeadership: {
        id: 'https://demo.learncard.app/achievements/civic-leadership',
        type: ['Achievement'],
        achievementType: 'Achievement',
        name: 'Civic Leadership',
        description:
            'Recognizes thoughtful leadership, collaboration, and service in a student-led community project.',
        criteria: {
            narrative:
                'Plan and lead a community project, document the outcome, and reflect on lessons learned.',
        },
        image: {
            id: 'https://cdn.filestackcontent.com/RXaNgRHTHCNr3meO1G0A',
            type: 'Image',
            caption: 'Civic Leadership badge',
        },
        creator: DEMO_SCHOOL_PROFILE,
        alignment: [
            {
                type: ['Alignment'],
                targetName: 'Leadership',
                targetUrl: 'https://www.onetonline.org/skills/2.B.4',
                targetType: 'ceasn:Competency',
                targetFramework: 'O*NET',
                targetDescription:
                    'Guide people toward a shared goal while considering different perspectives.',
            },
            {
                type: ['Alignment'],
                targetName: 'Collaboration',
                targetUrl: 'https://www.onetonline.org/skills/2.B.1',
                targetType: 'ceasn:Competency',
                targetFramework: 'O*NET',
                targetDescription: 'Work effectively with others to complete a shared task.',
            },
        ],
        tag: [
            'leadership',
            'collaboration',
            'community-service',
            'lc:category:Achievement',
            'lc:subtype:Leadership',
            'lc:displayType:badge',
            'lc:bgColor:18224E',
            'lc:accentColor:34D399',
        ],
    },
    webDevelopment: {
        id: 'https://demo.learncard.app/achievements/web-development-foundations',
        type: ['Achievement'],
        achievementType: 'Course',
        name: 'Web Development Foundations',
        description:
            'Completed a project-based course covering accessible HTML, modern CSS, JavaScript, and version control.',
        humanCode: 'WEB-101',
        fieldOfStudy: 'Computer Science',
        creditsAvailable: 3,
        criteria: {
            narrative:
                'Complete all course modules and publish an accessible capstone website with a passing review.',
        },
        image: {
            id: 'https://cdn.filestackcontent.com/erbcRQfTG2TktX2hcmLu',
            type: 'Image',
            caption: 'Web Development Foundations certificate',
        },
        creator: DEMO_SCHOOL_PROFILE,
        alignment: [
            {
                type: ['Alignment'],
                targetName: 'Web Development',
                targetUrl: 'https://www.onetonline.org/link/summary/15-1254.00',
                targetType: 'ceasn:Competency',
                targetFramework: 'O*NET',
                targetDescription:
                    'Design, build, and maintain accessible websites using modern web technologies.',
            },
        ],
        tag: [
            'html',
            'css',
            'javascript',
            'accessibility',
            'lc:category:Achievement',
            'lc:subtype:Course Certificate',
            'lc:displayType:certificate',
            'lc:bgColor:065F46',
            'lc:accentColor:A7F3D0',
        ],
    },
    communityImpact: {
        id: 'https://demo.learncard.app/achievements/community-impact',
        type: ['Achievement'],
        achievementType: 'Award',
        name: 'Community Impact Award',
        description:
            'Awarded for measurable, sustained contributions to a local environmental initiative.',
        criteria: {
            narrative:
                'Contribute at least 20 verified service hours and present the project outcomes to the school community.',
        },
        image: {
            id: 'https://cdn.filestackcontent.com/aWUPGBPRFenRT9taokA6',
            type: 'Image',
            caption: 'Community Impact Award',
        },
        creator: DEMO_SCHOOL_PROFILE,
        tag: [
            'community-service',
            'sustainability',
            'lc:category:Achievement',
            'lc:subtype:Community Award',
            'lc:displayType:award',
            'lc:bgColor:92400E',
            'lc:accentColor:FDE68A',
        ],
    },
} as const;

export const DEMO_SCHOOL_ISSUER = DEMO_SCHOOL_PROFILE;
