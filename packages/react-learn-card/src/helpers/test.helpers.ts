import { VerificationStatusEnum } from '@learncard/types';

// See https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/
// For example data structure for plugfest
export const JffCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/jff-vc-edu-plugfest-1-context.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
        type: 'Profile',
        id: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        name: 'Jobs for the Future (JFF)',
        url: 'https://www.jff.org/',
        image: 'https://kayaelle.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
    },
    issuanceDate: '2022-07-27T19:57:31.512Z',
    credentialSubject: {
        type: 'AchievementSubject',
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        achievement: {
            type: 'Achievement',
            name: 'Our Wallet Passed JFF Plugfest #1 2022',
            description: 'This wallet can display this Open Badge 3.0',
            criteria: {
                type: 'Criteria',
                narrative:
                    'The first cohort of the JFF Plugfest 1 in May/June of 2021 collaborated to push interoperability of VCs in education forward.',
            },
            image: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png',
        },
    },
};

export const SuperSkillsOprahCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: 'http://example.com/credentials/3527',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
    issuanceDate: '2022-12-15T01:40:50.794Z',
    credentialSubject: {
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        type: ['AchievementSubject'],
        achievement: {
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            tag: ['Emotional', 'Emotional Subskill 1'],
            name: 'The Oprah',
            type: ['Achievement'],
            image: 'https://cdn.filestackcontent.com/04DxNAaQ66aphkQvbT9W',
            description:
                'You get a badge! You get a badge! You get a badge! You get a badge! You get a badge! You get a badge! EVERYBODY GETS A BADGE!!!',
        },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2022-12-15T01:40:50.798Z',
        proofPurpose: 'assertionMethod',
        verificationMethod:
            'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo#z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        proofValue:
            'z5R86gecRsBh1xmPJqdfqoNppxy4hbMZWtjZZNdaqGYtwBcPHNzXwAtHdqhTWQVprQn6B8xfQvqqvQo3ZjaTjt3tW',
    },
    name: 'The Oprah',
};

export const testTags = [
    'Skill A',
    'Subskill A 1',
    'Subskill A 2',
    'Skill B',
    'Skill C',
    'Subskill C',
];

export const AllFieldsCredential = {
    name: 'Verbose Credential',
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: 'http://example.com/credentials/3527',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
    issuanceDate: '2022-12-15T01:40:50.794Z',
    credentialSubject: {
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        type: ['AchievementSubject'],
        achievement: {
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            tag: testTags,
            name: 'Verbose Credentialing',
            type: ['Achievement'],
            image: 'https://cdn.filestackcontent.com/04DxNAaQ66aphkQvbT9W',
            description:
                "You made a test credential with ALL the possible fields! Woah! That's great! There are so many fields on this credential! Let's make this even longer so that it gets truncated",
            criteria: {
                type: 'Criteria',
                narrative:
                    'You really know your crednetials! Pretty rad. Being able to find and handle all of these fields is incredible! This narrative is going to be pretty long so that we can see if you can handle long blocks of text too. This should probably be truncated off by now or something.',
            },
        },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2022-12-15T01:40:50.798Z',
        proofPurpose: 'assertionMethod',
        verificationMethod:
            'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo#z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        proofValue:
            'z5R86gecRsBh1xmPJqdfqoNppxy4hbMZWtjZZNdaqGYtwBcPHNzXwAtHdqhTWQVprQn6B8xfQvqqvQo3ZjaTjt3tW',
    },
    display: { backgroundImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7' },
    attachments: [
        {
            type: 'document',
            title: 'Custom PDF title',
            url: 'https://cdn.filestackcontent.com/4LN0x2LQXSjIH3c5bfBr',
        },
        {
            type: 'link',
            title: 'Mooji',
            url: 'https://www.moojisanghavibe.org',
        },
        {
            type: 'document',
            title: 'This is a text file with a super long name that goes to two lines',
            url: 'https://cdn.filestackcontent.com/BqqfmVEbQFmRaqwvqTMA',
        },
        { type: 'photo', url: 'https://cdn.filestackcontent.com/XuMpArLAQ3qam5OdArih' },
        { type: 'video', url: 'https://www.youtube.com/watch?v=fV7mWuCdkpY' },
        { type: 'photo', url: 'https://cdn.filestackcontent.com/PNb6lViSaqGoKyRyXyyp' },
        { type: 'photo', url: 'https://images.unsplash.com/photo-1607419145932-ed1fc8c034d8' },
        {
            type: 'link',
            title: 'Metta Meditation',
            url: 'https://unveilingtiamat.com/wp-content/uploads/2022/02/Radiant-Threefold-Path-Lovingkindness-Meditation-1.pdf?vgo_ee=KR53S3mb9fY4az4OUTbOR0zkASpiHornD%2Fz2wZTd1jg%3D&fbclid=IwAR1yXamIvuEs-PEJeXvbZp20NvlyvC2SQ-5QLATCepopuqIypO6Pfeb_6iM',
        },
        {
            type: 'video',
            title: 'Herbie Highlights 2022',
            url: 'https://www.youtube.com/watch?v=8Mt4YAileOo',
        },
        {
            type: 'video',
            title: 'Ram Dass - Be Here Now',
            url: 'https://vimeo.com/406283337',
        },
    ],
    skills: [
        {
            category: 'digital',
            skill: 'softwareProficiency',
            subskills: ['productivitySuites', 'specializedSoftware', 'designSoftware'],
        },
        {
            category: 'stem',
            skill: 'technology',
            subskills: ['coding', 'softwareDevelopment', 'dataAnalysis'],
        },
    ],
};

export const AllFieldsBackgroundColorCredential = {
    ...AllFieldsCredential,
    display: { backgroundColor: 'lightblue' },
};

export const LongTitleCredential = {
    name: 'This is a super long credential name because we want to test the ribbon with a long name',
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: 'http://example.com/credentials/3527',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
    issuanceDate: '2022-12-15T01:40:50.794Z',
    credentialSubject: {
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        type: ['AchievementSubject'],
        achievement: {
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            tag: testTags,
            name: 'This is a super long credential name because we want to test the ribbon with a long name',
            type: ['Achievement'],
            image: 'https://cdn.filestackcontent.com/04DxNAaQ66aphkQvbT9W',
            description:
                "You made a test credential with ALL the possible fields! Woah! That's great! There are so many fields on this credential! Let's make this even longer so that it gets truncated",
            criteria: {
                type: 'Criteria',
                narrative:
                    'You really know your crednetials! Pretty rad. Being able to find and handle all of these fields is incredible! This narrative is going to be pretty long so that we can see if you can handle long blocks of text too. This should probably be truncated off by now or something.',
            },
        },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2022-12-15T01:40:50.798Z',
        proofPurpose: 'assertionMethod',
        verificationMethod:
            'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo#z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        proofValue:
            'z5R86gecRsBh1xmPJqdfqoNppxy4hbMZWtjZZNdaqGYtwBcPHNzXwAtHdqhTWQVprQn6B8xfQvqqvQo3ZjaTjt3tW',
    },
    display: { backgroundImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7' },
    attachments: [
        {
            type: 'document',
            title: 'Custom PDF title',
            url: 'https://cdn.filestackcontent.com/4LN0x2LQXSjIH3c5bfBr',
        },
        {
            type: 'link',
            title: 'Mooji',
            url: 'https://www.moojisanghavibe.org',
        },
        {
            type: 'document',
            title: 'This is a text file with a super long name that goes to two lines',
            url: 'https://cdn.filestackcontent.com/BqqfmVEbQFmRaqwvqTMA',
        },
        { type: 'photo', url: 'https://cdn.filestackcontent.com/XuMpArLAQ3qam5OdArih' },
        { type: 'video', url: 'https://www.youtube.com/watch?v=fV7mWuCdkpY' },
        { type: 'photo', url: 'https://cdn.filestackcontent.com/PNb6lViSaqGoKyRyXyyp' },
        { type: 'photo', url: 'https://images.unsplash.com/photo-1607419145932-ed1fc8c034d8' },
        {
            type: 'link',
            title: 'Metta Meditation',
            url: 'https://unveilingtiamat.com/wp-content/uploads/2022/02/Radiant-Threefold-Path-Lovingkindness-Meditation-1.pdf?vgo_ee=KR53S3mb9fY4az4OUTbOR0zkASpiHornD%2Fz2wZTd1jg%3D&fbclid=IwAR1yXamIvuEs-PEJeXvbZp20NvlyvC2SQ-5QLATCepopuqIypO6Pfeb_6iM',
        },
        {
            type: 'video',
            title: 'Herbie Highlights 2022',
            url: 'https://www.youtube.com/watch?v=8Mt4YAileOo',
        },
        {
            type: 'video',
            title: 'Ram Dass - Be Here Now',
            url: 'https://vimeo.com/406283337',
        },
    ],
    skills: [
        {
            category: 'digital',
            skill: 'softwareProficiency',
            subskills: ['productivitySuites', 'specializedSoftware', 'designSoftware'],
        },
        {
            category: 'stem',
            skill: 'technology',
            subskills: ['coding', 'softwareDevelopment', 'dataAnalysis'],
        },
    ],
};

export const BoostCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        {
            type: '@type',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            BoostCredential: {
                '@context': {
                    attachments: {
                        '@container': '@set',
                        '@context': {
                            title: {
                                '@id': 'https://www.example.org/attachmentTitle',
                                '@type': 'xsd:string',
                            },
                            type: {
                                '@id': 'https://www.example.org/attachmentType',
                                '@type': 'xsd:string',
                            },
                            url: {
                                '@id': 'https://www.example.org/attachmentUrl',
                                '@type': 'xsd:string',
                            },
                        },
                        '@id': 'https://www.example.org/boost-attachments',
                    },
                    display: {
                        '@context': {
                            backgroundColor: {
                                '@id': 'https://www.example.org/backgroundColor',
                                '@type': 'xsd:string',
                            },
                            backgroundImage: {
                                '@id': 'https://www.example.org/backgroundImage',
                                '@type': 'xsd:string',
                            },
                        },
                        '@id': 'https://www.example.org/boost-display',
                    },
                    image: {
                        '@id': 'https://www.example.org/boost-image',
                        '@type': 'xsd:string',
                    },
                },
                '@id': 'https://www.example.org/boost-credential',
            },
        },
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    credentialSubject: {
        id: 'did:web:network.learncard.com:users:donny',
        type: ['AchievementSubject'],
        achievement: {
            achievementType: 'Achievement',
            criteria: {
                narrative: 'test criteria',
            },
            description: 'test description',
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            image: 'https://cdn.filestackcontent.com/WfRYzfG3S4SAhAkRRv8a',
            name: 'test achievement vc',
            type: ['Achievement'],
        },
    },
    issuer: 'did:web:network.learncard.com:users:donny',
    issuanceDate: '2023-02-14T19:29:49.790Z',
    proof: {
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z4A7jdUKhfHzA8LwRVR6XGbMxiRMLo5fBAcGiC7LZe1DcnVVMVL3dmhrWmDrrfsquycqcXmfTephheEpw33UTEqnL',
        verificationMethod: 'did:web:network.learncard.com:users:donny#owner',
        created: '2023-02-14T19:29:50.805Z',
    },
    expirationDate: '2023-02-28T19:24:00Z',
    image: 'https://cdn.filestackcontent.com/WfRYzfG3S4SAhAkRRv8a',
    display: {
        backgroundColor: '#4e4e',
        backgroundImage: 'https://cdn.filestackcontent.com/wYXbETSCSOSThnZOFJLQ',
        displayType: 'certificate',
    },
    name: 'test achievement vc',
    skills: [
        {
            category: 'digital',
            skill: 'softwareProficiency',
            subskills: ['productivitySuites', 'specializedSoftware', 'designSoftware'],
        },
        {
            category: 'stem',
            skill: 'technology',
            subskills: ['coding', 'softwareDevelopment', 'dataAnalysis'],
        },
    ],
};

// VC 2.0 Credentials using validFrom instead of issuanceDate
export const VC2CredentialWithValidFrom = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
        type: 'Profile',
        id: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        name: 'Modern Skills Institute',
        url: 'https://www.modernskills.org/',
        image: 'https://example.com/logo.png',
    },
    validFrom: '2024-01-15T14:30:00.000Z',
    validUntil: '2025-01-15T14:30:00.000Z',
    credentialSubject: {
        type: 'AchievementSubject',
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        achievement: {
            type: 'Achievement',
            name: 'Advanced TypeScript Development',
            description: 'Demonstrates mastery of advanced TypeScript concepts and patterns',
            criteria: {
                type: 'Criteria',
                narrative:
                    'Successfully completed advanced TypeScript certification with practical projects.',
            },
            image: 'https://example.com/typescript-badge.png',
        },
    },
};

export const VC2CredentialNoDate = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: {
        type: 'Profile',
        id: 'did:key:z6MksNj6FwQ7t7ejgJVXCNyaX655uHJ8mPJ8xLtxrqQDV2Bo',
        name: 'Future Learning Academy',
        url: 'https://www.futurelearning.edu/',
        image: 'https://example.com/academy-logo.png',
    },
    // No validFrom or issuanceDate - should handle gracefully
    credentialSubject: {
        type: 'AchievementSubject',
        id: 'did:key:z6Mkqk4j3VnaRf4XHEoU6eT343VTfdfZG23CK6zaf5g5KKju',
        achievement: {
            type: 'Achievement',
            name: 'Lifetime Learning Award',
            description: 'Recognition for continuous professional development',
            criteria: {
                type: 'Criteria',
                narrative: 'Demonstrated commitment to lifelong learning and growth.',
            },
            image: 'https://example.com/lifetime-badge.png',
        },
    },
};

export const TestVerificationItems = {
    // Real verification items returned by validation
    SUCCESS: {
        NO_EXPIRATION: {
            status: 'Success',
            check: 'expiration',
            message: 'Valid • Does Not Expire',
        },
        PROOF: {
            status: 'Success',
            check: 'proof',
            message: 'Valid',
        },
        NOT_EXPIRED: {
            status: 'Success',
            check: 'expiration',
            message: 'Valid • Expires 28 FEB 2023',
        },
    },
    FAILED: {
        // expirationDate in the past
        EXPIRED: {
            status: 'Failed',
            check: 'expiration',
            details: 'Invalid • Expired 28 JAN 2023',
        },
        // missing proof object or verificationMethod has bad data
        APPLICABLE_PROOF: {
            status: 'Failed',
            check: 'No applicable proof',
            details: 'No applicable proof',
        },
        // invalid proofValue or created
        SIGNATURE: {
            status: 'Failed',
            check: 'signature',
            details: 'signature error: Verification equation was not satisfied',
        },
        // invalid proof.type
        PROOF_TYPE: {
            status: 'Failed',
            check: 'Linked Data Proof type not implemented',
            details: 'Linked Data Proof type not implemented',
        },
        // invalid context url(s)
        CONTEXT: {
            status: 'Failed',
            check: 'loading remote context failed',
            details: 'loading remote context failed',
        },
    },

    // If you need to fudge a verification item, put it here
    TEST: {
        ISSUED_TO: {
            check: 'proof',
            status: VerificationStatusEnum.Success,
            message: 'Issued to Example Person',
        },
        ISSUED_BY: {
            check: 'proof',
            status: VerificationStatusEnum.Error,
            message: 'Issued by Some Random Did',
        },
        EXPIRED: {
            check: 'proof',
            status: VerificationStatusEnum.Failed,
            message: 'Invalid • Expired on 17 Nov 2022',
        },
        ACTIVE: {
            check: 'proof',
            status: VerificationStatusEnum.Success,
            message: 'Status: Active',
        },
    },
};

export const issueeOverride = {
    name: 'Test Person',
    image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/A2tGEP67TWeC59SmR4vP',
};

export const superSkillsIssueeOverride = {
    name: 'Caped Crusader',
    image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/fqOymtprRYILmseudPyG',
};

export const issuerOverride = {
    name: 'Dilbert Charles',
    image: 'https://cdn.filestackcontent.com/rotate=deg:exif/auto_image/pQgXEF77R0GJKdQBdClb',
};

export const simpleConvertTagsToSkills = (tags: string[]) => {
    let lastSkill: string;
    const skillsObj: Record<string, string[]> = {};

    tags.forEach(tag => {
        const isSubskill = tag.includes('Subskill');

        if (!isSubskill) {
            skillsObj[tag] = [];
            lastSkill = tag;
        } else {
            skillsObj[lastSkill].push(tag);
        }
    });

    return skillsObj;
};

export const superSkillsConvertTags = (tags: string[]) => {
    const SKILL = {
        CREATIVE: 'Creative',
        EMOTIONAL: 'Emotional',
        SOCIAL: 'Social',
        COGNITIVE: 'Cognitive',
        PHYSICAL: 'Physical',
    };
    const SKILL_SUBTYPE = {
        Creative: [
            'Creative Process',
            'Generate Diverse Ideas',
            'Evaluate and Improve',
            'Generate Original Ideas',
            'Recognize and Transfer',
        ],
        Emotional: ['Emotional Subskill 1', 'Emotional Subskill 2', 'Emotional Subskill 3'],
        Social: ['Social Subskill 1', 'Social Subskill 2', 'Social Subskill 3'],
        Cognitive: ['Cognitive Subskill 1', 'Cognitive Subskill 2', 'Cognitive Subskill 3'],
        Physical: ['Physical Subskill 1', 'Physical Subskill 2', 'Physical Subskill 3'],
    };
    const isSkill = (maybeSkill: string) => {
        return Object.values(SKILL).includes(maybeSkill);
    };

    const skillsToSubskills: Record<string, string[]> = {};
    tags.forEach(tag => {
        if (isSkill(tag)) {
            const subskillOptions = SKILL_SUBTYPE[tag as keyof typeof SKILL_SUBTYPE];
            skillsToSubskills[tag] = tags.filter(t => subskillOptions.includes(t));
        }
    });

    return skillsToSubskills;
};

export const ShortFieldsCredential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        {
            type: '@type',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            BoostCredential: {
                '@context': {
                    attachments: {
                        '@container': '@set',
                        '@context': {
                            title: {
                                '@id': 'https://www.example.org/attachmentTitle',
                                '@type': 'xsd:string',
                            },
                            type: {
                                '@id': 'https://www.example.org/attachmentType',
                                '@type': 'xsd:string',
                            },
                            url: {
                                '@id': 'https://www.example.org/attachmentUrl',
                                '@type': 'xsd:string',
                            },
                        },
                        '@id': 'https://www.example.org/boost-attachments',
                    },
                    display: {
                        '@context': {
                            backgroundColor: {
                                '@id': 'https://www.example.org/backgroundColor',
                                '@type': 'xsd:string',
                            },
                            backgroundImage: {
                                '@id': 'https://www.example.org/backgroundImage',
                                '@type': 'xsd:string',
                            },
                        },
                        '@id': 'https://www.example.org/boost-display',
                    },
                    image: {
                        '@id': 'https://www.example.org/boost-image',
                        '@type': 'xsd:string',
                    },
                },
                '@id': 'https://www.example.org/boost-credential',
            },
        },
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    credentialSubject: {
        id: 'me',
        type: ['AchievementSubject'],
        achievement: {
            achievementType: 'Achievement',
            criteria: {
                narrative: 'test criteria',
            },
            description: 'test description',
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            image: 'https://cdn.filestackcontent.com/WfRYzfG3S4SAhAkRRv8a',
            name: 'Short',
            type: ['Achievement'],
        },
    },
    issuer: 'you',
    issuanceDate: '2023-02-14T19:29:49.790Z',
    proof: {
        '@context': ['https://w3id.org/security/suites/ed25519-2020/v1'],
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        proofValue:
            'z4A7jdUKhfHzA8LwRVR6XGbMxiRMLo5fBAcGiC7LZe1DcnVVMVL3dmhrWmDrrfsquycqcXmfTephheEpw33UTEqnL',
        verificationMethod: 'did:web:network.learncard.com:users:donny#owner',
        created: '2023-02-14T19:29:50.805Z',
    },
    expirationDate: '2023-02-28T19:24:00Z',
    image: 'https://cdn.filestackcontent.com/WfRYzfG3S4SAhAkRRv8a',
    display: {
        backgroundColor: '#4e4e',
        backgroundImage: 'https://cdn.filestackcontent.com/wYXbETSCSOSThnZOFJLQ',
        displayType: 'certificate',
    },
    name: 'test achievement vc',
    skills: [
        {
            category: 'digital',
            skill: 'softwareProficiency',
            subskills: ['productivitySuites', 'specializedSoftware', 'designSoftware'],
        },
        {
            category: 'stem',
            skill: 'technology',
            subskills: ['coding', 'softwareDevelopment', 'dataAnalysis'],
        },
    ],
};
