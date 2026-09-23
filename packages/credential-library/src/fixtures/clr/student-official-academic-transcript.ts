import { UnsignedClrCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

export const clrStudentOfficialAcademicTranscript: CredentialFixture = {
    id: 'clr/student-official-academic-transcript',
    name: 'Student Persona — Official Academic Transcript — Redwood Valley University',
    description:
        'A standards-pure CLR 2.0 academic transcript with coursework, competency assessments, and degree conferral.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['alignment', 'associations', 'nested-credentials', 'results', 'evidence', 'image'],
    source: 'real-world',
    signed: false,
    validity: 'valid',
    validator: UnsignedClrCredentialValidator,
    tags: ['student-persona', 'transcript'],
    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        'type': ['VerifiableCredential', 'ClrCredential'],
        'issuer': {
            'id': 'did:web:network.learncard.com:users:redwoodvalley2',
        },
        'credentialSubject': {
            'id': 'did:example:student',
            'achievement': [
                {
                    'achievementType': 'BachelorDegree',
                    'alignment': [
                        {
                            'targetCode': 'CRE1:',
                            'targetDescription':
                                "Creativity involves generating possibilities, both on one's own and by seeking inspiration from other places.",
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Generating and seeking new ideas',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/48cb2b16-a4c0-11e9-87d9-ad8e21dd46c0',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRE2:',
                            'targetDescription':
                                'Creating new ideas involves judgment calls about design decisions, which must come from an internal, embodied sense of vision. To be creative it is important to know how to listen to that inner voice.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Developing personal tastes and aesthetics',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/5bfb48c4-a4c0-11e9-8908-4714faa15015',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'COM5:',
                            'targetDescription':
                                'The first step of communication is often said to be "know your audience". People can only understand things from their own point of view, and trying to explain something outside of their existing point of view involves understanding where it could fit in to their existing understanding of the world. Often, the arguments that convinced one person of a certain position are not convincing to another person, and to convince them one has to consider the other person\'s values and knowledge, and really put themselves in their position for long enough to understand them.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName':
                                'Empathizing with audiences and adapting messages accordingly',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/bc92dafc-a4c1-11e9-b3e1-3fe12c369e25',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRE5:',
                            'targetDescription':
                                'This is part of the "grunt work" stage of actually making something happen. Narrowing creative ideas based on limitations of the real world is a necessary step in bringing an idea into reality, and thus, in creating something.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Realizing ideas while recognizing constraints',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/7f8c7894-a4c0-11e9-adba-15e574eee370',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'COM1:',
                            'targetDescription':
                                "Communicating is a two way street, so one must be aware of their audience, and must engage them to be effective. Asking good questions is a craft that can be honed, and actively listening involves getting outside of one's head to truly interact with others.",
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Asking questions and actively listening',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/6075c2f2-a4c1-11e9-bb96-f15824fca9b6',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRI3:',
                            'targetDescription':
                                'Critical thinking involves decision-making and judgement calls supported by sound reasoning. This can look like formal logical reasoning, or more informal assessment of the alignment of a string of ideas, or gaps in their arrangement.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Applying sound reasoning to decision-making',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/220d845a-a4c1-11e9-8d23-33a4cde586ee',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRI2:',
                            'targetDescription':
                                'It is tempting for us as humans to stick to one way of thinking and even to become defensive about it. Effective critical thinking, however, involves the careful consideration from a variety of perspectives, in order to make sure one is being thorough and balanced.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Considering other points of view',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/15911048-a4c1-11e9-9861-f5077fdc425e',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRE4:',
                            'targetDescription':
                                'Creativity involves moving ideas from one context to another in novel ways. To combine and recombine information meaningfully, it is necessary to organize and refine it.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName':
                                'Connecting, reorganizing, and refining ideas into a cohesive whole',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/729be7aa-a4c0-11e9-962e-d77a7b59d196',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'COM4:',
                            'targetDescription':
                                "We have moved from oral communication, to written communication, to now all kinds of different media that we use to communicate. Each medium brings with it its own strengths and constraints, and abilities in one don't always automatically apply to abilities in another.",
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName':
                                'Communicating via multiple modes (digitally, orally, etc.)',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/ae9dfb16-a4c1-11e9-b48d-5f0922e85bbd',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRE6:',
                            'targetDescription':
                                'Reflection can yield new insights about what artistic choices worked well, and how to improve in the future. This is the intersection of creativity and metacognition.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Reflecting on processes and outcomes',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/8bd5db40-a4c0-11e9-98aa-e186e24fa415',
                            'type': ['Alignment'],
                        },
                        {
                            'targetCode': 'CRI4:',
                            'targetDescription':
                                'It is necessary to evaluate the merit and validity of other (e.g. online) sources and arguments in order to determine what information is worth paying attention to.',
                            'targetFramework':
                                'Center for Curriculum Redesign Competency Framework',
                            'targetName': 'Assessing validity and quality of information',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://opensalt.net/uri/3147b76a-a4c1-11e9-865b-09e6f38450c5',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://redwoodvalley.edu/departments/interactive-media-design',
                        'name': 'Department of Interactive Media Design',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'narrative':
                            'The Bachelor of Arts in Interactive Media Design prepares graduates to research, design, prototype, and deliver human-centered interactive experiences across web, mobile, and immersive platforms.',
                    },
                    'description':
                        'The Bachelor of Arts in Interactive Media Design prepares graduates to research, design, prototype, and deliver human-centered interactive experiences across web, mobile, and immersive platforms.',
                    'fieldOfStudy': 'Interactive Media Design',
                    'humanCode': 'BA-IMD',
                    'id': 'https://redwoodvalley.edu/programs/ba-interactive-media-design',
                    'inLanguage': 'en',
                    'name': 'Bachelor of Arts in Interactive Media Design',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:63c7d349-34b8-4e67-8eea-b3ea75a962e9',
                            'name': 'Cumulative GPA',
                            'resultType': 'GradePointAverage',
                            'type': ['ResultDescription'],
                            'valueMax': '4.0',
                            'valueMin': '0.0',
                        },
                        {
                            'id': 'urn:uuid:e90f7edb-d55c-4533-939f-f4e8b06d5a4c',
                            'name': 'Total Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '120',
                            'valueMin': '0',
                        },
                    ],
                    'tag': ['degree', 'undergraduate', 'interactive-media-design'],
                    'type': ['Achievement'],
                },
            ],
            'association': [
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:6f85bb40-77d4-4b2a-9a0b-8b0f53ff7a56',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:7ee8b736-04ce-4725-9efd-6220cfa203dc',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:0c7b2a62-3918-40d5-8376-115fe26587f7',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:3739ff93-2b14-4466-9346-58396b02d73b',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:c1d4f379-002f-4255-ad08-58b93a298355',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:b5afb6f3-9d01-42a2-90cf-083f1343c981',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:d0463369-f7e2-45cb-9a40-2cbc43cdf21b',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:ae4c535c-b368-4887-978f-bd6a3a56d892',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:d63e151c-7f38-4ca1-a3bb-fc9afd31b978',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:92c50a60-b1c4-4f64-8fe3-7ad3fb81cc54',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:1a82d064-0798-4e20-ab71-74e2cde7f3a0',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:2e116422-3f04-4acc-88e7-67302ab4641f',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:bccfc05e-ebcc-402f-a358-a884f48b02a8',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:d2f362c3-1efc-46e2-8474-86735b9d48e6',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:7c164ab1-abd3-4bed-a5c5-695f21a4fdae',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:20329522-bd83-4551-9784-346585f97633',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:58653016-f31e-4e99-a6ee-e1355841b4c4',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:e3fd39b8-f8b2-49f1-8832-e66bef1109bc',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:2d3e3e9c-6628-468b-871e-c74af3e9dfae',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:13e6039e-803c-4ebe-b344-140d3bb0fcf5',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:03d371ed-3a3a-474b-a892-d0d249af2fc1',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:4c27ed13-4310-49e8-905c-10b2d5b8a4ba',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:92d31138-7d14-4056-aa7d-845b9d292fee',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:a2f1d54c-e65b-4107-95b3-46678e6a3984',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:5acfef7e-1238-4a58-b065-b937f3335f10',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:2b694c87-dc52-4281-bf2e-0c4114fb6b4e',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:b56a02b6-2044-4dd7-85e8-ab4f4e07067d',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:d296d303-4a5e-4fc1-864a-05498797d5da',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:a1b591ae-0be9-46ed-9823-e30eba796c01',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isChildOf',
                    'sourceId': 'urn:uuid:b6906897-60db-4169-a24b-546b02f92a6f',
                    'targetId': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:6f85bb40-77d4-4b2a-9a0b-8b0f53ff7a56',
                    'targetId': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'targetId': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'targetId': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'targetId': 'urn:uuid:5acfef7e-1238-4a58-b065-b937f3335f10',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:d63e151c-7f38-4ca1-a3bb-fc9afd31b978',
                    'targetId': 'urn:uuid:20329522-bd83-4551-9784-346585f97633',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:d0463369-f7e2-45cb-9a40-2cbc43cdf21b',
                    'targetId': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:2e116422-3f04-4acc-88e7-67302ab4641f',
                    'targetId': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:bccfc05e-ebcc-402f-a358-a884f48b02a8',
                    'targetId': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:7ee8b736-04ce-4725-9efd-6220cfa203dc',
                    'targetId': 'urn:uuid:c1d4f379-002f-4255-ad08-58b93a298355',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:c1d4f379-002f-4255-ad08-58b93a298355',
                    'targetId': 'urn:uuid:58653016-f31e-4e99-a6ee-e1355841b4c4',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:0c7b2a62-3918-40d5-8376-115fe26587f7',
                    'targetId': 'urn:uuid:d63e151c-7f38-4ca1-a3bb-fc9afd31b978',
                    'type': ['Association'],
                },
                {
                    'associationType': 'precedes',
                    'sourceId': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'targetId': 'urn:uuid:a2f1d54c-e65b-4107-95b3-46678e6a3984',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:d296d303-4a5e-4fc1-864a-05498797d5da',
                    'targetId': 'urn:uuid:d0463369-f7e2-45cb-9a40-2cbc43cdf21b',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:d296d303-4a5e-4fc1-864a-05498797d5da',
                    'targetId': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:d296d303-4a5e-4fc1-864a-05498797d5da',
                    'targetId': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'targetId': 'urn:uuid:7ee8b736-04ce-4725-9efd-6220cfa203dc',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'targetId': 'urn:uuid:c1d4f379-002f-4255-ad08-58b93a298355',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'targetId': 'urn:uuid:b5afb6f3-9d01-42a2-90cf-083f1343c981',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'targetId': 'urn:uuid:13e6039e-803c-4ebe-b344-140d3bb0fcf5',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:a1b591ae-0be9-46ed-9823-e30eba796c01',
                    'targetId': 'urn:uuid:2e116422-3f04-4acc-88e7-67302ab4641f',
                    'type': ['Association'],
                },
                {
                    'associationType': 'isRelatedTo',
                    'sourceId': 'urn:uuid:a1b591ae-0be9-46ed-9823-e30eba796c01',
                    'targetId': 'urn:uuid:bccfc05e-ebcc-402f-a358-a884f48b02a8',
                    'type': ['Association'],
                },
            ],
            'identifier': [
                {
                    'hashed': false,
                    'identityHash': 'Olivia Trujillo',
                    'identityType': 'name',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': 'o.trujillo@redwoodvalley.edu',
                    'identityType': 'emailAddress',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': '20210114',
                    'identityType': 'studentId',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': '2003-07-22',
                    'identityType': 'dateOfBirth',
                    'type': 'IdentityObject',
                },
            ],
            'type': ['ClrSubject'],
            'verifiableCredential': [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRE1:',
                                    'targetDescription':
                                        "Creativity involves generating possibilities, both on one's own and by seeking inspiration from other places.",
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Generating and seeking new ideas',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/48cb2b16-a4c0-11e9-87d9-ad8e21dd46c0',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd101',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Survey of interactive media: history, formats, tools, and the design process across web, mobile, and immersive platforms.',
                            },
                            'description':
                                'Survey of interactive media: history, formats, tools, and the design process across web, mobile, and immersive platforms.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 101',
                            'id': 'https://redwoodvalley.edu/courses/imd101',
                            'inLanguage': 'en',
                            'name': 'Introduction to Interactive Media',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['foundation', 'media', 'design'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2021',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:6f85bb40-77d4-4b2a-9a0b-8b0f53ff7a56',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 101 — Introduction to Interactive Media',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2021-12-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/art110',
                                'name': 'Department of Art & Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Principles of composition, hierarchy, balance, and gestalt applied to two-dimensional visual design.',
                            },
                            'description':
                                'Principles of composition, hierarchy, balance, and gestalt applied to two-dimensional visual design.',
                            'fieldOfStudy': 'Art & Design',
                            'humanCode': 'ART 110',
                            'id': 'https://redwoodvalley.edu/courses/art110',
                            'inLanguage': 'en',
                            'name': 'Foundations of Visual Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['visual', 'composition', 'foundation'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Fall 2021',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:7ee8b736-04ce-4725-9efd-6220cfa203dc',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'ART 110 — Foundations of Visual Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2021-12-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/cs105',
                                'name': 'Department of Computer Science',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Programming fundamentals through generative and interactive sketches using JavaScript and p5.js.',
                            },
                            'description':
                                'Programming fundamentals through generative and interactive sketches using JavaScript and p5.js.',
                            'fieldOfStudy': 'Computer Science',
                            'humanCode': 'CS 105',
                            'id': 'https://redwoodvalley.edu/courses/cs105',
                            'inLanguage': 'en',
                            'name': 'Creative Coding',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['coding', 'javascript', 'creative'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Fall 2021',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:0c7b2a62-3918-40d5-8376-115fe26587f7',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'CS 105 — Creative Coding',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2021-12-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/eng101',
                                'name': 'Department of English',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'College-level writing, argumentation, and rhetorical analysis across genres.',
                            },
                            'description':
                                'College-level writing, argumentation, and rhetorical analysis across genres.',
                            'fieldOfStudy': 'English',
                            'humanCode': 'ENG 101',
                            'id': 'https://redwoodvalley.edu/courses/eng101',
                            'inLanguage': 'en',
                            'name': 'Composition and Rhetoric',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['writing', 'rhetoric', 'foundation'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2021',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:3739ff93-2b14-4466-9346-58396b02d73b',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'ENG 101 — Composition and Rhetoric',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2021-12-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRE2:',
                                    'targetDescription':
                                        'Creating new ideas involves judgment calls about design decisions, which must come from an internal, embodied sense of vision. To be creative it is important to know how to listen to that inner voice.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Developing personal tastes and aesthetics',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/5bfb48c4-a4c0-11e9-8908-4714faa15015',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd120',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Typographic systems, grids, and layout for screen-based media.',
                            },
                            'description':
                                'Typographic systems, grids, and layout for screen-based media.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 120',
                            'id': 'https://redwoodvalley.edu/courses/imd120',
                            'inLanguage': 'en',
                            'name': 'Typography and Layout',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['typography', 'layout', 'design'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:c1d4f379-002f-4255-ad08-58b93a298355',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 120 — Typography and Layout',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-05-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd130',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Raster and vector image creation and editing for digital products.',
                            },
                            'description':
                                'Raster and vector image creation and editing for digital products.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 130',
                            'id': 'https://redwoodvalley.edu/courses/imd130',
                            'inLanguage': 'en',
                            'name': 'Digital Imaging',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['imaging', 'raster', 'vector'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Spring 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:b5afb6f3-9d01-42a2-90cf-083f1343c981',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 130 — Digital Imaging',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-05-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'COM5:',
                                    'targetDescription':
                                        'The first step of communication is often said to be "know your audience". People can only understand things from their own point of view, and trying to explain something outside of their existing point of view involves understanding where it could fit in to their existing understanding of the world. Often, the arguments that convinced one person of a certain position are not convincing to another person, and to convince them one has to consider the other person\'s values and knowledge, and really put themselves in their position for long enough to understand them.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName':
                                        'Empathizing with audiences and adapting messages accordingly',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/bc92dafc-a4c1-11e9-b3e1-3fe12c369e25',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/hci150',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Core HCI concepts: mental models, affordances, usability heuristics, and interaction paradigms.',
                            },
                            'description':
                                'Core HCI concepts: mental models, affordances, usability heuristics, and interaction paradigms.',
                            'fieldOfStudy': 'Human-Computer Interaction',
                            'humanCode': 'HCI 150',
                            'id': 'https://redwoodvalley.edu/courses/hci150',
                            'inLanguage': 'en',
                            'name': 'Introduction to Human-Computer Interaction',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['hci', 'usability', 'foundation'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:d0463369-f7e2-45cb-9a40-2cbc43cdf21b',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'HCI 150 — Introduction to Human-Computer Interaction',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-05-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/art140',
                                'name': 'Department of Art & Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Color systems, harmony, contrast, and accessibility considerations in digital design.',
                            },
                            'description':
                                'Color systems, harmony, contrast, and accessibility considerations in digital design.',
                            'fieldOfStudy': 'Art & Design',
                            'humanCode': 'ART 140',
                            'id': 'https://redwoodvalley.edu/courses/art140',
                            'inLanguage': 'en',
                            'name': 'Color Theory',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['color', 'theory', 'accessibility'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Spring 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:ae4c535c-b368-4887-978f-bd6a3a56d892',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'ART 140 — Color Theory',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-05-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRE5:',
                                    'targetDescription':
                                        'This is part of the "grunt work" stage of actually making something happen. Narrowing creative ideas based on limitations of the real world is a necessary step in bringing an idea into reality, and thus, in creating something.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Realizing ideas while recognizing constraints',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/7f8c7894-a4c0-11e9-adba-15e574eee370',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd201',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Designing interactive behaviors, states, and flows; from user goals to interface patterns.',
                            },
                            'description':
                                'Designing interactive behaviors, states, and flows; from user goals to interface patterns.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 201',
                            'id': 'https://redwoodvalley.edu/courses/imd201',
                            'inLanguage': 'en',
                            'name': 'Interaction Design Fundamentals',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['interaction', 'patterns', 'ux'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:6be1ad87-6a71-4fa1-96d2-38c5e86fd138',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 201 — Interaction Design Fundamentals',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-12-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd210',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Semantic HTML, responsive CSS, and progressive enhancement for accessible web experiences.',
                            },
                            'description':
                                'Semantic HTML, responsive CSS, and progressive enhancement for accessible web experiences.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 210',
                            'id': 'https://redwoodvalley.edu/courses/imd210',
                            'inLanguage': 'en',
                            'name': 'Web Design and Development',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['web', 'html', 'css'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Fall 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:d63e151c-7f38-4ca1-a3bb-fc9afd31b978',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 210 — Web Design and Development',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-12-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/mot220',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Principles of animation and timing applied to motion graphics and interface transitions.',
                            },
                            'description':
                                'Principles of animation and timing applied to motion graphics and interface transitions.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'MOT 220',
                            'id': 'https://redwoodvalley.edu/courses/mot220',
                            'inLanguage': 'en',
                            'name': 'Motion Graphics',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['motion', 'animation', 'aftereffects'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:92c50a60-b1c4-4f64-8fe3-7ad3fb81cc54',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'MOT 220 — Motion Graphics',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-12-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/psy201',
                                'name': 'Department of Psychology',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Perception, attention, memory, and decision-making relevant to interface design.',
                            },
                            'description':
                                'Perception, attention, memory, and decision-making relevant to interface design.',
                            'fieldOfStudy': 'Psychology',
                            'humanCode': 'PSY 201',
                            'id': 'https://redwoodvalley.edu/courses/psy201',
                            'inLanguage': 'en',
                            'name': 'Cognitive Psychology',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['cognition', 'perception', 'psychology'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Fall 2022',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:1a82d064-0798-4e20-ab71-74e2cde7f3a0',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'PSY 201 — Cognitive Psychology',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2022-12-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'COM1:',
                                    'targetDescription':
                                        "Communicating is a two way street, so one must be aware of their audience, and must engage them to be effective. Asking good questions is a craft that can be honed, and actively listening involves getting outside of one's head to truly interact with others.",
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Asking questions and actively listening',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/6075c2f2-a4c1-11e9-bb96-f15824fca9b6',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd220',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Qualitative and quantitative UX research: interviews, surveys, usability testing, and synthesis.',
                            },
                            'description':
                                'Qualitative and quantitative UX research: interviews, surveys, usability testing, and synthesis.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 220',
                            'id': 'https://redwoodvalley.edu/courses/imd220',
                            'inLanguage': 'en',
                            'name': 'User Experience Research',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['research', 'ux', 'usability'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:2e116422-3f04-4acc-88e7-67302ab4641f',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 220 — User Experience Research',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-05-12T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd230',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Low- to high-fidelity prototyping with Figma; interactive wireframes and design handoff.',
                            },
                            'description':
                                'Low- to high-fidelity prototyping with Figma; interactive wireframes and design handoff.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 230',
                            'id': 'https://redwoodvalley.edu/courses/imd230',
                            'inLanguage': 'en',
                            'name': 'Prototyping and Wireframing',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['prototyping', 'figma', 'wireframe'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:bccfc05e-ebcc-402f-a358-a884f48b02a8',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 230 — Prototyping and Wireframing',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-05-12T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/game240',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Mechanics, dynamics, and aesthetics; systems thinking and playtesting.',
                            },
                            'description':
                                'Mechanics, dynamics, and aesthetics; systems thinking and playtesting.',
                            'fieldOfStudy': 'Game Design',
                            'humanCode': 'GAME 240',
                            'id': 'https://redwoodvalley.edu/courses/game240',
                            'inLanguage': 'en',
                            'name': 'Game Design Principles',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['game', 'systems', 'playtesting'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Spring 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:d2f362c3-1efc-46e2-8474-86735b9d48e6',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'GAME 240 — Game Design Principles',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-05-12T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/comm210',
                                'name': 'Department of Communications',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Critical study of media systems, audiences, and cultural context of interactive experiences.',
                            },
                            'description':
                                'Critical study of media systems, audiences, and cultural context of interactive experiences.',
                            'fieldOfStudy': 'Communications',
                            'humanCode': 'COMM 210',
                            'id': 'https://redwoodvalley.edu/courses/comm210',
                            'inLanguage': 'en',
                            'name': 'Media Theory and Culture',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['theory', 'media', 'culture'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Spring 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:7c164ab1-abd3-4bed-a5c5-695f21a4fdae',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'COMM 210 — Media Theory and Culture',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-05-12T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRI3:',
                                    'targetDescription':
                                        'Critical thinking involves decision-making and judgement calls supported by sound reasoning. This can look like formal logical reasoning, or more informal assessment of the alignment of a string of ideas, or gaps in their arrangement.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Applying sound reasoning to decision-making',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/220d845a-a4c1-11e9-8d23-33a4cde586ee',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd301',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Complex interaction systems, micro-interactions, and cross-device design patterns.',
                            },
                            'description':
                                'Complex interaction systems, micro-interactions, and cross-device design patterns.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 301',
                            'id': 'https://redwoodvalley.edu/courses/imd301',
                            'inLanguage': 'en',
                            'name': 'Advanced Interaction Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['interaction', 'advanced', 'patterns'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:cdcf6697-2f17-48ce-b4f8-159462858840',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 301 — Advanced Interaction Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-12-15T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd310',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Component-based front-end development with modern JavaScript frameworks and accessible patterns.',
                            },
                            'description':
                                'Component-based front-end development with modern JavaScript frameworks and accessible patterns.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 310',
                            'id': 'https://redwoodvalley.edu/courses/imd310',
                            'inLanguage': 'en',
                            'name': 'Front-End Development',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['frontend', 'react', 'javascript'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Fall 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:20329522-bd83-4551-9784-346585f97633',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 310 — Front-End Development',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-12-15T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd320',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Structuring content and navigation: taxonomies, card sorting, and findability.',
                            },
                            'description':
                                'Structuring content and navigation: taxonomies, card sorting, and findability.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 320',
                            'id': 'https://redwoodvalley.edu/courses/imd320',
                            'inLanguage': 'en',
                            'name': 'Information Architecture',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['ia', 'navigation', 'taxonomy'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:58653016-f31e-4e99-a6ee-e1355841b4c4',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 320 — Information Architecture',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-12-15T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/art330',
                                'name': 'Department of Art & Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Fundamentals of 3D modeling, texturing, and animation for interactive scenes.',
                            },
                            'description':
                                'Fundamentals of 3D modeling, texturing, and animation for interactive scenes.',
                            'fieldOfStudy': 'Art & Design',
                            'humanCode': 'ART 330',
                            'id': 'https://redwoodvalley.edu/courses/art330',
                            'inLanguage': 'en',
                            'name': '3D Modeling and Animation',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['3d', 'blender', 'animation'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Fall 2023',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:e3fd39b8-f8b2-49f1-8832-e66bef1109bc',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'ART 330 — 3D Modeling and Animation',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2023-12-15T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRI2:',
                                    'targetDescription':
                                        'It is tempting for us as humans to stick to one way of thinking and even to become defensive about it. Effective critical thinking, however, involves the careful consideration from a variety of perspectives, in order to make sure one is being thorough and balanced.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Considering other points of view',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/15911048-a4c1-11e9-9861-f5077fdc425e',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd330',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'WCAG standards, assistive technologies, and inclusive design methods.',
                            },
                            'description':
                                'WCAG standards, assistive technologies, and inclusive design methods.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 330',
                            'id': 'https://redwoodvalley.edu/courses/imd330',
                            'inLanguage': 'en',
                            'name': 'Accessibility and Inclusive Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['accessibility', 'wcag', 'inclusive'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:2d3e3e9c-6628-468b-871e-c74af3e9dfae',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 330 — Accessibility and Inclusive Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-05-10T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd340',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Encoding data visually; interactive charts and narrative visualization.',
                            },
                            'description':
                                'Encoding data visually; interactive charts and narrative visualization.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 340',
                            'id': 'https://redwoodvalley.edu/courses/imd340',
                            'inLanguage': 'en',
                            'name': 'Data Visualization',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['dataviz', 'd3', 'narrative'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:13e6039e-803c-4ebe-b344-140d3bb0fcf5',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 340 — Data Visualization',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-05-10T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd350',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Audio design, sonic branding, and adaptive sound for interactive experiences.',
                            },
                            'description':
                                'Audio design, sonic branding, and adaptive sound for interactive experiences.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 350',
                            'id': 'https://redwoodvalley.edu/courses/imd350',
                            'inLanguage': 'en',
                            'name': 'Sound Design for Interactive Media',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['sound', 'audio', 'adaptive'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:03d371ed-3a3a-474b-a892-d0d249af2fc1',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 350 — Sound Design for Interactive Media',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-05-10T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/ent300',
                                'name': 'Department of Business',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Bringing design work to market: value propositions, pitching, and product strategy.',
                            },
                            'description':
                                'Bringing design work to market: value propositions, pitching, and product strategy.',
                            'fieldOfStudy': 'Business',
                            'humanCode': 'ENT 300',
                            'id': 'https://redwoodvalley.edu/courses/ent300',
                            'inLanguage': 'en',
                            'name': 'Design Entrepreneurship',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['entrepreneurship', 'strategy', 'pitch'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'B+',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:4c27ed13-4310-49e8-905c-10b2d5b8a4ba',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'ENT 300 — Design Entrepreneurship',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-05-10T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'CRE4:',
                                    'targetDescription':
                                        'Creativity involves moving ideas from one context to another in novel ways. To combine and recombine information meaningfully, it is necessary to organize and refine it.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName':
                                        'Connecting, reorganizing, and refining ideas into a cohesive whole',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/729be7aa-a4c0-11e9-962e-d77a7b59d196',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd401',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Team-based capstone: research, concepting, and prototyping of a major interactive project.',
                            },
                            'description':
                                'Team-based capstone: research, concepting, and prototyping of a major interactive project.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 401',
                            'id': 'https://redwoodvalley.edu/courses/imd401',
                            'inLanguage': 'en',
                            'name': 'Capstone Studio I',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['capstone', 'studio', 'project'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:51c12c34-315e-477c-83be-d59860281e7f',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 401 — Capstone Studio I',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd410',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Designing spatial and immersive experiences for augmented and virtual reality.',
                            },
                            'description':
                                'Designing spatial and immersive experiences for augmented and virtual reality.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 410',
                            'id': 'https://redwoodvalley.edu/courses/imd410',
                            'inLanguage': 'en',
                            'name': 'Emerging Technologies: AR/VR',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['ar', 'vr', 'immersive'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:92d31138-7d14-4056-aa7d-845b9d292fee',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 410 — Emerging Technologies: AR/VR',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd420',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Building and maintaining scalable design systems, tokens, and component libraries.',
                            },
                            'description':
                                'Building and maintaining scalable design systems, tokens, and component libraries.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 420',
                            'id': 'https://redwoodvalley.edu/courses/imd420',
                            'inLanguage': 'en',
                            'name': 'Design Systems',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['design-systems', 'tokens', 'components'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:a2f1d54c-e65b-4107-95b3-46678e6a3984',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 420 — Design Systems',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-13T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'targetCode': 'COM4:',
                                    'targetDescription':
                                        "We have moved from oral communication, to written communication, to now all kinds of different media that we use to communicate. Each medium brings with it its own strengths and constraints, and abilities in one don't always automatically apply to abilities in another.",
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName':
                                        'Communicating via multiple modes (digitally, orally, etc.)',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/ae9dfb16-a4c1-11e9-b48d-5f0922e85bbd',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd402',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Completion, testing, and public presentation of the capstone interactive project.',
                            },
                            'description':
                                'Completion, testing, and public presentation of the capstone interactive project.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 402',
                            'id': 'https://redwoodvalley.edu/courses/imd402',
                            'inLanguage': 'en',
                            'name': 'Capstone Studio II',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['capstone', 'studio', 'launch'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:5acfef7e-1238-4a58-b065-b937f3335f10',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 402 — Capstone Studio II',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd430',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Curating and presenting a professional interactive design portfolio.',
                            },
                            'description':
                                'Curating and presenting a professional interactive design portfolio.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 430',
                            'id': 'https://redwoodvalley.edu/courses/imd430',
                            'inLanguage': 'en',
                            'name': 'Portfolio Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['portfolio', 'presentation', 'career'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:2b694c87-dc52-4281-bf2e-0c4114fb6b4e',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 430 — Portfolio Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/imd440',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'Industry practice: collaboration, ethics, contracts, and client management.',
                            },
                            'description':
                                'Industry practice: collaboration, ethics, contracts, and client management.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'IMD 440',
                            'id': 'https://redwoodvalley.edu/courses/imd440',
                            'inLanguage': 'en',
                            'name': 'Professional Practice in Media Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'A+',
                                        'A',
                                        'A-',
                                        'B+',
                                        'B',
                                        'B-',
                                        'C+',
                                        'C',
                                        'C-',
                                        'D',
                                        'F',
                                    ],
                                    'id': 'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                    'name': 'Letter Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'tag': ['professional', 'ethics', 'practice'],
                            'type': ['Achievement'],
                        },
                        'creditsEarned': 3,
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:5c2f8a10-3b7e-4d21-9f4c-8a6b1e2d0c33',
                                'type': ['Result'],
                                'value': 'A-',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:b56a02b6-2044-4dd7-85e8-ab4f4e07067d',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'IMD 440 — Professional Practice in Media Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-16T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'BachelorDegree',
                            'creator': {
                                'id': 'https://redwoodvalley.edu/departments/interactive-media-design',
                                'name': 'Department of Interactive Media Design',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'narrative':
                                    'The Bachelor of Arts in Interactive Media Design prepares graduates to research, design, prototype, and deliver human-centered interactive experiences across web, mobile, and immersive platforms.',
                            },
                            'description':
                                'The Bachelor of Arts in Interactive Media Design prepares graduates to research, design, prototype, and deliver human-centered interactive experiences across web, mobile, and immersive platforms.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'humanCode': 'BA-IMD',
                            'id': 'https://redwoodvalley.edu/programs/ba-interactive-media-design',
                            'inLanguage': 'en',
                            'name': 'Bachelor of Arts in Interactive Media Design',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:63c7d349-34b8-4e67-8eea-b3ea75a962e9',
                                    'name': 'Cumulative GPA',
                                    'resultType': 'GradePointAverage',
                                    'type': ['ResultDescription'],
                                    'valueMax': '4.0',
                                    'valueMin': '0.0',
                                },
                                {
                                    'id': 'urn:uuid:e90f7edb-d55c-4533-939f-f4e8b06d5a4c',
                                    'name': 'Total Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '120',
                                    'valueMin': '0',
                                },
                            ],
                            'tag': ['degree', 'undergraduate', 'interactive-media-design'],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:63c7d349-34b8-4e67-8eea-b3ea75a962e9',
                                'type': ['Result'],
                                'value': '3.78',
                            },
                            {
                                'resultDescription':
                                    'urn:uuid:e90f7edb-d55c-4533-939f-f4e8b06d5a4c',
                                'type': ['Result'],
                                'value': '90',
                            },
                        ],
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:69f11ab0-1775-4f89-98d3-2dd78aeac603',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'Bachelor of Arts in Interactive Media Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Competency',
                            'alignment': [
                                {
                                    'targetCode': 'CRE6:',
                                    'targetDescription':
                                        'Reflection can yield new insights about what artistic choices worked well, and how to improve in the future. This is the intersection of creativity and metacognition.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Reflecting on processes and outcomes',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/8bd5db40-a4c0-11e9-98aa-e186e24fa415',
                                    'type': ['Alignment'],
                                },
                            ],
                            'criteria': {
                                'narrative':
                                    'Ability to design, prototype, and refine complex interaction systems that align with user goals across devices.',
                            },
                            'description':
                                'Ability to design, prototype, and refine complex interaction systems that align with user goals across devices.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'id': 'https://redwoodvalley.edu/competencies/interaction-design',
                            'name': 'Interaction Design',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'Developing',
                                        'Proficient',
                                        'Advanced',
                                        'Distinguished',
                                    ],
                                    'id': 'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                    'name': 'Competency Level',
                                    'resultType': 'RubricCriterionLevel',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                'type': ['Result'],
                                'value': 'Distinguished',
                            },
                        ],
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:d296d303-4a5e-4fc1-864a-05498797d5da',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'Competency — Interaction Design',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Competency',
                            'criteria': {
                                'narrative':
                                    'Ability to apply typography, color, layout, and motion to communicate clearly and build cohesive visual systems.',
                            },
                            'description':
                                'Ability to apply typography, color, layout, and motion to communicate clearly and build cohesive visual systems.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'id': 'https://redwoodvalley.edu/competencies/visual-communication',
                            'name': 'Visual Communication',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'Developing',
                                        'Proficient',
                                        'Advanced',
                                        'Distinguished',
                                    ],
                                    'id': 'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                    'name': 'Competency Level',
                                    'resultType': 'RubricCriterionLevel',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                'type': ['Result'],
                                'value': 'Distinguished',
                            },
                        ],
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:b00bd3cd-24ad-4ede-beba-50975655638f',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'Competency — Visual Communication',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Competency',
                            'alignment': [
                                {
                                    'targetCode': 'CRI4:',
                                    'targetDescription':
                                        'It is necessary to evaluate the merit and validity of other (e.g. online) sources and arguments in order to determine what information is worth paying attention to.',
                                    'targetFramework':
                                        'Center for Curriculum Redesign Competency Framework',
                                    'targetName': 'Assessing validity and quality of information',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://opensalt.net/uri/3147b76a-a4c1-11e9-865b-09e6f38450c5',
                                    'type': ['Alignment'],
                                },
                            ],
                            'criteria': {
                                'narrative':
                                    'Ability to plan and conduct UX research, synthesize insights, and translate them into design decisions.',
                            },
                            'description':
                                'Ability to plan and conduct UX research, synthesize insights, and translate them into design decisions.',
                            'fieldOfStudy': 'Interactive Media Design',
                            'id': 'https://redwoodvalley.edu/competencies/user-centered-research',
                            'name': 'User-Centered Research',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'Developing',
                                        'Proficient',
                                        'Advanced',
                                        'Distinguished',
                                    ],
                                    'id': 'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                    'name': 'Competency Level',
                                    'resultType': 'RubricCriterionLevel',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:9a1c7e42-2d6b-4f88-b1a3-6e5d4c3b2a10',
                                'type': ['Result'],
                                'value': 'Advanced',
                            },
                        ],
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:a1b591ae-0be9-46ed-9823-e30eba796c01',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'Competency — User-Centered Research',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-05-17T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Assessment',
                            'criteria': {
                                'narrative':
                                    'SAT standardized college readiness test scores submitted during undergraduate admission. Section scores on a 200–800 scale; total on a 400–1600 scale.',
                            },
                            'description':
                                'SAT standardized college readiness test scores submitted during undergraduate admission. Section scores on a 200–800 scale; total on a 400–1600 scale.',
                            'fieldOfStudy': 'Assessment',
                            'id': 'https://redwoodvalley.edu/assessments/sat-2021',
                            'name': 'SAT College Readiness Assessment',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:6663e3c6-e1d5-4d85-bfb7-59c7ba11d4cf',
                                    'name': 'Total',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '1600',
                                    'valueMin': '400',
                                },
                                {
                                    'id': 'urn:uuid:58723beb-c895-4d42-8a54-4b8a310de5ed',
                                    'name': 'Evidence-Based Reading and Writing',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '800',
                                    'valueMin': '200',
                                },
                                {
                                    'id': 'urn:uuid:6416c971-964b-4db5-b72d-6fddff3e5eb9',
                                    'name': 'Math',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '800',
                                    'valueMin': '200',
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'resultDescription':
                                    'urn:uuid:6663e3c6-e1d5-4d85-bfb7-59c7ba11d4cf',
                                'type': ['Result'],
                                'value': '1500',
                            },
                            {
                                'resultDescription':
                                    'urn:uuid:58723beb-c895-4d42-8a54-4b8a310de5ed',
                                'type': ['Result'],
                                'value': '760',
                            },
                            {
                                'resultDescription':
                                    'urn:uuid:6416c971-964b-4db5-b72d-6fddff3e5eb9',
                                'type': ['Result'],
                                'value': '740',
                            },
                        ],
                        'type': ['AchievementSubject'],
                    },
                    'id': 'urn:uuid:b6906897-60db-4169-a24b-546b02f92a6f',
                    'issuer': {
                        'id': 'did:web:network.learncard.com:users:hillvalleyhigh',
                        'name': 'Redwood Valley University',
                        'type': ['Profile'],
                    },
                    'name': 'SAT Score Report',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2021-04-10T00:00:00Z',
                },
            ],
            '@context': {
                'identifier': {
                    '@id': 'https://purl.imsglobal.org/spec/vc/clr/vocab.html#identifier-1',
                    '@type': 'https://purl.imsglobal.org/spec/vc/ob/vocab.html#Identifier',
                    '@container': '@set',
                },
            },
        },
        'name': 'Official Academic Transcript — Redwood Valley University',
        'description':
            'Official academic transcript for the Bachelor of Arts in Interactive Media Design awarded to Olivia Trujillo, covering eight semesters of coursework, competency assessments, and degree conferral.',
        'validFrom': '2025-05-17T00:00:00Z',
        'evidence': [
            {
                'id': 'https://registrar.redwoodvalley.edu/transcripts/t-rv-2025-114.pdf',
                'type': ['Evidence'],
                'name': 'Official Academic Transcript',
                'description':
                    'Official sealed academic transcript issued by the Redwood Valley University Office of the Registrar.',
                'genre': 'Document',
                'audience': 'Employer, Graduate School Admissions',
            },
            {
                'id': 'https://registrar.redwoodvalley.edu/diplomas/d-rv-2025-114.jpg',
                'type': ['Evidence'],
                'name': 'Diploma',
                'description':
                    'Bachelor of Arts in Interactive Media Design diploma awarded May 17, 2025.',
                'genre': 'Image',
                'audience': 'General',
            },
        ],
        'awardedDate': '2025-05-17',
    },
};
