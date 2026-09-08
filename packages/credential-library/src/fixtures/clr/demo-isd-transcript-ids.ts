import type { CredentialFixture } from '../../types';

export const clrDemoIsdTranscriptIds: CredentialFixture = {
    id: 'clr/demo-isd-transcript-ids',
    name: 'Demo ISD Official Transcript (schema-safe ids)',
    description:
        'Same transcript with deterministic urn:uuid ids on every alignment, criteria and result object (the CLR schema forbids id on association and identifier). Share-VP signing drops from ~80s to ~170ms.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['alignment', 'results', 'associations', 'nested-credentials'],
    source: 'real-world',
    signed: false,
    validity: 'valid',
    tags: ['clr-credential', 'perf-regression'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        'id': 'urn:uuid:d98cf9f7-1106-4230-960c-7678b3d682ee',
        'type': ['VerifiableCredential', 'ClrCredential'],
        'issuer': {
            'id': 'did:web:network.learncard.com:users:demo-isd',
            'type': ['Profile'],
            'name': 'Demo ISD',
        },
        'credentialSubject': {
            'achievement': [
                {
                    'achievementType': 'Diploma',
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'id': 'urn:uuid:d601ce2a-9b14-4128-8d37-e9a868d5d4a4',
                        'narrative':
                            'Completion of all South Carolina high school graduation requirements.',
                    },
                    'description': 'South Carolina high school diploma.',
                    'id': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'inLanguage': 'en',
                    'name': 'High School Diploma',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:13c80886-8341-4c54-93ac-7010303c2729',
                            'name': 'Cumulative GPA',
                            'resultType': 'GradePointAverage',
                            'type': ['ResultDescription'],
                            'valueMax': '4.0',
                            'valueMin': '0.0',
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:a93adcee-c187-446f-8dbe-7cec48b6f6b6',
                            'targetName': 'Cite Textual Evidence',
                            'targetDescription':
                                'Cite strong and thorough textual evidence to support analysis of what a text says explicitly.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:01ec90e2-ef7a-4a5d-87b8-c004f6595f7f',
                            'targetName': 'Determine Theme',
                            'targetDescription':
                                'Determine a theme or central idea of a text and analyze its development over the course of the text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:d49f4695-8cf7-477f-80b6-e99c9bfedadd',
                            'targetName': 'Write Arguments',
                            'targetDescription':
                                'Write arguments to support claims using valid reasoning and relevant, sufficient evidence.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:265297e1-a971-4b00-8718-cde85c3ff00c',
                            'targetName': 'Command of Grammar and Usage',
                            'targetDescription':
                                'Demonstrate command of the conventions of standard English grammar and usage when writing.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.L.9-10.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:f826dcd5-5c7f-4d19-803b-780786af4f51',
                            'targetName': 'Collaborative Discussions',
                            'targetDescription':
                                'Initiate and participate effectively in a range of collaborative discussions.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.9-10.1',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:67009378-2f39-4133-8b78-c6e5670ba173',
                        'narrative': 'Completion of English 1 CP FS (course 302411CW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'English Language Arts',
                    'humanCode': '302411CW',
                    'id': 'urn:uuid:56dd53c6-a059-43e4-8d5b-855c78fafba2',
                    'inLanguage': 'en',
                    'name': 'English 1 CP FS',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:4ae2b748-4dff-407f-b49e-48caa8633680',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:5c1542f6-332c-4abb-91e9-1ba2a9bc3275',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:f50c19b4-132c-4809-8064-39139650e79c',
                            'targetName': 'Analyze Spatial Relationships',
                            'targetDescription':
                                'Use maps and other representations to explain relationships between the locations of places and regions.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Geo.1.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:906ae093-a862-4a0c-8893-e7ae4e5d5733',
                            'targetName': 'Human-Environment Interaction',
                            'targetDescription':
                                'Analyze relationships and interactions within and between human and physical systems.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Geo.4.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:bd84bc85-6031-4458-8332-2ebda39ef4e7',
                            'targetName': 'Geography and Historical Change',
                            'targetDescription':
                                'Analyze the reciprocal nature of how historical events and processes have shaped human and physical environments.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Geo.7.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:88ec017c-1b7c-4daf-8586-d33bd842d972',
                            'targetName': 'Migration and Settlement Patterns',
                            'targetDescription':
                                'Evaluate the influence of long-term climate variability on human migration and settlement patterns.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Geo.11.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:5f37721f-e895-4556-8688-5349486b182b',
                        'narrative': 'Completion of World Geog H FS (course 331013HW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Social Studies',
                    'humanCode': '331013HW',
                    'id': 'urn:uuid:4553365a-6fa0-41f9-813a-ca42af420029',
                    'inLanguage': 'en',
                    'name': 'World Geog H FS',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:ca20b8da-3491-45a9-b34e-c283cf898eff',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:10e8e06f-f64d-49bc-ad79-16f45e9ec89b',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:70a4ebe2-abbe-42e7-8602-2b555c6afab4',
                            'targetName': 'Access an API to Retrieve Data',
                            'targetDescription':
                                'Access an application programming interface with a programming language to retrieve data for a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:54de493a-6593-490d-8dcf-15405f9d5ab4',
                            'targetName': 'Adapt to Changing Requirements',
                            'targetDescription':
                                'Adapt to changing requirements through task or behavior adjustment.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:91681c12-06b1-415a-85e0-1e28b4af06b0',
                            'targetName': 'Analyze Complex Problems',
                            'targetDescription': 'Analyze a complex problem.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:ed006d12-408f-4016-81c5-ed52a07a6f8d',
                            'targetName': 'Differentiate Array and ArrayList Data Structures',
                            'targetDescription':
                                'Differentiate between Array and ArrayList data structures.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:45c68304-5b67-4efc-85bb-6718b6c6a34f',
                            'targetName': 'Create Backend Applications',
                            'targetDescription':
                                'Create backend online applications using Node.js.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:beb85896-5f87-4e1e-8ab8-5cd7d7a826f7',
                        'narrative':
                            'Completion of Fundamentals of Computing CP (course 502301CW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Computer Science',
                    'humanCode': '502301CW',
                    'id': 'urn:uuid:b19e4007-baec-421a-8d3b-c65e0359333e',
                    'inLanguage': 'en',
                    'name': 'Fundamentals of Computing CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:5da40141-4e92-4c8d-9883-9760646bc811',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:5f6ead58-ab1d-4bb0-9f4c-e4ae258b5d4c',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:676607c4-ae58-4c00-8797-af8b400d638b',
                            'targetName': 'Address Hacking Threats',
                            'targetDescription':
                                'Address hacking threats via physical hardware security, asset inventory, device, and patch management.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:d48ff1de-890f-4ed9-8fec-11e22a3a1a93',
                            'targetName': 'Design Access and Physical Security Protocols',
                            'targetDescription':
                                'Design access and physical security protocols where users have only the access required to complete their assigned tasks.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:d70753a3-02dc-447d-80b2-7effd066c612',
                            'targetName': 'Implement Advanced Security Technology',
                            'targetDescription':
                                'Implement advanced security technologies and tools to detect and prevent data loss and exposure.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6616c00f-3ea2-42cd-8c77-3b9a74a7f535',
                            'targetName': 'Detect Adverse Events',
                            'targetDescription': 'Detect adverse events using cyber defense tools.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:45eb83b3-82ec-4b1e-883d-7cd636dbfee6',
                            'targetName': 'Analyze Attack Trends',
                            'targetDescription':
                                'Analyze collected security data to determine attack trends in systems.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:4ed679dd-a7fe-46a1-882f-60f3df1f05ad',
                        'narrative': 'Completion of Cybersecurity (PLTW) H (course 637803HW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Cybersecurity',
                    'humanCode': '637803HW',
                    'id': 'urn:uuid:777a5bca-60b4-470f-92b1-dbc4247f616c',
                    'inLanguage': 'en',
                    'name': 'Cybersecurity (PLTW) H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:098e12e6-87f1-44fb-9818-889a5542408c',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:d91ffe63-fa88-46ef-a75f-c596abf6ed91',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:1f09f22d-db1f-4c87-8b21-febef3439ade',
                            'targetName': 'Create Equations in One Variable',
                            'targetDescription':
                                'Create equations and inequalities in one variable and use them to solve problems.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-CED.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:2bb8a0a2-3b56-4668-857a-221f611a1a81',
                            'targetName': 'Solve Linear Equations and Inequalities',
                            'targetDescription':
                                'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.B.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:58d583bf-4cca-466c-8907-80d58dc6ce00',
                            'targetName': 'Interpret Expressions',
                            'targetDescription':
                                'Interpret expressions that represent a quantity in terms of its context.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-SSE.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6616baf8-94d5-41f8-8bc9-6cd55ba2936e',
                            'targetName': 'Use Function Notation',
                            'targetDescription':
                                'Use function notation, evaluate functions for inputs in their domains.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.A.2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e786ccb0-e8c0-41bb-8a78-648ba83ac693',
                            'targetName': 'Graph Equations in Two Variables',
                            'targetDescription':
                                'Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.D.10',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:5be047a5-8a6f-4499-8047-e9c6612244cf',
                        'narrative': 'Completion of Algebra 1 H (course 411423HW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Mathematics',
                    'humanCode': '411423HW',
                    'id': 'urn:uuid:cbf5b1ac-b7c6-4344-b80c-48d6e061e697',
                    'inLanguage': 'en',
                    'name': 'Algebra 1 H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:a7dee52d-d599-4e5b-941f-579c3b776088',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:51a2cfa8-2597-4e31-b24a-49d9cbd7ca24',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:5b6dd9e1-26ed-4a08-88a5-54cd1d1f62b0',
                            'targetName': 'Motor Skill Competency',
                            'targetDescription':
                                'Demonstrates competency in a variety of motor skills and movement patterns.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:c69c00d0-ca5c-4282-8ca2-8b190a9d541f',
                            'targetName': 'Movement Concepts and Strategies',
                            'targetDescription':
                                'Applies knowledge of concepts, principles, strategies and tactics related to movement and performance.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:3278a568-af68-4373-8c5a-a0e8b126b277',
                            'targetName': 'Health-Enhancing Fitness',
                            'targetDescription':
                                'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 3',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:29407abb-94c6-4383-8051-c1052b05e554',
                        'narrative': 'Completion of PE 1 CP (course 344102CW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Physical Education',
                    'humanCode': '344102CW',
                    'id': 'urn:uuid:bf1e5cd5-8490-455e-997a-d9e7d6df39e0',
                    'inLanguage': 'en',
                    'name': 'PE 1 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:210e4208-10f0-4152-8437-3e37a1901645',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:d1cf7a6a-cfad-4306-b4aa-cb6d2280a146',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:75a1e2ac-e282-4695-8855-6e25c53f03b3',
                            'targetName': 'Constitutions, Laws, and Agreements',
                            'targetDescription':
                                'Analyze the impact of constitutions, laws, treaties, and international agreements on the maintenance of national and international order.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.3.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:271d086f-f256-4350-888d-984caa790d65',
                            'targetName': 'Civic Virtues Across Systems',
                            'targetDescription':
                                'Evaluate social and political systems in different contexts, times, and places that promote civic virtues and enact democratic principles.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.8.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:1d6794e9-3863-49d5-86fb-9e299da86e6c',
                            'targetName': 'Using and Challenging Laws',
                            'targetDescription':
                                'Analyze how people use and challenge laws to address a variety of public issues.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.12.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:50080454-41dc-43f0-890e-7dfe177b87ad',
                        'narrative': 'Completion of Law Education CP (course 333612CW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Law',
                    'humanCode': '333612CW',
                    'id': 'urn:uuid:4bf88c03-c7a0-4fe8-a288-311b90519ff3',
                    'inLanguage': 'en',
                    'name': 'Law Education CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:e1e9ebb1-3caa-4218-bca5-6ccce93e3f47',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:4e8fcab8-a965-47e8-876e-0e53623d4821',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:77db7043-17a2-400e-82a1-1331fe6cbe50',
                            'targetName': 'DNA and Protein Structure',
                            'targetDescription':
                                'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS1-1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:7aa12999-010d-4216-8d82-337948204958',
                            'targetName': 'Hierarchical Organization of Organisms',
                            'targetDescription':
                                'Develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS1-2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:a0a8fb19-fc22-40c8-8ea9-842747651f1e',
                            'targetName': 'Carrying Capacity of Ecosystems',
                            'targetDescription':
                                'Use mathematical and/or computational representations to support explanations of factors that affect carrying capacity of ecosystems.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS2-1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:154ebba3-f1ae-43bd-854f-2fdd2dfb5c68',
                            'targetName': 'Factors Driving Evolution',
                            'targetDescription':
                                'Construct an explanation based on evidence that the process of evolution primarily results from four factors.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS4-2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:1ca089f6-5fcd-4557-85b8-e2eddc9589f4',
                            'targetName': 'Cellular Division and Differentiation',
                            'targetDescription':
                                'Use a model to illustrate the role of cellular division and differentiation in producing and maintaining complex organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS1-4',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:2f35e86c-c9e6-4316-8ea9-cfa5d540f9a1',
                        'narrative': 'Completion of Biology 1 H FS (course 322113HW).',
                    },
                    'description': 'Grade 9 course, 1 credit(s).',
                    'fieldOfStudy': 'Science',
                    'humanCode': '322113HW',
                    'id': 'urn:uuid:03c1951e-fae8-4879-87aa-6ac8a8893b4e',
                    'inLanguage': 'en',
                    'name': 'Biology 1 H FS',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:0f7af524-d85b-454a-a65d-cf4bd4caca2a',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:bfdce2d3-4ef7-4c10-b8ee-d0c175c07929',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3135ed91-c47f-4021-8a8c-ca830b4d68d7',
                            'targetName': 'Periodic Table and Electron Patterns',
                            'targetDescription':
                                'Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-PS1-1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:a40b7e66-9bc3-4e49-8059-f6098bf5b193',
                            'targetName': 'Explain Chemical Reaction Outcomes',
                            'targetDescription':
                                'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-PS1-2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:ceb9833a-8548-4eec-83f4-3d295e4d2ea7',
                            'targetName': 'Model Energy in Chemical Reactions',
                            'targetDescription':
                                'Develop a model to illustrate that the release or absorption of energy from a chemical reaction system depends on the changes in total bond energy.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-PS1-4',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:12b071a8-e9b0-4eb8-853f-0ecb6be25be8',
                            'targetName': 'Conservation of Mass',
                            'targetDescription':
                                'Use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-PS1-7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:1f50acaf-f52c-4379-8cd9-535c1adb382a',
                            'targetName': 'Factors Affecting Reaction Rate',
                            'targetDescription':
                                'Apply scientific principles and evidence to provide an explanation about the effects of changing temperature or concentration on reaction rate.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-PS1-5',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:a5d045e8-7b33-460c-877b-9b81af9c4780',
                        'narrative': 'Completion of Chemistry 1 CP (course 323102CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Science',
                    'humanCode': '323102CW',
                    'id': 'urn:uuid:b32d49b0-5e88-44e0-876d-0998265fcf5d',
                    'inLanguage': 'en',
                    'name': 'Chemistry 1 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:88156d11-f7aa-4dbb-9651-0050d39c0aa9',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:187ec610-03db-4062-a406-4d4af953594c',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3278a568-af68-4373-8c5a-a0e8b126b277',
                            'targetName': 'Health-Enhancing Fitness',
                            'targetDescription':
                                'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:9dd43e99-bd17-42d1-8b80-f9c39bce196a',
                            'targetName': 'Personal and Social Responsibility',
                            'targetDescription':
                                'Exhibits responsible personal and social behavior that respects self and others.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 4',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6993602b-7452-48dd-8f19-62a31ae871d8',
                            'targetName': 'Value of Physical Activity',
                            'targetDescription':
                                'Recognizes the value of physical activity for health, enjoyment, challenge, self-expression, and/or social interaction.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 5',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:99e88c3a-0cc7-4e25-8a5e-7c3718fe3503',
                        'narrative': 'Completion of PE 2 CP (course 344200CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Physical Education',
                    'humanCode': '344200CW',
                    'id': 'urn:uuid:a853514d-2c90-48d3-8f13-c146a27f054e',
                    'inLanguage': 'en',
                    'name': 'PE 2 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:5317a828-76df-42df-8e08-67ed2eb209f2',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:79a87716-1cf7-4ccf-9d93-681dc39e0118',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:37cd5a54-5f2c-4b5e-84c1-61b207588e7b',
                            'targetName': 'Analyze Character Development',
                            'targetDescription':
                                'Analyze how complex characters develop over the course of a text, interact with other characters, and advance the plot.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:b3d5f6c6-d540-4bf1-8cb8-24462bb008bf',
                            'targetName': "Analyze Author's Point of View",
                            'targetDescription':
                                "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric.",
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.9-10.6',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:1b994ee3-583c-458c-8f3b-a76afde7d368',
                            'targetName': 'Write Narratives',
                            'targetDescription':
                                'Write narratives to develop real or imagined experiences using effective technique and well-structured event sequences.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:ac876fba-525d-4754-856b-893e04e735c3',
                            'targetName': 'Understand Figurative Language',
                            'targetDescription':
                                'Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.L.9-10.5',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e7847ba1-c5ad-4d2f-8c83-ef2350bdecd3',
                            'targetName': 'Draw Evidence From Texts',
                            'targetDescription':
                                'Draw evidence from literary or informational texts to support analysis, reflection, and research.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.9',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:5c67a4fd-9e62-497f-8051-a998123600c6',
                        'narrative': 'Completion of English 2 CP (course 302501CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'English Language Arts',
                    'humanCode': '302501CW',
                    'id': 'urn:uuid:8cba094d-1d3a-452f-a9f4-bfa8899bb78b',
                    'inLanguage': 'en',
                    'name': 'English 2 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:34837572-f67b-4834-a916-25007ab148be',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:d4bb68fb-293c-4972-9b9e-12432558293b',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:b9f81679-447c-4d43-83a0-86ab8e22db6f',
                            'targetName': 'Define Geometric Terms',
                            'targetDescription':
                                'Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:8491276d-8b6c-475a-8903-24e1f90bde5e',
                            'targetName': 'Prove Triangle Congruence',
                            'targetDescription':
                                'Use the definition of congruence in terms of rigid motions to show two triangles are congruent.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.B.7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e551ae7e-6fd9-41d9-88b0-de9da5b48ffc',
                            'targetName': 'Similarity and Congruence Criteria',
                            'targetDescription':
                                'Use congruence and similarity criteria for triangles to solve problems and prove relationships in geometric figures.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-SRT.B.5',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6912a8e6-2ddb-4f48-8abe-f44c8872e598',
                            'targetName': 'Coordinate Geometry: Perimeter and Area',
                            'targetDescription':
                                'Use coordinates to compute perimeters of polygons and areas of triangles and rectangles.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-GPE.B.7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:cd99dc31-a29f-48d0-8cce-1637f5441c39',
                            'targetName': 'Inscribed Angle and Circle Relationships',
                            'targetDescription':
                                'Identify and describe relationships among inscribed angles, radii, and chords.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-C.A.2',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:9129a7b5-7452-495d-857d-3742402d237e',
                        'narrative': 'Completion of Geometry H (course 412213HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Mathematics',
                    'humanCode': '412213HW',
                    'id': 'urn:uuid:06998632-1a55-41de-a93e-27b1d10964eb',
                    'inLanguage': 'en',
                    'name': 'Geometry H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:c4d357cc-1c18-4af0-9ad6-121cb43b5ffd',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:9b8d8d5d-2668-4fc4-adbc-a9086d04977e',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3bbbe697-b269-401f-8a48-56e89b57bf47',
                            'targetName': 'Historical Context of Events',
                            'targetDescription':
                                'Evaluate how historical events and developments were shaped by unique circumstances of time and place.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.1.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:34f66dfb-8d4e-4398-86ad-260ecac6f320',
                            'targetName': 'Generate Historical Questions',
                            'targetDescription':
                                'Use questions generated about multiple historical sources to pursue further investigation.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.3.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:804d32e7-5f53-4d00-8565-d037f34939a3',
                            'targetName': 'Analyze Causes and Effects',
                            'targetDescription':
                                'Analyze multiple and complex causes and effects of events in the past.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.14.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:13e2398b-c79a-4c1f-8fe8-a89967c31cb3',
                            'targetName': 'Construct Historical Arguments',
                            'targetDescription':
                                'Integrate evidence from multiple relevant historical sources and interpretations into a reasoned argument.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.16.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:8121db9a-3678-4bf8-8fb0-d9606e4f63f2',
                        'narrative': 'Completion of Modern World History H (course 330600HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Social Studies',
                    'humanCode': '330600HW',
                    'id': 'urn:uuid:94aae499-e45a-4e70-949a-f2245c50117f',
                    'inLanguage': 'en',
                    'name': 'Modern World History H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:7c524d10-788e-4900-9b07-c3ba74fad6a1',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:f5fec68d-2624-4ffc-893a-68a756867829',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:03bcebbe-3ab6-4108-8f7c-d135309a18bd',
                            'targetName': 'Cultural Practices and Perspectives',
                            'targetDescription':
                                'Demonstrate an understanding of the relationship between the practices and perspectives of the culture studied.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 2.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:f44df939-32cd-4c0f-8b1e-1c3f5b1ee0df',
                            'targetName': 'Cultural Products and Perspectives',
                            'targetDescription':
                                'Demonstrate an understanding of the relationship between the products and perspectives of the culture studied.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 2.2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:9895e453-3a5e-40fb-89ae-ec70d2301996',
                            'targetName': 'Making Interdisciplinary Connections',
                            'targetDescription':
                                'Use the language to reinforce and further knowledge of other disciplines.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 3.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:70ab5dff-eba4-44c5-8bf0-c99c483db568',
                            'targetName': 'Language Use Beyond the Classroom',
                            'targetDescription':
                                'Use the language both within and beyond the school setting.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 5.1',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:6db00b51-56c8-4d59-8bf2-1db715193035',
                        'narrative': 'Completion of Spanish 2 CP (course 365202CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'World Languages',
                    'humanCode': '365202CW',
                    'id': 'urn:uuid:ddb88c8a-6f58-48b1-b05d-3434e41addaf',
                    'inLanguage': 'en',
                    'name': 'Spanish 2 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:cb4df6ee-28fc-4dc9-b527-dbc5852efdd2',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:110f4e7b-264c-4b73-a072-c77d55739d3c',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3b05a996-8229-403b-8227-5ae4e65cc0f2',
                            'targetName': 'Interpersonal Communication',
                            'targetDescription':
                                'Engage in conversations, provide and obtain information, express feelings and emotions, and exchange opinions.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 1.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:4fc53448-6933-4d1d-82d3-21d6f51a279c',
                            'targetName': 'Interpretive Communication',
                            'targetDescription':
                                'Understand and interpret spoken and written language on a variety of topics.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 1.2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:c59cbd91-0fd1-4d2a-86a8-5de85b9b110b',
                            'targetName': 'Presentational Communication',
                            'targetDescription':
                                'Present information, concepts, and ideas to an audience of listeners or readers on a variety of topics.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 1.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:10bc9245-f76b-45f7-8537-d2ef8cf85140',
                            'targetName': 'Comparing Language Structures',
                            'targetDescription':
                                'Demonstrate understanding of the nature of language through comparisons of the language studied and their own.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetUrl': 'https://www.actfl.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Standard 4.1',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:b0a59254-f874-48e6-87d4-17f5b9a1ac8e',
                        'narrative': 'Completion of Spanish 1 CP (course 365102CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'World Languages',
                    'humanCode': '365102CW',
                    'id': 'urn:uuid:edb0b659-8090-4755-86e3-c054cf51ddb6',
                    'inLanguage': 'en',
                    'name': 'Spanish 1 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:79641812-076f-4f48-b827-4a0be23e5614',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:fe02b631-096c-43c1-b289-28722750f5f2',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:4c453d93-663a-4367-8c37-8b25aa99720a',
                            'targetName': 'DNA and Chromosomes in Inheritance',
                            'targetDescription':
                                'Ask questions to clarify relationships about the role of DNA and chromosomes in coding instructions for characteristic traits.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS3-1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:cfca0c9e-d297-433e-8fb6-9c17dbfe136d',
                            'targetName': 'Sources of Genetic Variation',
                            'targetDescription':
                                'Make and defend a claim based on evidence that inheritable genetic variations may result from new genetic combinations, mutation, or environmental factors.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS3-2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:aa1262cf-158a-4ac6-8df7-9d187585c69a',
                            'targetName': 'Ecosystem Stability Evidence',
                            'targetDescription':
                                'Evaluate claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS2-6',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:b914f632-5b9f-4cde-83bd-45fcbf1f3ecb',
                            'targetName': 'Design Solutions to Reduce Human Impact',
                            'targetDescription':
                                'Design, evaluate, and refine a solution for reducing the impacts of human activities on the environment.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS2-7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:136662b2-79fa-444a-8900-cea0702d94c6',
                            'targetName': 'Natural Selection and Adaptation',
                            'targetDescription':
                                'Construct an explanation based on evidence for how natural selection leads to adaptation of populations.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'HS-LS4-4',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:c0127948-21bc-4822-8d91-604d98b263a1',
                        'narrative': 'Completion of Biology 2 H (course 322203HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Science',
                    'humanCode': '322203HW',
                    'id': 'urn:uuid:4f4c2e8e-7375-465f-99fe-5c99ca9cf63d',
                    'inLanguage': 'en',
                    'name': 'Biology 2 H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:59b8492f-2126-46de-bf90-543ea15000f0',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:b2105180-63a8-49e2-8ace-5e406c3b98f5',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:8c3ff364-c2dd-44b2-8532-fd73f5c93742',
                            'targetName': 'Change and Continuity in Eras',
                            'targetDescription':
                                'Analyze change and continuity in historical eras.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.2.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:438f86ee-2907-4c71-8029-dbabec2b7997',
                            'targetName': 'Historical Context and Perspective',
                            'targetDescription':
                                "Analyze how historical contexts shaped and continue to shape people's perspectives.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.5.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:9be196ca-464a-46c9-8a8a-dd1144025a56',
                            'targetName': 'Sources and Interpretations',
                            'targetDescription':
                                'Analyze the relationship between historical sources and the secondary interpretations made from them.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.His.12.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:b5127570-7341-423b-8649-de859845ecdf',
                            'targetName': 'Analyzing the Use of Power',
                            'targetDescription':
                                'Analyze the impact and the appropriate use of power in the United States and other nations.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.10.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:c255c6f7-eef1-47c0-8a8d-cd51b5260c9a',
                        'narrative': 'Completion of US History H (course 332003HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Social Studies',
                    'humanCode': '332003HW',
                    'id': 'urn:uuid:19537621-3073-4cb7-81f9-fdc3f360391d',
                    'inLanguage': 'en',
                    'name': 'US History H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:076caf2e-cd87-4ae1-89f7-1a15c03c6a21',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:eb637579-811e-41ad-b50c-4dcd7cb56b34',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:369aad04-5433-424f-87c7-9205930fe393',
                            'targetName': 'Identify Application Development Software',
                            'targetDescription':
                                'Identify appropriate software for developing web, desktop, or mobile applications.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e6c96fe8-23f3-4ed3-8713-83230e74e8fe',
                            'targetName': 'Create Client-Server Systems',
                            'targetDescription':
                                'Create client-server systems using object-oriented programming.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:04ff8613-d59a-4ea9-8aec-95e6a93052d3',
                            'targetName': 'Track and Address Bug Fixes',
                            'targetDescription': 'Track and address bug fixes.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:75bf0633-f948-44c7-83d7-12dd8be1288c',
                            'targetName': 'Identify Software Design Requirements',
                            'targetDescription':
                                'Identify business requirements for software design.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:b74eca04-b90b-4f29-8ce1-97c16d963d21',
                            'targetName': 'Collaborative Troubleshooting',
                            'targetDescription':
                                'Collaborate on troubleshooting software problems.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:f416a895-eb4b-40f1-8c3c-c745c1b86d99',
                        'narrative':
                            'Completion of Video Game Design-CP (Non CTE) (course 389903CW).',
                    },
                    'description': 'Grade 11 course, 1 credit(s).',
                    'fieldOfStudy': 'Computer Science',
                    'humanCode': '389903CW',
                    'id': 'urn:uuid:303a945f-a8e2-4eb3-8cd9-0df05ca88ce4',
                    'inLanguage': 'en',
                    'name': 'Video Game Design-CP (Non CTE)',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:83b950d8-57c7-4323-864b-880ebd4f985c',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:84b50fce-88e9-4f6d-b2ba-0bd33faabf80',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:97f3b56a-0ce0-4ab7-8e68-1f77eb8e4c4a',
                            'targetName': 'Zeros of Polynomials',
                            'targetDescription':
                                'Identify zeros of polynomials and use the zeros to construct a rough graph of the function.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-APR.B.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:ae13b4aa-c498-4f4d-8e59-38e1fbb48be5',
                            'targetName': 'Graph Polynomial Functions',
                            'targetDescription':
                                'Graph polynomial functions, identifying zeros when suitable factorizations are available.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.C.7C',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:33efc0c4-f29b-47a5-86c7-29069455a737',
                            'targetName': 'Describe Events as Sample Spaces',
                            'targetDescription':
                                'Describe events as subsets of a sample space using characteristics of the outcomes.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:974ff8f0-39e8-4a7a-807e-c2b338aebb57',
                            'targetName': 'Permutations and Combinations',
                            'targetDescription':
                                'Use permutations and combinations to compute probabilities of compound events.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.B.9',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:72dd7963-a562-4c3d-8137-5bf72bdef779',
                            'targetName': 'Solve Rational and Radical Equations',
                            'targetDescription':
                                'Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.A.2',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:6d598347-dfb4-4d72-88f1-bf55806c57f3',
                        'narrative': 'Completion of Algebra 2 with Probability (course 411501CW).',
                    },
                    'description': 'Grade 11 course, 1 credit(s).',
                    'fieldOfStudy': 'Mathematics',
                    'humanCode': '411501CW',
                    'id': 'urn:uuid:1208cb34-e9f2-44f6-9d6f-83db0b6d1417',
                    'inLanguage': 'en',
                    'name': 'Algebra 2 with Probability',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:893ca7a8-03be-4720-8026-17eeb83266fd',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:c1db2dad-5d38-4b3a-9e2f-d0f85c700a4d',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:95e0d68f-6ba1-4082-80ec-25096c2111b7',
                            'targetName': 'Geometric Modeling',
                            'targetDescription':
                                'Use geometric shapes, their measures, and their properties to describe objects.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-MG.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:f13b9577-ebbb-4473-8572-30804c4f6e0f',
                            'targetName': 'Volume Formulas',
                            'targetDescription':
                                'Use volume formulas for cylinders, pyramids, cones, and spheres to solve problems.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-GMD.A.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:7de392d8-b334-4044-84c7-ca2a02c2a0e3',
                            'targetName': 'Represent Data with Plots',
                            'targetDescription':
                                'Represent data with plots on the real number line (dot plots, histograms, and box plots).',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:f461fe76-0a49-40be-86c9-43a8aa091f59',
                            'targetName': 'Summarize Two-Variable Data',
                            'targetDescription':
                                'Represent data on two quantitative variables on a scatter plot, and describe how the variables are related.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.B.6',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:55cc496e-502d-4502-8265-6a3c1b83dc36',
                            'targetName': 'Fit Data to a Normal Distribution',
                            'targetDescription':
                                'Use the mean and standard deviation of a data set to fit it to a normal distribution.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.4',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:67abfd6e-584f-40f9-86ae-b4e9776c3717',
                        'narrative': 'Completion of Geometry with Statistics CP (course 412203CW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Mathematics',
                    'humanCode': '412203CW',
                    'id': 'urn:uuid:da13c9fe-dcc1-499d-87d6-4d0847f6c0e4',
                    'inLanguage': 'en',
                    'name': 'Geometry with Statistics CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:a724f76a-0b47-499b-ab47-3ba658bc401c',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:eb13485b-ae3e-4324-a5cd-be1c438dfcc9',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:29a7ae55-c48c-450d-83b5-33289e570739',
                            'targetName': 'Analyze Theme Development',
                            'targetDescription':
                                'Determine two or more themes or central ideas of a text and analyze their development over the course of the text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.2',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:eb2d5d4f-8c47-4f5e-874f-631d602e6ad8',
                            'targetName': 'Integrate Multiple Sources',
                            'targetDescription':
                                'Integrate and evaluate multiple sources of information presented in different media or formats.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:4822908f-b044-429c-80a9-a76220069566',
                            'targetName': 'Write Arguments with Sufficient Evidence',
                            'targetDescription':
                                'Write arguments to support claims using valid reasoning and sufficient evidence.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:756d8112-99fa-4462-8987-0c4d92f103ba',
                            'targetName': 'Present Findings Clearly',
                            'targetDescription':
                                'Present information, findings, and supporting evidence clearly, concisely, and logically.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.4',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:0b5cb301-97b4-4d79-8c4e-84e893762c64',
                            'targetName': 'Apply Knowledge of Language',
                            'targetDescription':
                                'Apply knowledge of language to understand how language functions in different contexts.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.L.11-12.3',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:de9f157c-4213-4cda-845d-f0fc9cfd0c3c',
                        'narrative': 'Completion of English 3 CP (course 302601CW).',
                    },
                    'description': 'Grade 11 course, 1 credit(s).',
                    'fieldOfStudy': 'English Language Arts',
                    'humanCode': '302601CW',
                    'id': 'urn:uuid:3c71551f-6bf4-4801-ba57-4be84dcffda2',
                    'inLanguage': 'en',
                    'name': 'English 3 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:c7157447-ed74-4882-b6d1-4cb94f25410b',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:959da9f6-5596-4469-94e8-0ddeeb58ea0b',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:1eda38ae-723a-46ad-8a79-c52d7316307b',
                            'targetName': 'Analyze Market Trends',
                            'targetDescription':
                                'Analyze market trends, competitor activities and customer needs to develop business plans and proposals.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:3aeb1ac2-d905-41a2-8b6c-ef285d5d15c0',
                            'targetName': 'Build Relationships With Investors',
                            'targetDescription': 'Build relationships with investors.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:17472cf7-c449-48d2-8e66-4e530eafa826',
                            'targetName': 'Build Customer Loyalty',
                            'targetDescription': 'Build customer loyalty.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:1731e319-94a5-4c80-8a8e-b78627d252d3',
                            'targetName': 'Manage Business Cash Flow',
                            'targetDescription': 'Manage cash flow in a business.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:336f28b3-5029-4900-8acb-fab6c16f96e0',
                            'targetName': 'Build Business Relationships',
                            'targetDescription': 'Build business relationships.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:56064dcb-6308-4b9f-8214-c40c6b5dd475',
                        'narrative': 'Completion of Entrepreneurship (course 540002CW).',
                    },
                    'description': 'Grade 11 course, 1 credit(s).',
                    'fieldOfStudy': 'Business',
                    'humanCode': '540002CW',
                    'id': 'urn:uuid:d0f4ddb4-6ea1-44e8-b908-7cf0441f703f',
                    'inLanguage': 'en',
                    'name': 'Entrepreneurship',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:a35b5993-e54e-4f59-a20a-34fb48fc06a3',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:475c1db0-f3f8-42d8-8a27-937608a80535',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:89624975-6bab-445e-8afe-aa30468267e8',
                            'targetName': 'Apply Design Principles',
                            'targetDescription':
                                'Apply knowledge of design principles and best practices to create visually cohesive and aesthetically pleasing designs using digital tools.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:2feb99eb-35fd-4556-8db7-a0edcd1c0e17',
                            'targetName': 'Demonstrate Empathy for Users',
                            'targetDescription':
                                'Demonstrate empathy for users to inform solutions to design problems.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:85f7f357-dd2c-4d1e-807a-273ccda944ad',
                            'targetName': 'Apply Design Thinking Methodologies',
                            'targetDescription':
                                'Apply design thinking methodologies to develop innovative solutions.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:a8b03a7b-a62e-4392-825c-dc96fbab04ec',
                            'targetName': 'Create Low-Fidelity Prototypes',
                            'targetDescription': 'Create a low-fidelity prototype.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:350690ad-9af7-44b9-80d7-55afa373078c',
                            'targetName': 'Conduct User Research',
                            'targetDescription':
                                "Conduct user research to understand target audiences' preferences and behaviors.",
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:09ed90b8-4ea7-4eee-8cc1-a73d1f11a997',
                        'narrative': 'Completion of Digital Art and Design 1 H (course 612001HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Art & Design',
                    'humanCode': '612001HW',
                    'id': 'urn:uuid:c84fd5bb-0fe2-4be7-84df-ea903d8f8324',
                    'inLanguage': 'en',
                    'name': 'Digital Art and Design 1 H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:9d7f8e42-713d-46c3-8287-baf80ccaedde',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:1b09c4ba-ad35-4412-90cd-50cff6cb6910',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3312283a-5698-4ff6-87ca-8296eed30383',
                            'targetName': 'Create Intuitive Interfaces',
                            'targetDescription':
                                'Create intuitive and user-friendly interfaces that align with business goals and target audience expectations.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e1186a2b-e4b5-4958-80fe-ea3b4ea2a159',
                            'targetName': 'Leverage Prototyping Tools',
                            'targetDescription':
                                'Leverage prototyping tools to create interactive digital prototypes and mockups.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:5d18d7ed-c1de-463b-8d00-5915a17e49a0',
                            'targetName': 'Develop a Prototype Strategy',
                            'targetDescription': 'Identify inputs for a prototype strategy.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:32a14eca-2700-4108-8d0f-1dd867750567',
                            'targetName': 'Test Prototypes Against Requirements',
                            'targetDescription':
                                'Test a prototype against defined product requirements.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:e23ad154-d88c-45ef-80eb-dbfaf6ed2b09',
                            'targetName': 'Product Design Strategy',
                            'targetDescription':
                                'Identify the optimal approach to introduce a new product into the marketplace.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:2be14f4c-cd12-4e4e-879f-3f0d88925ef1',
                        'narrative': 'Completion of Digital Art and Design 2 H (course 612101HW).',
                    },
                    'description': 'Grade 10 course, 1 credit(s).',
                    'fieldOfStudy': 'Art & Design',
                    'humanCode': '612101HW',
                    'id': 'urn:uuid:65859218-0f27-4100-a7de-7e93ff1b771c',
                    'inLanguage': 'en',
                    'name': 'Digital Art and Design 2 H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:bc7cbddd-0a87-45d0-a778-2fad084f964b',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:48f7f5f5-443a-4fc4-bcf1-0b8959839773',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:3f38f4f8-0d49-4b62-8a1d-368992124057',
                            'targetName': 'Powers of Civic Institutions',
                            'targetDescription':
                                'Distinguish the powers and responsibilities of local, state, tribal, national, and international civic and political institutions.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.1.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:600097c2-41e7-4b8e-8ddf-e39874746b8f',
                            'targetName': 'Effectiveness of Civic Institutions',
                            'targetDescription':
                                "Evaluate citizens' and institutions' effectiveness in addressing social and political problems.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.5.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:0148d104-bf0a-48b4-81bf-5eb0111dcd9c',
                            'targetName': 'Governments, Civil Society, and Markets',
                            'targetDescription':
                                'Critique relationships among governments, civil societies, and economic markets.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.6.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:989d0789-0a96-403d-8a7b-582ef119aae2',
                            'targetName': 'Means of Changing Society',
                            'targetDescription':
                                'Analyze historical, contemporary, and emerging means of changing societies, promoting the common good, and protecting rights.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Civ.14.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 0.5,
                    'criteria': {
                        'id': 'urn:uuid:31be6d5a-fecb-46b3-83c3-5a4a9b391aaa',
                        'narrative': 'Completion of Amer Govt CP (course 333002CH).',
                    },
                    'description': 'Grade 12 course, 0.5 credit(s).',
                    'fieldOfStudy': 'Social Studies',
                    'humanCode': '333002CH',
                    'id': 'urn:uuid:0de7bfa6-3fa2-46ad-b650-4ee77e07c2c4',
                    'inLanguage': 'en',
                    'name': 'Amer Govt CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:8bd28b48-2a65-408e-b6a8-f1b2c09509cf',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:6199ab14-51ce-4804-9e17-b716c95e00b4',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:4f412e80-c699-4fbf-8225-fc0ddf651483',
                            'targetName': 'Analyze Point of View',
                            'targetDescription':
                                'Analyze a case in which grasping point of view requires distinguishing what is directly stated from what is really meant.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.6',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:08edcf74-5932-4b84-8b2c-1b262b5cda24',
                            'targetName': 'Conduct Research Projects',
                            'targetDescription':
                                'Conduct short as well as more sustained research projects to answer a question or solve a problem.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:a7b222ec-2964-4414-80c3-7409efb59f07',
                            'targetName': 'Evaluate Reasoning in Texts',
                            'targetDescription':
                                'Delineate and evaluate the reasoning in seminal texts, assessing the validity of the reasoning.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.8',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:aa9ceda7-c21b-44ca-825c-1eea23730b9f',
                            'targetName': 'Produce Clear and Coherent Writing',
                            'targetDescription':
                                'Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.4',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:4d16dcb4-ab28-4fd4-881e-704be8675e24',
                            'targetName': 'Engage in Collaborative Discussions',
                            'targetDescription':
                                "Initiate and participate effectively in a range of collaborative discussions, building on others' ideas.",
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.1',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:5ee04a83-4fd3-426f-8a49-a1dee3241e6c',
                        'narrative': 'Completion of English 4 CP (course 302701CW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'English Language Arts',
                    'humanCode': '302701CW',
                    'id': 'urn:uuid:16ac897d-4fe0-41dc-9bec-91025dfa84bd',
                    'inLanguage': 'en',
                    'name': 'English 4 CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:e34ff4d2-9ed1-4c01-b65f-943c225912bc',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:137f751e-3394-4d12-aeb2-5d5e0810ead1',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:df1a1569-2e55-4683-887a-52e9cc4042ba',
                            'targetName': 'Perceive and Analyze Artistic Work',
                            'targetDescription': 'Perceive and analyze artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Anchor Standard 7',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:cd3e3a08-9662-4cb0-8018-36b80ea8147b',
                            'targetName': 'Interpret Intent and Meaning',
                            'targetDescription': 'Interpret intent and meaning in artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Anchor Standard 8',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:01e09abe-99f3-4162-88b6-8a8f493871a3',
                            'targetName': 'Apply Criteria to Evaluate Art',
                            'targetDescription': 'Apply criteria to evaluate artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Anchor Standard 9',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:5627ff9b-2799-4497-8d77-6e35dbce72b3',
                            'targetName': 'Connect Art to Historical Context',
                            'targetDescription':
                                'Relate artistic ideas and works with societal, cultural, and historical context to deepen understanding.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'targetType': 'CFItem',
                            'targetCode': 'Anchor Standard 11',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:6975206f-c02f-406b-8c8b-0ee75101c9d2',
                        'narrative': 'Completion of Art History CP (course 358802CW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'Art History',
                    'humanCode': '358802CW',
                    'id': 'urn:uuid:5af992e1-2176-4f85-a80f-5b57dcc0dff9',
                    'inLanguage': 'en',
                    'name': 'Art History CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:b22d5ca7-20ab-48c9-9966-d6cd33793778',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:9ae946b2-effe-45c9-b544-a9c610b754fa',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:9a2d834a-c982-4ad8-8eed-cc064cdfae66',
                            'targetName': 'Incentives and Policy Tradeoffs',
                            'targetDescription':
                                'Analyze how incentives influence choices that may result in policies with a range of costs and benefits for different groups.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Eco.1.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:5cec7009-d65d-4dc6-8a36-2ac0dac067fb',
                            'targetName': 'Marginal Benefit and Cost Analysis',
                            'targetDescription':
                                'Use marginal benefits and marginal costs to construct an argument for or against a decision.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Eco.2.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:87fff6fe-7f9b-4941-8df4-84e53899384b',
                            'targetName': 'Specialization and Trade',
                            'targetDescription':
                                'Explain why individuals and institutions specialize and trade.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Eco.13.9-12',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6306b269-1fa1-446f-82dd-0a06eef3a4bf',
                            'targetName': 'Monetary and Fiscal Policy Effects',
                            'targetDescription':
                                "Explain how changes in monetary and fiscal policy can affect an individual's spending and saving decisions.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'targetType': 'CFItem',
                            'targetCode': 'D2.Eco.15.9-12',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 0.5,
                    'criteria': {
                        'id': 'urn:uuid:d162ef89-4caa-4a31-8ac6-7cd301fdaf48',
                        'narrative': 'Completion of Economics &  Per Finance CP (course 330800CH).',
                    },
                    'description': 'Grade 12 course, 0.5 credit(s).',
                    'fieldOfStudy': 'Social Studies',
                    'humanCode': '330800CH',
                    'id': 'urn:uuid:bd2f71ec-839a-433f-91b0-18e2937d0ec1',
                    'inLanguage': 'en',
                    'name': 'Economics &  Per Finance CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:8a54aceb-b22c-4c82-9190-4937597a4c51',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:3a519ca1-52d9-470d-a567-90661e2fbd67',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:2c28fe7d-071c-4c3a-8dfd-9de14f055213',
                            'targetName': 'Basic Inferential Analysis',
                            'targetDescription': 'Perform basic inferential analyses.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:918bb0f1-61d9-492b-89e9-6c8b548b9650',
                            'targetName': 'Apply Basic Probability and Statistics',
                            'targetDescription': 'Apply basic probability and statistics.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:18cdc1f1-1239-4d75-8b28-a8bac90c0163',
                            'targetName': 'Calculate Descriptive Statistics',
                            'targetDescription':
                                'Calculate descriptive statistics to better understand data.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:cc93b521-e21c-43c8-8578-23152acdb4ea',
                            'targetName': 'Define Distribution Properties',
                            'targetDescription':
                                'Define the distribution properties of a data set.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:2567891b-6144-44e7-877d-484289f515de',
                            'targetName': 'Identify Data Set Bias',
                            'targetDescription':
                                'Identify any data set biases that may exist for a given statistical analysis.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:49a81eab-56ee-4f98-8141-c38c04553817',
                        'narrative': 'Completion of Statistical Modeling CP (course 412001CW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'Mathematics',
                    'humanCode': '412001CW',
                    'id': 'urn:uuid:7793cdaf-cfb0-4ae0-a1f8-e10e8c1f34eb',
                    'inLanguage': 'en',
                    'name': 'Statistical Modeling CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:784a4a74-d423-4d06-9e1d-2f4945202842',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:1485768b-634d-46bd-b7e0-0aea4af40867',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Award',
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'id': 'urn:uuid:fbd1a1f2-032b-46d5-8e8d-ecb05efdb327',
                        'narrative':
                            'Awarded in addition to the standard diploma to graduates who earn a cumulative GPA of 3.0 or higher and an ACT composite score of 20 or higher.',
                    },
                    'description':
                        "Recognizes graduates who meet South Carolina's college-readiness benchmarks.",
                    'id': 'urn:uuid:a833a621-f32e-4b69-9795-cf3dcf38f483',
                    'inLanguage': 'en',
                    'name': 'College Ready Seal of Distinction',
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Assessment',
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'id': 'urn:uuid:68857e03-2832-41c7-812f-d0f70009bb24',
                        'narrative': 'Completion of the ACT college readiness assessment.',
                    },
                    'description':
                        'The ACT college admissions and placement exam, administered by ACT, Inc.',
                    'id': 'urn:uuid:1e235a5a-995e-46f2-8d7c-f0d152b0565b',
                    'inLanguage': 'en',
                    'name': 'ACT',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:70e18226-28fa-431e-92f9-e230ce0af6cb',
                            'name': 'ACT Composite Score',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '36',
                            'valueMin': '1',
                        },
                        {
                            'id': 'urn:uuid:00c322d4-1291-4ba8-8300-5a89a79418ea',
                            'name': 'ACT English Score',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '36',
                            'valueMin': '1',
                        },
                        {
                            'id': 'urn:uuid:b97aa3ca-e16c-430d-adbb-826ffb6da76d',
                            'name': 'ACT Math Score',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '36',
                            'valueMin': '1',
                        },
                        {
                            'id': 'urn:uuid:e9bcea1a-83f2-401a-930e-7b207d08c1d4',
                            'name': 'ACT Reading Score',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '36',
                            'valueMin': '1',
                        },
                        {
                            'id': 'urn:uuid:7c50c37f-7392-4c68-8fc5-d705769e70a9',
                            'name': 'ACT Science Score',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                            'valueMax': '36',
                            'valueMin': '1',
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:42b52a87-40d6-41c9-8290-f4b9f0d9e1a4',
                            'targetName': 'Cite Textual Evidence and Draw Inferences',
                            'targetDescription':
                                'Cite strong and thorough textual evidence, including where the text leaves matters uncertain, to support analysis and inferences drawn from it.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.1',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:5d64f272-73d1-4e5f-8f6b-0a47f5ca62a8',
                            'targetName': "Analyze Author's Choices in Story Elements",
                            'targetDescription':
                                'Analyze the impact of the choices an author makes regarding how to develop and relate elements of a story.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:12203aff-aaa5-41b7-856e-b50347940195',
                            'targetName': 'Analyze Figurative and Connotative Language',
                            'targetDescription':
                                'Determine the meaning of words and phrases as used in the text, including figurative and connotative meanings.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.4',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:518b581a-25da-4edb-8171-051da1273836',
                            'targetName': 'Analyze Multiple Interpretations of a Text',
                            'targetDescription':
                                'Analyze multiple interpretations of a story, drama, or poem, evaluating how each version interprets the source text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'targetType': 'CFItem',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.7',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:3c0b7ff7-b7b4-4a9b-827b-7536a7bb659b',
                        'narrative': 'Completion of Mythology H (course 309905HW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'English Language Arts',
                    'humanCode': '309905HW',
                    'id': 'urn:uuid:a79897d8-6210-4dfb-942d-c2fb97d86f88',
                    'inLanguage': 'en',
                    'name': 'Mythology H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:e92b7a22-389c-4ad6-83e0-accd16671089',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:1629eda4-bd0b-4899-bd99-da01ea37a5eb',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:4be156bf-7cae-4770-84e5-7ab069371958',
                            'targetName': 'Access an API to Change Data',
                            'targetDescription':
                                'Access an application programming interface with a programming language to change data for a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:13909fa2-107d-4c80-8a46-13f05eedbc73',
                            'targetName': 'Access an API to Process a Task',
                            'targetDescription':
                                'Access an application programming interface with a programming language to process a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:d1c7810e-4319-451b-8e00-89684f4784d9',
                            'targetName': 'Call Functions in C',
                            'targetDescription': 'Call functions using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:2c9fe6fa-679c-4a2e-851c-660ca905ad6d',
                            'targetName': 'Create Functions in C',
                            'targetDescription':
                                'Create functions using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:bbc86638-1a5f-4944-853c-c9e8390427d7',
                            'targetName': 'Declare Variables in C',
                            'targetDescription':
                                'Declare variables using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:271df15a-7ccf-4ccb-8d6c-77ce5f32b8f6',
                        'narrative': 'Completion of Intro to Computer Prog H (course 505003HW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'Computer Science',
                    'humanCode': '505003HW',
                    'id': 'urn:uuid:cd343ac0-c587-4deb-9a20-d8e72697a14d',
                    'inLanguage': 'en',
                    'name': 'Intro to Computer Prog H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:a3376f99-22a9-4b94-84de-7fa7afd69116',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:3b98d3ec-8b03-4c01-b57b-61e40f33e648',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:78d80278-57b2-4ba7-8f93-51401ecdbe89',
                            'targetName': 'Create an Object-Oriented Program in Java',
                            'targetDescription': 'Create an object-oriented program using Java.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:f5089cdd-7f6b-4e7a-868b-dcb17fd6bdde',
                            'targetName': 'Create an Object-Oriented Class in C++',
                            'targetDescription': 'Create an object-oriented class with C++.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:59cf8be9-f4a1-4e02-86b2-c4c0b4a9585e',
                            'targetName': 'Implement Object-Oriented Programming in C#',
                            'targetDescription': 'Implement object-oriented programming using C#.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:96f590b2-6c8f-43ad-85c8-8a64c483e122',
                            'targetName': 'Apply Iteration Loops in Java',
                            'targetDescription': 'Apply loops to iterate using Java.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:8a8e07be-fa57-46c8-8588-29aa89659a25',
                            'targetName': 'Create a Data Structure Map',
                            'targetDescription': 'Create a data structure map.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'targetType': 'ceasn:Competency',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:a768a2b1-ec98-43cb-8362-f8cb6463a304',
                        'narrative': 'Completion of Interm Computer Prog H (course 505103HW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'Computer Science',
                    'humanCode': '505103HW',
                    'id': 'urn:uuid:158393a6-3857-49fa-8722-25c8797a8170',
                    'inLanguage': 'en',
                    'name': 'Interm Computer Prog H',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:a640b2e2-3a15-4b97-93d6-1f5f8215cdcf',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:a2dd7c37-d3e4-4ad0-80f4-923d378b10ed',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
                {
                    'achievementType': 'Course',
                    'alignment': [
                        {
                            'id': 'urn:uuid:d32c6ec3-133f-4f46-82b8-3d18665d6545',
                            'targetName': 'Apply the Engineering Design Process',
                            'targetDescription':
                                'Apply an iterative engineering design process - defining problems, developing solutions, and testing and refining prototypes - to a technological system.',
                            'targetFramework':
                                'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                            'targetUrl': 'https://www.iteea.org/stel',
                            'targetType': 'CFItem',
                            'targetCode': 'Engineering Design',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:19d8485f-9d4f-420a-80f2-31d584547693',
                            'targetName': 'Troubleshoot Technological Systems',
                            'targetDescription':
                                'Operate, maintain, and troubleshoot a technological system, diagnosing and resolving malfunctions.',
                            'targetFramework':
                                'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                            'targetUrl': 'https://www.iteea.org/stel',
                            'targetType': 'CFItem',
                            'targetCode': 'Abilities for a Technological World',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:6544bde5-570b-4d18-8e61-47e0af67beff',
                            'targetName': 'Understand sUAS Airspace and Operating Rules',
                            'targetDescription':
                                'Understand small unmanned aircraft system (sUAS) airspace classifications, operating rules, and pilot responsibilities.',
                            'targetFramework':
                                'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                            'targetUrl':
                                'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                            'targetType': 'CFItem',
                            'targetCode': '14 CFR Part 107',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'urn:uuid:84716152-7908-49ac-8951-302289bbf313',
                            'targetName': 'Conduct Pre-Flight Risk Assessment',
                            'targetDescription':
                                'Conduct a pre-flight risk assessment and follow safe operating procedures for small unmanned aircraft.',
                            'targetFramework':
                                'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                            'targetUrl':
                                'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                            'targetType': 'CFItem',
                            'targetCode': '14 CFR Part 107',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'creditsAvailable': 1,
                    'criteria': {
                        'id': 'urn:uuid:f5b184f8-c23d-4a9b-842b-65f38d245f73',
                        'narrative': 'Completion of SUAS Scholars (Drones) I CP (course 329900CW).',
                    },
                    'description': 'Grade 12 course, 1 credit(s).',
                    'fieldOfStudy': 'Career & Technical Education',
                    'humanCode': '329900CW',
                    'id': 'urn:uuid:fc1d163f-9d8b-4c96-9bc1-27d2b7a3d16f',
                    'inLanguage': 'en',
                    'name': 'SUAS Scholars (Drones) I CP',
                    'resultDescription': [
                        {
                            'id': 'urn:uuid:9f06267d-f593-43bc-9954-4851ff09bd7a',
                            'name': 'Course Grade',
                            'resultType': 'LetterGrade',
                            'type': ['ResultDescription'],
                        },
                        {
                            'id': 'urn:uuid:87e600e4-33bc-412a-b8f6-af7c52ec8319',
                            'name': 'Credits Earned',
                            'resultType': 'RawScore',
                            'type': ['ResultDescription'],
                        },
                    ],
                    'type': ['Achievement'],
                },
            ],
            'association': [
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:56dd53c6-a059-43e4-8d5b-855c78fafba2',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:4553365a-6fa0-41f9-813a-ca42af420029',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:b19e4007-baec-421a-8d3b-c65e0359333e',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:777a5bca-60b4-470f-92b1-dbc4247f616c',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:cbf5b1ac-b7c6-4344-b80c-48d6e061e697',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:bf1e5cd5-8490-455e-997a-d9e7d6df39e0',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:4bf88c03-c7a0-4fe8-a288-311b90519ff3',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:03c1951e-fae8-4879-87aa-6ac8a8893b4e',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:b32d49b0-5e88-44e0-876d-0998265fcf5d',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:a853514d-2c90-48d3-8f13-c146a27f054e',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:8cba094d-1d3a-452f-a9f4-bfa8899bb78b',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:06998632-1a55-41de-a93e-27b1d10964eb',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:94aae499-e45a-4e70-949a-f2245c50117f',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:ddb88c8a-6f58-48b1-b05d-3434e41addaf',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:edb0b659-8090-4755-86e3-c054cf51ddb6',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:4f4c2e8e-7375-465f-99fe-5c99ca9cf63d',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:19537621-3073-4cb7-81f9-fdc3f360391d',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:303a945f-a8e2-4eb3-8cd9-0df05ca88ce4',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:1208cb34-e9f2-44f6-9d6f-83db0b6d1417',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:da13c9fe-dcc1-499d-87d6-4d0847f6c0e4',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:3c71551f-6bf4-4801-ba57-4be84dcffda2',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:d0f4ddb4-6ea1-44e8-b908-7cf0441f703f',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:c84fd5bb-0fe2-4be7-84df-ea903d8f8324',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:65859218-0f27-4100-a7de-7e93ff1b771c',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:0de7bfa6-3fa2-46ad-b650-4ee77e07c2c4',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:16ac897d-4fe0-41dc-9bec-91025dfa84bd',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:5af992e1-2176-4f85-a80f-5b57dcc0dff9',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:bd2f71ec-839a-433f-91b0-18e2937d0ec1',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:7793cdaf-cfb0-4ae0-a1f8-e10e8c1f34eb',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:a79897d8-6210-4dfb-942d-c2fb97d86f88',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:cd343ac0-c587-4deb-9a20-d8e72697a14d',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:158393a6-3857-49fa-8722-25c8797a8170',
                    'type': 'Association',
                },
                {
                    'associationType': 'isParentOf',
                    'sourceId': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                    'targetId': 'urn:uuid:fc1d163f-9d8b-4c96-9bc1-27d2b7a3d16f',
                    'type': 'Association',
                },
            ],
            'id': 'did:example:student',
            'identifier': [
                {
                    'hashed': false,
                    'identityHash': 'John Doe',
                    'identityType': 'name',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': 'jdoe@students.demoisd.org',
                    'identityType': 'emailAddress',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': '123456789',
                    'identityType': 'ext:studentId',
                    'type': 'IdentityObject',
                },
                {
                    'hashed': false,
                    'identityHash': '2008-11-14',
                    'identityType': 'ext:dateOfBirth',
                    'type': 'IdentityObject',
                },
            ],
            'type': ['ClrSubject'],
            'verifiableCredential': [
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Diploma',
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'id': 'urn:uuid:d601ce2a-9b14-4128-8d37-e9a868d5d4a4',
                                'narrative':
                                    'Completion of all South Carolina high school graduation requirements.',
                            },
                            'description': 'South Carolina high school diploma.',
                            'id': 'urn:uuid:9fdecb29-832e-4cab-b6c8-518ba31e0a28',
                            'inLanguage': 'en',
                            'name': 'High School Diploma',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:13c80886-8341-4c54-93ac-7010303c2729',
                                    'name': 'Cumulative GPA',
                                    'resultType': 'GradePointAverage',
                                    'type': ['ResultDescription'],
                                    'valueMax': '4.0',
                                    'valueMin': '0.0',
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:b2b65f02-7ff1-4993-83f9-6c0ef5b283b8',
                                'resultDescription':
                                    'urn:uuid:13c80886-8341-4c54-93ac-7010303c2729',
                                'type': ['Result'],
                                'value': '3.36',
                            },
                        ],
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:b006e46e-2fec-41de-aace-e19b5aac472b',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'High School Diploma',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2028-06-05T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:a93adcee-c187-446f-8dbe-7cec48b6f6b6',
                                    'targetName': 'Cite Textual Evidence',
                                    'targetDescription':
                                        'Cite strong and thorough textual evidence to support analysis of what a text says explicitly.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:01ec90e2-ef7a-4a5d-87b8-c004f6595f7f',
                                    'targetName': 'Determine Theme',
                                    'targetDescription':
                                        'Determine a theme or central idea of a text and analyze its development over the course of the text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:d49f4695-8cf7-477f-80b6-e99c9bfedadd',
                                    'targetName': 'Write Arguments',
                                    'targetDescription':
                                        'Write arguments to support claims using valid reasoning and relevant, sufficient evidence.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:265297e1-a971-4b00-8718-cde85c3ff00c',
                                    'targetName': 'Command of Grammar and Usage',
                                    'targetDescription':
                                        'Demonstrate command of the conventions of standard English grammar and usage when writing.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.9-10.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:f826dcd5-5c7f-4d19-803b-780786af4f51',
                                    'targetName': 'Collaborative Discussions',
                                    'targetDescription':
                                        'Initiate and participate effectively in a range of collaborative discussions.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.9-10.1',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:67009378-2f39-4133-8b78-c6e5670ba173',
                                'narrative': 'Completion of English 1 CP FS (course 302411CW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'English Language Arts',
                            'humanCode': '302411CW',
                            'id': 'urn:uuid:56dd53c6-a059-43e4-8d5b-855c78fafba2',
                            'inLanguage': 'en',
                            'name': 'English 1 CP FS',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:4ae2b748-4dff-407f-b49e-48caa8633680',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:5c1542f6-332c-4abb-91e9-1ba2a9bc3275',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-12-20T00:00:00Z',
                        'activityStartDate': '2024-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:81d8b7aa-4389-4103-868a-bcf7c06c81a5',
                                'resultDescription':
                                    'urn:uuid:4ae2b748-4dff-407f-b49e-48caa8633680',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:fecc2308-057b-4340-8675-1d6c8235b203',
                                'resultDescription':
                                    'urn:uuid:5c1542f6-332c-4abb-91e9-1ba2a9bc3275',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:95cfe5d4-030c-495d-b69b-e2703b10a870',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'English 1 CP FS',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:f50c19b4-132c-4809-8064-39139650e79c',
                                    'targetName': 'Analyze Spatial Relationships',
                                    'targetDescription':
                                        'Use maps and other representations to explain relationships between the locations of places and regions.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Geo.1.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:906ae093-a862-4a0c-8893-e7ae4e5d5733',
                                    'targetName': 'Human-Environment Interaction',
                                    'targetDescription':
                                        'Analyze relationships and interactions within and between human and physical systems.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Geo.4.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:bd84bc85-6031-4458-8332-2ebda39ef4e7',
                                    'targetName': 'Geography and Historical Change',
                                    'targetDescription':
                                        'Analyze the reciprocal nature of how historical events and processes have shaped human and physical environments.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Geo.7.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:88ec017c-1b7c-4daf-8586-d33bd842d972',
                                    'targetName': 'Migration and Settlement Patterns',
                                    'targetDescription':
                                        'Evaluate the influence of long-term climate variability on human migration and settlement patterns.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Geo.11.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:5f37721f-e895-4556-8688-5349486b182b',
                                'narrative': 'Completion of World Geog H FS (course 331013HW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Social Studies',
                            'humanCode': '331013HW',
                            'id': 'urn:uuid:4553365a-6fa0-41f9-813a-ca42af420029',
                            'inLanguage': 'en',
                            'name': 'World Geog H FS',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:ca20b8da-3491-45a9-b34e-c283cf898eff',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:10e8e06f-f64d-49bc-ad79-16f45e9ec89b',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-12-20T00:00:00Z',
                        'activityStartDate': '2024-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:b216e59d-250b-41ab-820d-1dc44f29f78a',
                                'resultDescription':
                                    'urn:uuid:ca20b8da-3491-45a9-b34e-c283cf898eff',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:b1127d65-06fe-4195-8da4-345dbf06c35f',
                                'resultDescription':
                                    'urn:uuid:10e8e06f-f64d-49bc-ad79-16f45e9ec89b',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:02f6f34f-4ea8-4845-aaff-ff3ce2280a92',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'World Geog H FS',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:70a4ebe2-abbe-42e7-8602-2b555c6afab4',
                                    'targetName': 'Access an API to Retrieve Data',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to retrieve data for a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:54de493a-6593-490d-8dcf-15405f9d5ab4',
                                    'targetName': 'Adapt to Changing Requirements',
                                    'targetDescription':
                                        'Adapt to changing requirements through task or behavior adjustment.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:91681c12-06b1-415a-85e0-1e28b4af06b0',
                                    'targetName': 'Analyze Complex Problems',
                                    'targetDescription': 'Analyze a complex problem.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:ed006d12-408f-4016-81c5-ed52a07a6f8d',
                                    'targetName':
                                        'Differentiate Array and ArrayList Data Structures',
                                    'targetDescription':
                                        'Differentiate between Array and ArrayList data structures.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:45c68304-5b67-4efc-85bb-6718b6c6a34f',
                                    'targetName': 'Create Backend Applications',
                                    'targetDescription':
                                        'Create backend online applications using Node.js.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:beb85896-5f87-4e1e-8ab8-5cd7d7a826f7',
                                'narrative':
                                    'Completion of Fundamentals of Computing CP (course 502301CW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Computer Science',
                            'humanCode': '502301CW',
                            'id': 'urn:uuid:b19e4007-baec-421a-8d3b-c65e0359333e',
                            'inLanguage': 'en',
                            'name': 'Fundamentals of Computing CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:5da40141-4e92-4c8d-9883-9760646bc811',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:5f6ead58-ab1d-4bb0-9f4c-e4ae258b5d4c',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-12-20T00:00:00Z',
                        'activityStartDate': '2024-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:2f89f060-45d2-4ec7-8a8a-4fa128e58d78',
                                'resultDescription':
                                    'urn:uuid:5da40141-4e92-4c8d-9883-9760646bc811',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:228d05f7-2955-41d6-8e3d-ecffbf379dc1',
                                'resultDescription':
                                    'urn:uuid:5f6ead58-ab1d-4bb0-9f4c-e4ae258b5d4c',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:c62c99d0-15f1-4c26-b603-ca826bc41919',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Fundamentals of Computing CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:676607c4-ae58-4c00-8797-af8b400d638b',
                                    'targetName': 'Address Hacking Threats',
                                    'targetDescription':
                                        'Address hacking threats via physical hardware security, asset inventory, device, and patch management.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:d48ff1de-890f-4ed9-8fec-11e22a3a1a93',
                                    'targetName': 'Design Access and Physical Security Protocols',
                                    'targetDescription':
                                        'Design access and physical security protocols where users have only the access required to complete their assigned tasks.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:d70753a3-02dc-447d-80b2-7effd066c612',
                                    'targetName': 'Implement Advanced Security Technology',
                                    'targetDescription':
                                        'Implement advanced security technologies and tools to detect and prevent data loss and exposure.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6616c00f-3ea2-42cd-8c77-3b9a74a7f535',
                                    'targetName': 'Detect Adverse Events',
                                    'targetDescription':
                                        'Detect adverse events using cyber defense tools.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:45eb83b3-82ec-4b1e-883d-7cd636dbfee6',
                                    'targetName': 'Analyze Attack Trends',
                                    'targetDescription':
                                        'Analyze collected security data to determine attack trends in systems.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:4ed679dd-a7fe-46a1-882f-60f3df1f05ad',
                                'narrative':
                                    'Completion of Cybersecurity (PLTW) H (course 637803HW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Cybersecurity',
                            'humanCode': '637803HW',
                            'id': 'urn:uuid:777a5bca-60b4-470f-92b1-dbc4247f616c',
                            'inLanguage': 'en',
                            'name': 'Cybersecurity (PLTW) H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:098e12e6-87f1-44fb-9818-889a5542408c',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:d91ffe63-fa88-46ef-a75f-c596abf6ed91',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-12-20T00:00:00Z',
                        'activityStartDate': '2024-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:6d651b8e-8f3b-456d-8028-efa02228549f',
                                'resultDescription':
                                    'urn:uuid:098e12e6-87f1-44fb-9818-889a5542408c',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:feab7c42-c46d-4d3b-89a2-9f5efea527ed',
                                'resultDescription':
                                    'urn:uuid:d91ffe63-fa88-46ef-a75f-c596abf6ed91',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:3236d303-6861-43f1-b8c4-48122e3b3c58',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Cybersecurity (PLTW) H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:1f09f22d-db1f-4c87-8b21-febef3439ade',
                                    'targetName': 'Create Equations in One Variable',
                                    'targetDescription':
                                        'Create equations and inequalities in one variable and use them to solve problems.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-CED.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:2bb8a0a2-3b56-4668-857a-221f611a1a81',
                                    'targetName': 'Solve Linear Equations and Inequalities',
                                    'targetDescription':
                                        'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.B.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:58d583bf-4cca-466c-8907-80d58dc6ce00',
                                    'targetName': 'Interpret Expressions',
                                    'targetDescription':
                                        'Interpret expressions that represent a quantity in terms of its context.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-SSE.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6616baf8-94d5-41f8-8bc9-6cd55ba2936e',
                                    'targetName': 'Use Function Notation',
                                    'targetDescription':
                                        'Use function notation, evaluate functions for inputs in their domains.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.A.2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e786ccb0-e8c0-41bb-8a78-648ba83ac693',
                                    'targetName': 'Graph Equations in Two Variables',
                                    'targetDescription':
                                        'Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.D.10',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:5be047a5-8a6f-4499-8047-e9c6612244cf',
                                'narrative': 'Completion of Algebra 1 H (course 411423HW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Mathematics',
                            'humanCode': '411423HW',
                            'id': 'urn:uuid:cbf5b1ac-b7c6-4344-b80c-48d6e061e697',
                            'inLanguage': 'en',
                            'name': 'Algebra 1 H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:a7dee52d-d599-4e5b-941f-579c3b776088',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:51a2cfa8-2597-4e31-b24a-49d9cbd7ca24',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-06-02T00:00:00Z',
                        'activityStartDate': '2024-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:8bdb1b6b-8600-4287-8ca4-d9733db356bb',
                                'resultDescription':
                                    'urn:uuid:a7dee52d-d599-4e5b-941f-579c3b776088',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:0ec7df29-a3b1-43d0-82d9-e4f07b536e2d',
                                'resultDescription':
                                    'urn:uuid:51a2cfa8-2597-4e31-b24a-49d9cbd7ca24',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:6a0586fe-67e1-4fdd-849d-5014485a2640',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Algebra 1 H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:5b6dd9e1-26ed-4a08-88a5-54cd1d1f62b0',
                                    'targetName': 'Motor Skill Competency',
                                    'targetDescription':
                                        'Demonstrates competency in a variety of motor skills and movement patterns.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:c69c00d0-ca5c-4282-8ca2-8b190a9d541f',
                                    'targetName': 'Movement Concepts and Strategies',
                                    'targetDescription':
                                        'Applies knowledge of concepts, principles, strategies and tactics related to movement and performance.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:3278a568-af68-4373-8c5a-a0e8b126b277',
                                    'targetName': 'Health-Enhancing Fitness',
                                    'targetDescription':
                                        'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 3',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:29407abb-94c6-4383-8051-c1052b05e554',
                                'narrative': 'Completion of PE 1 CP (course 344102CW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Physical Education',
                            'humanCode': '344102CW',
                            'id': 'urn:uuid:bf1e5cd5-8490-455e-997a-d9e7d6df39e0',
                            'inLanguage': 'en',
                            'name': 'PE 1 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:210e4208-10f0-4152-8437-3e37a1901645',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:d1cf7a6a-cfad-4306-b4aa-cb6d2280a146',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-06-02T00:00:00Z',
                        'activityStartDate': '2024-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:3adcd422-0426-41ab-8b5a-5b99dda06bc5',
                                'resultDescription':
                                    'urn:uuid:210e4208-10f0-4152-8437-3e37a1901645',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:7a4f89b2-27cb-4c61-8125-6c01b3c30f86',
                                'resultDescription':
                                    'urn:uuid:d1cf7a6a-cfad-4306-b4aa-cb6d2280a146',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:adf27321-0ec7-4a6a-b7be-38a24ae16341',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'PE 1 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:75a1e2ac-e282-4695-8855-6e25c53f03b3',
                                    'targetName': 'Constitutions, Laws, and Agreements',
                                    'targetDescription':
                                        'Analyze the impact of constitutions, laws, treaties, and international agreements on the maintenance of national and international order.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.3.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:271d086f-f256-4350-888d-984caa790d65',
                                    'targetName': 'Civic Virtues Across Systems',
                                    'targetDescription':
                                        'Evaluate social and political systems in different contexts, times, and places that promote civic virtues and enact democratic principles.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.8.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:1d6794e9-3863-49d5-86fb-9e299da86e6c',
                                    'targetName': 'Using and Challenging Laws',
                                    'targetDescription':
                                        'Analyze how people use and challenge laws to address a variety of public issues.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.12.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:50080454-41dc-43f0-890e-7dfe177b87ad',
                                'narrative': 'Completion of Law Education CP (course 333612CW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Law',
                            'humanCode': '333612CW',
                            'id': 'urn:uuid:4bf88c03-c7a0-4fe8-a288-311b90519ff3',
                            'inLanguage': 'en',
                            'name': 'Law Education CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:e1e9ebb1-3caa-4218-bca5-6ccce93e3f47',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:4e8fcab8-a965-47e8-876e-0e53623d4821',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-06-02T00:00:00Z',
                        'activityStartDate': '2024-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:98fa0aa4-324f-4898-8cfe-aa8dde643a83',
                                'resultDescription':
                                    'urn:uuid:e1e9ebb1-3caa-4218-bca5-6ccce93e3f47',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:60e101e1-b646-4cca-8840-d20d5a008aac',
                                'resultDescription':
                                    'urn:uuid:4e8fcab8-a965-47e8-876e-0e53623d4821',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:7ff20cb8-6a45-41a2-b70a-9eb3e63c6e2c',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Law Education CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:77db7043-17a2-400e-82a1-1331fe6cbe50',
                                    'targetName': 'DNA and Protein Structure',
                                    'targetDescription':
                                        'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS1-1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:7aa12999-010d-4216-8d82-337948204958',
                                    'targetName': 'Hierarchical Organization of Organisms',
                                    'targetDescription':
                                        'Develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS1-2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:a0a8fb19-fc22-40c8-8ea9-842747651f1e',
                                    'targetName': 'Carrying Capacity of Ecosystems',
                                    'targetDescription':
                                        'Use mathematical and/or computational representations to support explanations of factors that affect carrying capacity of ecosystems.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS2-1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:154ebba3-f1ae-43bd-854f-2fdd2dfb5c68',
                                    'targetName': 'Factors Driving Evolution',
                                    'targetDescription':
                                        'Construct an explanation based on evidence that the process of evolution primarily results from four factors.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS4-2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:1ca089f6-5fcd-4557-85b8-e2eddc9589f4',
                                    'targetName': 'Cellular Division and Differentiation',
                                    'targetDescription':
                                        'Use a model to illustrate the role of cellular division and differentiation in producing and maintaining complex organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS1-4',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:2f35e86c-c9e6-4316-8ea9-cfa5d540f9a1',
                                'narrative': 'Completion of Biology 1 H FS (course 322113HW).',
                            },
                            'description': 'Grade 9 course, 1 credit(s).',
                            'fieldOfStudy': 'Science',
                            'humanCode': '322113HW',
                            'id': 'urn:uuid:03c1951e-fae8-4879-87aa-6ac8a8893b4e',
                            'inLanguage': 'en',
                            'name': 'Biology 1 H FS',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:0f7af524-d85b-454a-a65d-cf4bd4caca2a',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:bfdce2d3-4ef7-4c10-b8ee-d0c175c07929',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2024-06-02T00:00:00Z',
                        'activityStartDate': '2024-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:dbad31c2-d4cf-4c9e-8afe-83e702cb20c2',
                                'resultDescription':
                                    'urn:uuid:0f7af524-d85b-454a-a65d-cf4bd4caca2a',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:2b4141eb-b693-4d63-83d7-db430a116618',
                                'resultDescription':
                                    'urn:uuid:bfdce2d3-4ef7-4c10-b8ee-d0c175c07929',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2024',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:e335d350-1cc5-48e6-8371-51cf7a68a40e',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Biology 1 H FS',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2024-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3135ed91-c47f-4021-8a8c-ca830b4d68d7',
                                    'targetName': 'Periodic Table and Electron Patterns',
                                    'targetDescription':
                                        'Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-PS1-1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:a40b7e66-9bc3-4e49-8059-f6098bf5b193',
                                    'targetName': 'Explain Chemical Reaction Outcomes',
                                    'targetDescription':
                                        'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-PS1-2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:ceb9833a-8548-4eec-83f4-3d295e4d2ea7',
                                    'targetName': 'Model Energy in Chemical Reactions',
                                    'targetDescription':
                                        'Develop a model to illustrate that the release or absorption of energy from a chemical reaction system depends on the changes in total bond energy.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-PS1-4',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:12b071a8-e9b0-4eb8-853f-0ecb6be25be8',
                                    'targetName': 'Conservation of Mass',
                                    'targetDescription':
                                        'Use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-PS1-7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:1f50acaf-f52c-4379-8cd9-535c1adb382a',
                                    'targetName': 'Factors Affecting Reaction Rate',
                                    'targetDescription':
                                        'Apply scientific principles and evidence to provide an explanation about the effects of changing temperature or concentration on reaction rate.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-PS1-5',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:a5d045e8-7b33-460c-877b-9b81af9c4780',
                                'narrative': 'Completion of Chemistry 1 CP (course 323102CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Science',
                            'humanCode': '323102CW',
                            'id': 'urn:uuid:b32d49b0-5e88-44e0-876d-0998265fcf5d',
                            'inLanguage': 'en',
                            'name': 'Chemistry 1 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:88156d11-f7aa-4dbb-9651-0050d39c0aa9',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:187ec610-03db-4062-a406-4d4af953594c',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-12-20T00:00:00Z',
                        'activityStartDate': '2025-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:481f4aaa-d21b-42de-8430-9ab250244c75',
                                'resultDescription':
                                    'urn:uuid:88156d11-f7aa-4dbb-9651-0050d39c0aa9',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:e5d76d95-497d-46ef-8108-483993d16c64',
                                'resultDescription':
                                    'urn:uuid:187ec610-03db-4062-a406-4d4af953594c',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:e42e6536-c1ad-43b3-a747-80bf53d3ab03',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Chemistry 1 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3278a568-af68-4373-8c5a-a0e8b126b277',
                                    'targetName': 'Health-Enhancing Fitness',
                                    'targetDescription':
                                        'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:9dd43e99-bd17-42d1-8b80-f9c39bce196a',
                                    'targetName': 'Personal and Social Responsibility',
                                    'targetDescription':
                                        'Exhibits responsible personal and social behavior that respects self and others.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 4',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6993602b-7452-48dd-8f19-62a31ae871d8',
                                    'targetName': 'Value of Physical Activity',
                                    'targetDescription':
                                        'Recognizes the value of physical activity for health, enjoyment, challenge, self-expression, and/or social interaction.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 5',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:99e88c3a-0cc7-4e25-8a5e-7c3718fe3503',
                                'narrative': 'Completion of PE 2 CP (course 344200CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Physical Education',
                            'humanCode': '344200CW',
                            'id': 'urn:uuid:a853514d-2c90-48d3-8f13-c146a27f054e',
                            'inLanguage': 'en',
                            'name': 'PE 2 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:5317a828-76df-42df-8e08-67ed2eb209f2',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:79a87716-1cf7-4ccf-9d93-681dc39e0118',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-12-20T00:00:00Z',
                        'activityStartDate': '2025-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:6ce30b6c-a752-4311-8261-19dced295be4',
                                'resultDescription':
                                    'urn:uuid:5317a828-76df-42df-8e08-67ed2eb209f2',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:55edb143-035b-4575-88be-246f3c18cbf9',
                                'resultDescription':
                                    'urn:uuid:79a87716-1cf7-4ccf-9d93-681dc39e0118',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:6e93e7e6-7347-4981-bcb7-ac8c40bcfa27',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'PE 2 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:37cd5a54-5f2c-4b5e-84c1-61b207588e7b',
                                    'targetName': 'Analyze Character Development',
                                    'targetDescription':
                                        'Analyze how complex characters develop over the course of a text, interact with other characters, and advance the plot.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:b3d5f6c6-d540-4bf1-8cb8-24462bb008bf',
                                    'targetName': "Analyze Author's Point of View",
                                    'targetDescription':
                                        "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric.",
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.9-10.6',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:1b994ee3-583c-458c-8f3b-a76afde7d368',
                                    'targetName': 'Write Narratives',
                                    'targetDescription':
                                        'Write narratives to develop real or imagined experiences using effective technique and well-structured event sequences.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:ac876fba-525d-4754-856b-893e04e735c3',
                                    'targetName': 'Understand Figurative Language',
                                    'targetDescription':
                                        'Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.9-10.5',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e7847ba1-c5ad-4d2f-8c83-ef2350bdecd3',
                                    'targetName': 'Draw Evidence From Texts',
                                    'targetDescription':
                                        'Draw evidence from literary or informational texts to support analysis, reflection, and research.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.9',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:5c67a4fd-9e62-497f-8051-a998123600c6',
                                'narrative': 'Completion of English 2 CP (course 302501CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'English Language Arts',
                            'humanCode': '302501CW',
                            'id': 'urn:uuid:8cba094d-1d3a-452f-a9f4-bfa8899bb78b',
                            'inLanguage': 'en',
                            'name': 'English 2 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:34837572-f67b-4834-a916-25007ab148be',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:d4bb68fb-293c-4972-9b9e-12432558293b',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-12-20T00:00:00Z',
                        'activityStartDate': '2025-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:266f5fce-886d-420c-8f35-8249ea3a3ec4',
                                'resultDescription':
                                    'urn:uuid:34837572-f67b-4834-a916-25007ab148be',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:8e4fa20e-59e4-4638-8700-303af2c83250',
                                'resultDescription':
                                    'urn:uuid:d4bb68fb-293c-4972-9b9e-12432558293b',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:edccff24-a272-4b0d-9965-99d45738886e',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'English 2 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:b9f81679-447c-4d43-83a0-86ab8e22db6f',
                                    'targetName': 'Define Geometric Terms',
                                    'targetDescription':
                                        'Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:8491276d-8b6c-475a-8903-24e1f90bde5e',
                                    'targetName': 'Prove Triangle Congruence',
                                    'targetDescription':
                                        'Use the definition of congruence in terms of rigid motions to show two triangles are congruent.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.B.7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e551ae7e-6fd9-41d9-88b0-de9da5b48ffc',
                                    'targetName': 'Similarity and Congruence Criteria',
                                    'targetDescription':
                                        'Use congruence and similarity criteria for triangles to solve problems and prove relationships in geometric figures.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-SRT.B.5',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6912a8e6-2ddb-4f48-8abe-f44c8872e598',
                                    'targetName': 'Coordinate Geometry: Perimeter and Area',
                                    'targetDescription':
                                        'Use coordinates to compute perimeters of polygons and areas of triangles and rectangles.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-GPE.B.7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:cd99dc31-a29f-48d0-8cce-1637f5441c39',
                                    'targetName': 'Inscribed Angle and Circle Relationships',
                                    'targetDescription':
                                        'Identify and describe relationships among inscribed angles, radii, and chords.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-C.A.2',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:9129a7b5-7452-495d-857d-3742402d237e',
                                'narrative': 'Completion of Geometry H (course 412213HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Mathematics',
                            'humanCode': '412213HW',
                            'id': 'urn:uuid:06998632-1a55-41de-a93e-27b1d10964eb',
                            'inLanguage': 'en',
                            'name': 'Geometry H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:c4d357cc-1c18-4af0-9ad6-121cb43b5ffd',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:9b8d8d5d-2668-4fc4-adbc-a9086d04977e',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-12-20T00:00:00Z',
                        'activityStartDate': '2025-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:aed18d88-896c-4b0e-8bfb-b8ced660d777',
                                'resultDescription':
                                    'urn:uuid:c4d357cc-1c18-4af0-9ad6-121cb43b5ffd',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:bdfb2e4b-9d69-474b-8365-08e9b3a93dd4',
                                'resultDescription':
                                    'urn:uuid:9b8d8d5d-2668-4fc4-adbc-a9086d04977e',
                                'type': ['Result'],
                                'value': '0',
                            },
                        ],
                        'term': 'Fall 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:722106f5-35ba-44f8-8aed-396f39180c51',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Geometry H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3bbbe697-b269-401f-8a48-56e89b57bf47',
                                    'targetName': 'Historical Context of Events',
                                    'targetDescription':
                                        'Evaluate how historical events and developments were shaped by unique circumstances of time and place.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.1.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:34f66dfb-8d4e-4398-86ad-260ecac6f320',
                                    'targetName': 'Generate Historical Questions',
                                    'targetDescription':
                                        'Use questions generated about multiple historical sources to pursue further investigation.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.3.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:804d32e7-5f53-4d00-8565-d037f34939a3',
                                    'targetName': 'Analyze Causes and Effects',
                                    'targetDescription':
                                        'Analyze multiple and complex causes and effects of events in the past.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.14.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:13e2398b-c79a-4c1f-8fe8-a89967c31cb3',
                                    'targetName': 'Construct Historical Arguments',
                                    'targetDescription':
                                        'Integrate evidence from multiple relevant historical sources and interpretations into a reasoned argument.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.16.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:8121db9a-3678-4bf8-8fb0-d9606e4f63f2',
                                'narrative':
                                    'Completion of Modern World History H (course 330600HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Social Studies',
                            'humanCode': '330600HW',
                            'id': 'urn:uuid:94aae499-e45a-4e70-949a-f2245c50117f',
                            'inLanguage': 'en',
                            'name': 'Modern World History H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:7c524d10-788e-4900-9b07-c3ba74fad6a1',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:f5fec68d-2624-4ffc-893a-68a756867829',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-06-02T00:00:00Z',
                        'activityStartDate': '2025-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:c737a4f8-66f6-4c53-8e2d-964333ffc35e',
                                'resultDescription':
                                    'urn:uuid:7c524d10-788e-4900-9b07-c3ba74fad6a1',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:2bd230b6-ec1f-4c59-8237-24ae2672fde3',
                                'resultDescription':
                                    'urn:uuid:f5fec68d-2624-4ffc-893a-68a756867829',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:9919be62-a364-4ddb-abb1-e30a65f4bcc0',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Modern World History H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:03bcebbe-3ab6-4108-8f7c-d135309a18bd',
                                    'targetName': 'Cultural Practices and Perspectives',
                                    'targetDescription':
                                        'Demonstrate an understanding of the relationship between the practices and perspectives of the culture studied.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 2.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:f44df939-32cd-4c0f-8b1e-1c3f5b1ee0df',
                                    'targetName': 'Cultural Products and Perspectives',
                                    'targetDescription':
                                        'Demonstrate an understanding of the relationship between the products and perspectives of the culture studied.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 2.2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:9895e453-3a5e-40fb-89ae-ec70d2301996',
                                    'targetName': 'Making Interdisciplinary Connections',
                                    'targetDescription':
                                        'Use the language to reinforce and further knowledge of other disciplines.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 3.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:70ab5dff-eba4-44c5-8bf0-c99c483db568',
                                    'targetName': 'Language Use Beyond the Classroom',
                                    'targetDescription':
                                        'Use the language both within and beyond the school setting.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 5.1',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:6db00b51-56c8-4d59-8bf2-1db715193035',
                                'narrative': 'Completion of Spanish 2 CP (course 365202CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'World Languages',
                            'humanCode': '365202CW',
                            'id': 'urn:uuid:ddb88c8a-6f58-48b1-b05d-3434e41addaf',
                            'inLanguage': 'en',
                            'name': 'Spanish 2 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:cb4df6ee-28fc-4dc9-b527-dbc5852efdd2',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:110f4e7b-264c-4b73-a072-c77d55739d3c',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-06-02T00:00:00Z',
                        'activityStartDate': '2025-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:c724c7c5-8d1b-4a7b-81c8-9a35dff7b8e1',
                                'resultDescription':
                                    'urn:uuid:cb4df6ee-28fc-4dc9-b527-dbc5852efdd2',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:1f709f44-3fd4-434a-861e-36f05b025cd4',
                                'resultDescription':
                                    'urn:uuid:110f4e7b-264c-4b73-a072-c77d55739d3c',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:598c828b-dc6d-4a3e-89dd-5ed339c93bc8',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Spanish 2 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3b05a996-8229-403b-8227-5ae4e65cc0f2',
                                    'targetName': 'Interpersonal Communication',
                                    'targetDescription':
                                        'Engage in conversations, provide and obtain information, express feelings and emotions, and exchange opinions.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 1.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:4fc53448-6933-4d1d-82d3-21d6f51a279c',
                                    'targetName': 'Interpretive Communication',
                                    'targetDescription':
                                        'Understand and interpret spoken and written language on a variety of topics.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 1.2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:c59cbd91-0fd1-4d2a-86a8-5de85b9b110b',
                                    'targetName': 'Presentational Communication',
                                    'targetDescription':
                                        'Present information, concepts, and ideas to an audience of listeners or readers on a variety of topics.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 1.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:10bc9245-f76b-45f7-8537-d2ef8cf85140',
                                    'targetName': 'Comparing Language Structures',
                                    'targetDescription':
                                        'Demonstrate understanding of the nature of language through comparisons of the language studied and their own.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Standard 4.1',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:b0a59254-f874-48e6-87d4-17f5b9a1ac8e',
                                'narrative': 'Completion of Spanish 1 CP (course 365102CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'World Languages',
                            'humanCode': '365102CW',
                            'id': 'urn:uuid:edb0b659-8090-4755-86e3-c054cf51ddb6',
                            'inLanguage': 'en',
                            'name': 'Spanish 1 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:79641812-076f-4f48-b827-4a0be23e5614',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:fe02b631-096c-43c1-b289-28722750f5f2',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-06-02T00:00:00Z',
                        'activityStartDate': '2025-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:110ccdf7-740b-41eb-8e27-57b5c21153f3',
                                'resultDescription':
                                    'urn:uuid:79641812-076f-4f48-b827-4a0be23e5614',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:42762acc-b388-44e7-8933-1478286afaa8',
                                'resultDescription':
                                    'urn:uuid:fe02b631-096c-43c1-b289-28722750f5f2',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:4a0670b7-236c-49b3-bc60-6f8e874908b5',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Spanish 1 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:4c453d93-663a-4367-8c37-8b25aa99720a',
                                    'targetName': 'DNA and Chromosomes in Inheritance',
                                    'targetDescription':
                                        'Ask questions to clarify relationships about the role of DNA and chromosomes in coding instructions for characteristic traits.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS3-1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:cfca0c9e-d297-433e-8fb6-9c17dbfe136d',
                                    'targetName': 'Sources of Genetic Variation',
                                    'targetDescription':
                                        'Make and defend a claim based on evidence that inheritable genetic variations may result from new genetic combinations, mutation, or environmental factors.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS3-2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:aa1262cf-158a-4ac6-8df7-9d187585c69a',
                                    'targetName': 'Ecosystem Stability Evidence',
                                    'targetDescription':
                                        'Evaluate claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS2-6',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:b914f632-5b9f-4cde-83bd-45fcbf1f3ecb',
                                    'targetName': 'Design Solutions to Reduce Human Impact',
                                    'targetDescription':
                                        'Design, evaluate, and refine a solution for reducing the impacts of human activities on the environment.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS2-7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:136662b2-79fa-444a-8900-cea0702d94c6',
                                    'targetName': 'Natural Selection and Adaptation',
                                    'targetDescription':
                                        'Construct an explanation based on evidence for how natural selection leads to adaptation of populations.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'HS-LS4-4',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:c0127948-21bc-4822-8d91-604d98b263a1',
                                'narrative': 'Completion of Biology 2 H (course 322203HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Science',
                            'humanCode': '322203HW',
                            'id': 'urn:uuid:4f4c2e8e-7375-465f-99fe-5c99ca9cf63d',
                            'inLanguage': 'en',
                            'name': 'Biology 2 H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:59b8492f-2126-46de-bf90-543ea15000f0',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:b2105180-63a8-49e2-8ace-5e406c3b98f5',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2025-06-02T00:00:00Z',
                        'activityStartDate': '2025-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:e37e4ba8-35c0-48c3-89a8-0dd23feb98a8',
                                'resultDescription':
                                    'urn:uuid:59b8492f-2126-46de-bf90-543ea15000f0',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:f1c1cf57-170f-4c93-85b6-1581b9e7b2bf',
                                'resultDescription':
                                    'urn:uuid:b2105180-63a8-49e2-8ace-5e406c3b98f5',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2025',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:6d79c9a6-2081-483f-84e1-b6424b4fb365',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Biology 2 H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2025-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:8c3ff364-c2dd-44b2-8532-fd73f5c93742',
                                    'targetName': 'Change and Continuity in Eras',
                                    'targetDescription':
                                        'Analyze change and continuity in historical eras.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.2.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:438f86ee-2907-4c71-8029-dbabec2b7997',
                                    'targetName': 'Historical Context and Perspective',
                                    'targetDescription':
                                        "Analyze how historical contexts shaped and continue to shape people's perspectives.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.5.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:9be196ca-464a-46c9-8a8a-dd1144025a56',
                                    'targetName': 'Sources and Interpretations',
                                    'targetDescription':
                                        'Analyze the relationship between historical sources and the secondary interpretations made from them.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.His.12.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:b5127570-7341-423b-8649-de859845ecdf',
                                    'targetName': 'Analyzing the Use of Power',
                                    'targetDescription':
                                        'Analyze the impact and the appropriate use of power in the United States and other nations.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.10.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:c255c6f7-eef1-47c0-8a8d-cd51b5260c9a',
                                'narrative': 'Completion of US History H (course 332003HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Social Studies',
                            'humanCode': '332003HW',
                            'id': 'urn:uuid:19537621-3073-4cb7-81f9-fdc3f360391d',
                            'inLanguage': 'en',
                            'name': 'US History H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:076caf2e-cd87-4ae1-89f7-1a15c03c6a21',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:eb637579-811e-41ad-b50c-4dcd7cb56b34',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-12-20T00:00:00Z',
                        'activityStartDate': '2026-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:77cbe65f-d8b9-420d-8737-b7884745a079',
                                'resultDescription':
                                    'urn:uuid:076caf2e-cd87-4ae1-89f7-1a15c03c6a21',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:beb372cf-4427-48cb-81ca-9dfad385a324',
                                'resultDescription':
                                    'urn:uuid:eb637579-811e-41ad-b50c-4dcd7cb56b34',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:38677d43-2e99-47d4-91a9-ea30a944fef6',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'US History H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:369aad04-5433-424f-87c7-9205930fe393',
                                    'targetName': 'Identify Application Development Software',
                                    'targetDescription':
                                        'Identify appropriate software for developing web, desktop, or mobile applications.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e6c96fe8-23f3-4ed3-8713-83230e74e8fe',
                                    'targetName': 'Create Client-Server Systems',
                                    'targetDescription':
                                        'Create client-server systems using object-oriented programming.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:04ff8613-d59a-4ea9-8aec-95e6a93052d3',
                                    'targetName': 'Track and Address Bug Fixes',
                                    'targetDescription': 'Track and address bug fixes.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:75bf0633-f948-44c7-83d7-12dd8be1288c',
                                    'targetName': 'Identify Software Design Requirements',
                                    'targetDescription':
                                        'Identify business requirements for software design.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:b74eca04-b90b-4f29-8ce1-97c16d963d21',
                                    'targetName': 'Collaborative Troubleshooting',
                                    'targetDescription':
                                        'Collaborate on troubleshooting software problems.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:f416a895-eb4b-40f1-8c3c-c745c1b86d99',
                                'narrative':
                                    'Completion of Video Game Design-CP (Non CTE) (course 389903CW).',
                            },
                            'description': 'Grade 11 course, 1 credit(s).',
                            'fieldOfStudy': 'Computer Science',
                            'humanCode': '389903CW',
                            'id': 'urn:uuid:303a945f-a8e2-4eb3-8cd9-0df05ca88ce4',
                            'inLanguage': 'en',
                            'name': 'Video Game Design-CP (Non CTE)',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:83b950d8-57c7-4323-864b-880ebd4f985c',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:84b50fce-88e9-4f6d-b2ba-0bd33faabf80',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-12-20T00:00:00Z',
                        'activityStartDate': '2026-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:09fd11ad-3bf4-4def-8e71-c66e2b21df24',
                                'resultDescription':
                                    'urn:uuid:83b950d8-57c7-4323-864b-880ebd4f985c',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:27d449a2-639e-423e-87a8-ada7b30be24d',
                                'resultDescription':
                                    'urn:uuid:84b50fce-88e9-4f6d-b2ba-0bd33faabf80',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:e3b521f8-1469-4358-b2cb-8908049b0992',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Video Game Design-CP (Non CTE)',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:97f3b56a-0ce0-4ab7-8e68-1f77eb8e4c4a',
                                    'targetName': 'Zeros of Polynomials',
                                    'targetDescription':
                                        'Identify zeros of polynomials and use the zeros to construct a rough graph of the function.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-APR.B.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:ae13b4aa-c498-4f4d-8e59-38e1fbb48be5',
                                    'targetName': 'Graph Polynomial Functions',
                                    'targetDescription':
                                        'Graph polynomial functions, identifying zeros when suitable factorizations are available.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.C.7C',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:33efc0c4-f29b-47a5-86c7-29069455a737',
                                    'targetName': 'Describe Events as Sample Spaces',
                                    'targetDescription':
                                        'Describe events as subsets of a sample space using characteristics of the outcomes.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:974ff8f0-39e8-4a7a-807e-c2b338aebb57',
                                    'targetName': 'Permutations and Combinations',
                                    'targetDescription':
                                        'Use permutations and combinations to compute probabilities of compound events.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.B.9',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:72dd7963-a562-4c3d-8137-5bf72bdef779',
                                    'targetName': 'Solve Rational and Radical Equations',
                                    'targetDescription':
                                        'Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.A.2',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:6d598347-dfb4-4d72-88f1-bf55806c57f3',
                                'narrative':
                                    'Completion of Algebra 2 with Probability (course 411501CW).',
                            },
                            'description': 'Grade 11 course, 1 credit(s).',
                            'fieldOfStudy': 'Mathematics',
                            'humanCode': '411501CW',
                            'id': 'urn:uuid:1208cb34-e9f2-44f6-9d6f-83db0b6d1417',
                            'inLanguage': 'en',
                            'name': 'Algebra 2 with Probability',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:893ca7a8-03be-4720-8026-17eeb83266fd',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:c1db2dad-5d38-4b3a-9e2f-d0f85c700a4d',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-12-20T00:00:00Z',
                        'activityStartDate': '2026-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:83db1c9e-7260-4d10-84ca-bda6bfe76d99',
                                'resultDescription':
                                    'urn:uuid:893ca7a8-03be-4720-8026-17eeb83266fd',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:8de50f61-03b9-478b-8553-309ef633277e',
                                'resultDescription':
                                    'urn:uuid:c1db2dad-5d38-4b3a-9e2f-d0f85c700a4d',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:7b20abb9-438a-45aa-8aff-7c534649143e',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Algebra 2 with Probability',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:95e0d68f-6ba1-4082-80ec-25096c2111b7',
                                    'targetName': 'Geometric Modeling',
                                    'targetDescription':
                                        'Use geometric shapes, their measures, and their properties to describe objects.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-MG.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:f13b9577-ebbb-4473-8572-30804c4f6e0f',
                                    'targetName': 'Volume Formulas',
                                    'targetDescription':
                                        'Use volume formulas for cylinders, pyramids, cones, and spheres to solve problems.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-GMD.A.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:7de392d8-b334-4044-84c7-ca2a02c2a0e3',
                                    'targetName': 'Represent Data with Plots',
                                    'targetDescription':
                                        'Represent data with plots on the real number line (dot plots, histograms, and box plots).',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:f461fe76-0a49-40be-86c9-43a8aa091f59',
                                    'targetName': 'Summarize Two-Variable Data',
                                    'targetDescription':
                                        'Represent data on two quantitative variables on a scatter plot, and describe how the variables are related.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.B.6',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:55cc496e-502d-4502-8265-6a3c1b83dc36',
                                    'targetName': 'Fit Data to a Normal Distribution',
                                    'targetDescription':
                                        'Use the mean and standard deviation of a data set to fit it to a normal distribution.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.4',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:67abfd6e-584f-40f9-86ae-b4e9776c3717',
                                'narrative':
                                    'Completion of Geometry with Statistics CP (course 412203CW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Mathematics',
                            'humanCode': '412203CW',
                            'id': 'urn:uuid:da13c9fe-dcc1-499d-87d6-4d0847f6c0e4',
                            'inLanguage': 'en',
                            'name': 'Geometry with Statistics CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:a724f76a-0b47-499b-ab47-3ba658bc401c',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:eb13485b-ae3e-4324-a5cd-be1c438dfcc9',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-12-20T00:00:00Z',
                        'activityStartDate': '2026-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:53fc010b-c5b6-41d4-8273-8fd257e3c04b',
                                'resultDescription':
                                    'urn:uuid:a724f76a-0b47-499b-ab47-3ba658bc401c',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:1af7f38c-9be2-4a17-8db2-ddbe598c541f',
                                'resultDescription':
                                    'urn:uuid:eb13485b-ae3e-4324-a5cd-be1c438dfcc9',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:be14202c-d884-4139-863a-190015850627',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Geometry with Statistics CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:29a7ae55-c48c-450d-83b5-33289e570739',
                                    'targetName': 'Analyze Theme Development',
                                    'targetDescription':
                                        'Determine two or more themes or central ideas of a text and analyze their development over the course of the text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.2',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:eb2d5d4f-8c47-4f5e-874f-631d602e6ad8',
                                    'targetName': 'Integrate Multiple Sources',
                                    'targetDescription':
                                        'Integrate and evaluate multiple sources of information presented in different media or formats.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:4822908f-b044-429c-80a9-a76220069566',
                                    'targetName': 'Write Arguments with Sufficient Evidence',
                                    'targetDescription':
                                        'Write arguments to support claims using valid reasoning and sufficient evidence.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:756d8112-99fa-4462-8987-0c4d92f103ba',
                                    'targetName': 'Present Findings Clearly',
                                    'targetDescription':
                                        'Present information, findings, and supporting evidence clearly, concisely, and logically.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.4',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:0b5cb301-97b4-4d79-8c4e-84e893762c64',
                                    'targetName': 'Apply Knowledge of Language',
                                    'targetDescription':
                                        'Apply knowledge of language to understand how language functions in different contexts.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.11-12.3',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:de9f157c-4213-4cda-845d-f0fc9cfd0c3c',
                                'narrative': 'Completion of English 3 CP (course 302601CW).',
                            },
                            'description': 'Grade 11 course, 1 credit(s).',
                            'fieldOfStudy': 'English Language Arts',
                            'humanCode': '302601CW',
                            'id': 'urn:uuid:3c71551f-6bf4-4801-ba57-4be84dcffda2',
                            'inLanguage': 'en',
                            'name': 'English 3 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:c7157447-ed74-4882-b6d1-4cb94f25410b',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:959da9f6-5596-4469-94e8-0ddeeb58ea0b',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-06-02T00:00:00Z',
                        'activityStartDate': '2026-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:e2056efa-acea-4a60-8108-336991c59b97',
                                'resultDescription':
                                    'urn:uuid:c7157447-ed74-4882-b6d1-4cb94f25410b',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:2fa1a84a-79ea-443a-8ca1-21cb67d139a2',
                                'resultDescription':
                                    'urn:uuid:959da9f6-5596-4469-94e8-0ddeeb58ea0b',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:670e8781-8128-4a87-8fed-8d44a9a33415',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'English 3 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:1eda38ae-723a-46ad-8a79-c52d7316307b',
                                    'targetName': 'Analyze Market Trends',
                                    'targetDescription':
                                        'Analyze market trends, competitor activities and customer needs to develop business plans and proposals.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:3aeb1ac2-d905-41a2-8b6c-ef285d5d15c0',
                                    'targetName': 'Build Relationships With Investors',
                                    'targetDescription': 'Build relationships with investors.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:17472cf7-c449-48d2-8e66-4e530eafa826',
                                    'targetName': 'Build Customer Loyalty',
                                    'targetDescription': 'Build customer loyalty.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:1731e319-94a5-4c80-8a8e-b78627d252d3',
                                    'targetName': 'Manage Business Cash Flow',
                                    'targetDescription': 'Manage cash flow in a business.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:336f28b3-5029-4900-8acb-fab6c16f96e0',
                                    'targetName': 'Build Business Relationships',
                                    'targetDescription': 'Build business relationships.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:56064dcb-6308-4b9f-8214-c40c6b5dd475',
                                'narrative': 'Completion of Entrepreneurship (course 540002CW).',
                            },
                            'description': 'Grade 11 course, 1 credit(s).',
                            'fieldOfStudy': 'Business',
                            'humanCode': '540002CW',
                            'id': 'urn:uuid:d0f4ddb4-6ea1-44e8-b908-7cf0441f703f',
                            'inLanguage': 'en',
                            'name': 'Entrepreneurship',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:a35b5993-e54e-4f59-a20a-34fb48fc06a3',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:475c1db0-f3f8-42d8-8a27-937608a80535',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-06-02T00:00:00Z',
                        'activityStartDate': '2026-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:f91ae6a2-3564-41b5-820d-919359f5208b',
                                'resultDescription':
                                    'urn:uuid:a35b5993-e54e-4f59-a20a-34fb48fc06a3',
                                'type': ['Result'],
                                'value': 'BC',
                            },
                            {
                                'id': 'urn:uuid:82177685-e34d-4149-8bb1-5e4df7d35d28',
                                'resultDescription':
                                    'urn:uuid:475c1db0-f3f8-42d8-8a27-937608a80535',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:e3f27c78-7045-457c-a5a8-4ab83b9ca05a',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Entrepreneurship',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:89624975-6bab-445e-8afe-aa30468267e8',
                                    'targetName': 'Apply Design Principles',
                                    'targetDescription':
                                        'Apply knowledge of design principles and best practices to create visually cohesive and aesthetically pleasing designs using digital tools.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:2feb99eb-35fd-4556-8db7-a0edcd1c0e17',
                                    'targetName': 'Demonstrate Empathy for Users',
                                    'targetDescription':
                                        'Demonstrate empathy for users to inform solutions to design problems.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:85f7f357-dd2c-4d1e-807a-273ccda944ad',
                                    'targetName': 'Apply Design Thinking Methodologies',
                                    'targetDescription':
                                        'Apply design thinking methodologies to develop innovative solutions.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:a8b03a7b-a62e-4392-825c-dc96fbab04ec',
                                    'targetName': 'Create Low-Fidelity Prototypes',
                                    'targetDescription': 'Create a low-fidelity prototype.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:350690ad-9af7-44b9-80d7-55afa373078c',
                                    'targetName': 'Conduct User Research',
                                    'targetDescription':
                                        "Conduct user research to understand target audiences' preferences and behaviors.",
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:09ed90b8-4ea7-4eee-8cc1-a73d1f11a997',
                                'narrative':
                                    'Completion of Digital Art and Design 1 H (course 612001HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Art & Design',
                            'humanCode': '612001HW',
                            'id': 'urn:uuid:c84fd5bb-0fe2-4be7-84df-ea903d8f8324',
                            'inLanguage': 'en',
                            'name': 'Digital Art and Design 1 H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:9d7f8e42-713d-46c3-8287-baf80ccaedde',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:1b09c4ba-ad35-4412-90cd-50cff6cb6910',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-06-02T00:00:00Z',
                        'activityStartDate': '2026-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:ff0fc1aa-f53b-4b25-857c-ce4a59716162',
                                'resultDescription':
                                    'urn:uuid:9d7f8e42-713d-46c3-8287-baf80ccaedde',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:44c8da03-5066-4ef8-8c26-82c680c1065a',
                                'resultDescription':
                                    'urn:uuid:1b09c4ba-ad35-4412-90cd-50cff6cb6910',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:2665581e-f472-48a6-9a61-24a37e0d3f97',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Digital Art and Design 1 H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3312283a-5698-4ff6-87ca-8296eed30383',
                                    'targetName': 'Create Intuitive Interfaces',
                                    'targetDescription':
                                        'Create intuitive and user-friendly interfaces that align with business goals and target audience expectations.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e1186a2b-e4b5-4958-80fe-ea3b4ea2a159',
                                    'targetName': 'Leverage Prototyping Tools',
                                    'targetDescription':
                                        'Leverage prototyping tools to create interactive digital prototypes and mockups.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:5d18d7ed-c1de-463b-8d00-5915a17e49a0',
                                    'targetName': 'Develop a Prototype Strategy',
                                    'targetDescription':
                                        'Identify inputs for a prototype strategy.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:32a14eca-2700-4108-8d0f-1dd867750567',
                                    'targetName': 'Test Prototypes Against Requirements',
                                    'targetDescription':
                                        'Test a prototype against defined product requirements.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:e23ad154-d88c-45ef-80eb-dbfaf6ed2b09',
                                    'targetName': 'Product Design Strategy',
                                    'targetDescription':
                                        'Identify the optimal approach to introduce a new product into the marketplace.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:2be14f4c-cd12-4e4e-879f-3f0d88925ef1',
                                'narrative':
                                    'Completion of Digital Art and Design 2 H (course 612101HW).',
                            },
                            'description': 'Grade 10 course, 1 credit(s).',
                            'fieldOfStudy': 'Art & Design',
                            'humanCode': '612101HW',
                            'id': 'urn:uuid:65859218-0f27-4100-a7de-7e93ff1b771c',
                            'inLanguage': 'en',
                            'name': 'Digital Art and Design 2 H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:bc7cbddd-0a87-45d0-a778-2fad084f964b',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:48f7f5f5-443a-4fc4-bcf1-0b8959839773',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-06-02T00:00:00Z',
                        'activityStartDate': '2026-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:05dee84a-06df-43d0-80ba-a30269cd1fb4',
                                'resultDescription':
                                    'urn:uuid:bc7cbddd-0a87-45d0-a778-2fad084f964b',
                                'type': ['Result'],
                                'value': 'D',
                            },
                            {
                                'id': 'urn:uuid:73b9de41-26bb-4890-8e85-d68d40bd8944',
                                'resultDescription':
                                    'urn:uuid:48f7f5f5-443a-4fc4-bcf1-0b8959839773',
                                'type': ['Result'],
                                'value': '0',
                            },
                        ],
                        'term': 'Spring 2026',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:d5aea70a-7b12-4c59-8ba7-d3badc407687',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Digital Art and Design 2 H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:3f38f4f8-0d49-4b62-8a1d-368992124057',
                                    'targetName': 'Powers of Civic Institutions',
                                    'targetDescription':
                                        'Distinguish the powers and responsibilities of local, state, tribal, national, and international civic and political institutions.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.1.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:600097c2-41e7-4b8e-8ddf-e39874746b8f',
                                    'targetName': 'Effectiveness of Civic Institutions',
                                    'targetDescription':
                                        "Evaluate citizens' and institutions' effectiveness in addressing social and political problems.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.5.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:0148d104-bf0a-48b4-81bf-5eb0111dcd9c',
                                    'targetName': 'Governments, Civil Society, and Markets',
                                    'targetDescription':
                                        'Critique relationships among governments, civil societies, and economic markets.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.6.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:989d0789-0a96-403d-8a7b-582ef119aae2',
                                    'targetName': 'Means of Changing Society',
                                    'targetDescription':
                                        'Analyze historical, contemporary, and emerging means of changing societies, promoting the common good, and protecting rights.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Civ.14.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 0.5,
                            'criteria': {
                                'id': 'urn:uuid:31be6d5a-fecb-46b3-83c3-5a4a9b391aaa',
                                'narrative': 'Completion of Amer Govt CP (course 333002CH).',
                            },
                            'description': 'Grade 12 course, 0.5 credit(s).',
                            'fieldOfStudy': 'Social Studies',
                            'humanCode': '333002CH',
                            'id': 'urn:uuid:0de7bfa6-3fa2-46ad-b650-4ee77e07c2c4',
                            'inLanguage': 'en',
                            'name': 'Amer Govt CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:8bd28b48-2a65-408e-b6a8-f1b2c09509cf',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:6199ab14-51ce-4804-9e17-b716c95e00b4',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-12-20T00:00:00Z',
                        'activityStartDate': '2027-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:4f62763b-7795-484f-8cd2-177a92bd25a4',
                                'resultDescription':
                                    'urn:uuid:8bd28b48-2a65-408e-b6a8-f1b2c09509cf',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:a158744c-32e7-4774-8f89-cc5eab90197f',
                                'resultDescription':
                                    'urn:uuid:6199ab14-51ce-4804-9e17-b716c95e00b4',
                                'type': ['Result'],
                                'value': '0.5',
                            },
                        ],
                        'term': 'Fall 2027',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:1587e51a-2e9a-47f6-b1ac-2413bad9c781',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Amer Govt CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:4f412e80-c699-4fbf-8225-fc0ddf651483',
                                    'targetName': 'Analyze Point of View',
                                    'targetDescription':
                                        'Analyze a case in which grasping point of view requires distinguishing what is directly stated from what is really meant.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.6',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:08edcf74-5932-4b84-8b2c-1b262b5cda24',
                                    'targetName': 'Conduct Research Projects',
                                    'targetDescription':
                                        'Conduct short as well as more sustained research projects to answer a question or solve a problem.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:a7b222ec-2964-4414-80c3-7409efb59f07',
                                    'targetName': 'Evaluate Reasoning in Texts',
                                    'targetDescription':
                                        'Delineate and evaluate the reasoning in seminal texts, assessing the validity of the reasoning.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.8',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:aa9ceda7-c21b-44ca-825c-1eea23730b9f',
                                    'targetName': 'Produce Clear and Coherent Writing',
                                    'targetDescription':
                                        'Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.4',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:4d16dcb4-ab28-4fd4-881e-704be8675e24',
                                    'targetName': 'Engage in Collaborative Discussions',
                                    'targetDescription':
                                        "Initiate and participate effectively in a range of collaborative discussions, building on others' ideas.",
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.1',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:5ee04a83-4fd3-426f-8a49-a1dee3241e6c',
                                'narrative': 'Completion of English 4 CP (course 302701CW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'English Language Arts',
                            'humanCode': '302701CW',
                            'id': 'urn:uuid:16ac897d-4fe0-41dc-9bec-91025dfa84bd',
                            'inLanguage': 'en',
                            'name': 'English 4 CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:e34ff4d2-9ed1-4c01-b65f-943c225912bc',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:137f751e-3394-4d12-aeb2-5d5e0810ead1',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-12-20T00:00:00Z',
                        'activityStartDate': '2027-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:0f860e24-7a1a-4ef5-8d58-aa81d16b4d29',
                                'resultDescription':
                                    'urn:uuid:e34ff4d2-9ed1-4c01-b65f-943c225912bc',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:1779fcb5-f315-4012-8d4d-d0ffb0cf4c3c',
                                'resultDescription':
                                    'urn:uuid:137f751e-3394-4d12-aeb2-5d5e0810ead1',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2027',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:589fb617-582a-4ffb-baa1-9978c6bb8ac1',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'English 4 CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:df1a1569-2e55-4683-887a-52e9cc4042ba',
                                    'targetName': 'Perceive and Analyze Artistic Work',
                                    'targetDescription': 'Perceive and analyze artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Anchor Standard 7',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:cd3e3a08-9662-4cb0-8018-36b80ea8147b',
                                    'targetName': 'Interpret Intent and Meaning',
                                    'targetDescription':
                                        'Interpret intent and meaning in artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Anchor Standard 8',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:01e09abe-99f3-4162-88b6-8a8f493871a3',
                                    'targetName': 'Apply Criteria to Evaluate Art',
                                    'targetDescription':
                                        'Apply criteria to evaluate artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Anchor Standard 9',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:5627ff9b-2799-4497-8d77-6e35dbce72b3',
                                    'targetName': 'Connect Art to Historical Context',
                                    'targetDescription':
                                        'Relate artistic ideas and works with societal, cultural, and historical context to deepen understanding.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Anchor Standard 11',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:6975206f-c02f-406b-8c8b-0ee75101c9d2',
                                'narrative': 'Completion of Art History CP (course 358802CW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'Art History',
                            'humanCode': '358802CW',
                            'id': 'urn:uuid:5af992e1-2176-4f85-a80f-5b57dcc0dff9',
                            'inLanguage': 'en',
                            'name': 'Art History CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:b22d5ca7-20ab-48c9-9966-d6cd33793778',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:9ae946b2-effe-45c9-b544-a9c610b754fa',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-12-20T00:00:00Z',
                        'activityStartDate': '2027-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:6181a28f-2845-4096-8980-bbf27316b77d',
                                'resultDescription':
                                    'urn:uuid:b22d5ca7-20ab-48c9-9966-d6cd33793778',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:dfc78df2-0bb4-459d-8c84-66daa63ebfff',
                                'resultDescription':
                                    'urn:uuid:9ae946b2-effe-45c9-b544-a9c610b754fa',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2027',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:be60fbc5-c372-4ca1-b6eb-b71cae0908bd',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Art History CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:9a2d834a-c982-4ad8-8eed-cc064cdfae66',
                                    'targetName': 'Incentives and Policy Tradeoffs',
                                    'targetDescription':
                                        'Analyze how incentives influence choices that may result in policies with a range of costs and benefits for different groups.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Eco.1.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:5cec7009-d65d-4dc6-8a36-2ac0dac067fb',
                                    'targetName': 'Marginal Benefit and Cost Analysis',
                                    'targetDescription':
                                        'Use marginal benefits and marginal costs to construct an argument for or against a decision.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Eco.2.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:87fff6fe-7f9b-4941-8df4-84e53899384b',
                                    'targetName': 'Specialization and Trade',
                                    'targetDescription':
                                        'Explain why individuals and institutions specialize and trade.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Eco.13.9-12',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6306b269-1fa1-446f-82dd-0a06eef3a4bf',
                                    'targetName': 'Monetary and Fiscal Policy Effects',
                                    'targetDescription':
                                        "Explain how changes in monetary and fiscal policy can affect an individual's spending and saving decisions.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'targetType': 'CFItem',
                                    'targetCode': 'D2.Eco.15.9-12',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 0.5,
                            'criteria': {
                                'id': 'urn:uuid:d162ef89-4caa-4a31-8ac6-7cd301fdaf48',
                                'narrative':
                                    'Completion of Economics &  Per Finance CP (course 330800CH).',
                            },
                            'description': 'Grade 12 course, 0.5 credit(s).',
                            'fieldOfStudy': 'Social Studies',
                            'humanCode': '330800CH',
                            'id': 'urn:uuid:bd2f71ec-839a-433f-91b0-18e2937d0ec1',
                            'inLanguage': 'en',
                            'name': 'Economics &  Per Finance CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:8a54aceb-b22c-4c82-9190-4937597a4c51',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:3a519ca1-52d9-470d-a567-90661e2fbd67',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-12-20T00:00:00Z',
                        'activityStartDate': '2027-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:3f81c99f-8d1b-4bf8-8bf0-a4e4c192b373',
                                'resultDescription':
                                    'urn:uuid:8a54aceb-b22c-4c82-9190-4937597a4c51',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:15b270cc-43d4-403e-8c0a-a76d649615e6',
                                'resultDescription':
                                    'urn:uuid:3a519ca1-52d9-470d-a567-90661e2fbd67',
                                'type': ['Result'],
                                'value': '0.5',
                            },
                        ],
                        'term': 'Fall 2027',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:951f66f6-75a4-4946-9271-092e631003df',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Economics &  Per Finance CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:2c28fe7d-071c-4c3a-8dfd-9de14f055213',
                                    'targetName': 'Basic Inferential Analysis',
                                    'targetDescription': 'Perform basic inferential analyses.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:918bb0f1-61d9-492b-89e9-6c8b548b9650',
                                    'targetName': 'Apply Basic Probability and Statistics',
                                    'targetDescription': 'Apply basic probability and statistics.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:18cdc1f1-1239-4d75-8b28-a8bac90c0163',
                                    'targetName': 'Calculate Descriptive Statistics',
                                    'targetDescription':
                                        'Calculate descriptive statistics to better understand data.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:cc93b521-e21c-43c8-8578-23152acdb4ea',
                                    'targetName': 'Define Distribution Properties',
                                    'targetDescription':
                                        'Define the distribution properties of a data set.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:2567891b-6144-44e7-877d-484289f515de',
                                    'targetName': 'Identify Data Set Bias',
                                    'targetDescription':
                                        'Identify any data set biases that may exist for a given statistical analysis.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:49a81eab-56ee-4f98-8141-c38c04553817',
                                'narrative':
                                    'Completion of Statistical Modeling CP (course 412001CW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'Mathematics',
                            'humanCode': '412001CW',
                            'id': 'urn:uuid:7793cdaf-cfb0-4ae0-a1f8-e10e8c1f34eb',
                            'inLanguage': 'en',
                            'name': 'Statistical Modeling CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:784a4a74-d423-4d06-9e1d-2f4945202842',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:1485768b-634d-46bd-b7e0-0aea4af40867',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-12-20T00:00:00Z',
                        'activityStartDate': '2027-08-20T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:e063d473-4b79-458e-8352-04774e27eb76',
                                'resultDescription':
                                    'urn:uuid:784a4a74-d423-4d06-9e1d-2f4945202842',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:5a64d3a8-fd0a-42ce-8979-3d3fa52f7949',
                                'resultDescription':
                                    'urn:uuid:1485768b-634d-46bd-b7e0-0aea4af40867',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Fall 2027',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:9d544b2d-6db0-4395-b921-9b2f87bdccc0',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Statistical Modeling CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-12-20T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Award',
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'id': 'urn:uuid:fbd1a1f2-032b-46d5-8e8d-ecb05efdb327',
                                'narrative':
                                    'Awarded in addition to the standard diploma to graduates who earn a cumulative GPA of 3.0 or higher and an ACT composite score of 20 or higher.',
                            },
                            'description':
                                "Recognizes graduates who meet South Carolina's college-readiness benchmarks.",
                            'id': 'urn:uuid:a833a621-f32e-4b69-9795-cf3dcf38f483',
                            'inLanguage': 'en',
                            'name': 'College Ready Seal of Distinction',
                            'type': ['Achievement'],
                        },
                        'id': 'did:example:student',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:666641d7-4964-407c-9585-262127d7ddf7',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'College Ready Seal of Distinction',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-08-06T19:10:14.838Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Assessment',
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'id': 'urn:uuid:68857e03-2832-41c7-812f-d0f70009bb24',
                                'narrative': 'Completion of the ACT college readiness assessment.',
                            },
                            'description':
                                'The ACT college admissions and placement exam, administered by ACT, Inc.',
                            'id': 'urn:uuid:1e235a5a-995e-46f2-8d7c-f0d152b0565b',
                            'inLanguage': 'en',
                            'name': 'ACT',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:70e18226-28fa-431e-92f9-e230ce0af6cb',
                                    'name': 'ACT Composite Score',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '36',
                                    'valueMin': '1',
                                },
                                {
                                    'id': 'urn:uuid:00c322d4-1291-4ba8-8300-5a89a79418ea',
                                    'name': 'ACT English Score',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '36',
                                    'valueMin': '1',
                                },
                                {
                                    'id': 'urn:uuid:b97aa3ca-e16c-430d-adbb-826ffb6da76d',
                                    'name': 'ACT Math Score',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '36',
                                    'valueMin': '1',
                                },
                                {
                                    'id': 'urn:uuid:e9bcea1a-83f2-401a-930e-7b207d08c1d4',
                                    'name': 'ACT Reading Score',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '36',
                                    'valueMin': '1',
                                },
                                {
                                    'id': 'urn:uuid:7c50c37f-7392-4c68-8fc5-d705769e70a9',
                                    'name': 'ACT Science Score',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                    'valueMax': '36',
                                    'valueMin': '1',
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2026-10-10T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:3ef93d01-58a9-4909-8de4-dcdc6ed03d38',
                                'resultDescription':
                                    'urn:uuid:70e18226-28fa-431e-92f9-e230ce0af6cb',
                                'type': ['Result'],
                                'value': '22',
                            },
                            {
                                'id': 'urn:uuid:3896b4b7-bde0-4bab-8349-4fc9c3dcfb03',
                                'resultDescription':
                                    'urn:uuid:00c322d4-1291-4ba8-8300-5a89a79418ea',
                                'type': ['Result'],
                                'value': '20',
                            },
                            {
                                'id': 'urn:uuid:62ce98d5-6d69-40cf-8f40-f427babd856d',
                                'resultDescription':
                                    'urn:uuid:b97aa3ca-e16c-430d-adbb-826ffb6da76d',
                                'type': ['Result'],
                                'value': '23',
                            },
                            {
                                'id': 'urn:uuid:c9a0c522-5abc-4c20-8c41-e2a1f2588703',
                                'resultDescription':
                                    'urn:uuid:e9bcea1a-83f2-401a-930e-7b207d08c1d4',
                                'type': ['Result'],
                                'value': '24',
                            },
                            {
                                'id': 'urn:uuid:f23ee08a-b690-4fc3-80d3-81156ae80801',
                                'resultDescription':
                                    'urn:uuid:7c50c37f-7392-4c68-8fc5-d705769e70a9',
                                'type': ['Result'],
                                'value': '21',
                            },
                        ],
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:52a8e909-a126-451e-8a88-eb7a356666a7',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'ACT',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2026-10-29T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:42b52a87-40d6-41c9-8290-f4b9f0d9e1a4',
                                    'targetName': 'Cite Textual Evidence and Draw Inferences',
                                    'targetDescription':
                                        'Cite strong and thorough textual evidence, including where the text leaves matters uncertain, to support analysis and inferences drawn from it.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.1',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:5d64f272-73d1-4e5f-8f6b-0a47f5ca62a8',
                                    'targetName': "Analyze Author's Choices in Story Elements",
                                    'targetDescription':
                                        'Analyze the impact of the choices an author makes regarding how to develop and relate elements of a story.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:12203aff-aaa5-41b7-856e-b50347940195',
                                    'targetName': 'Analyze Figurative and Connotative Language',
                                    'targetDescription':
                                        'Determine the meaning of words and phrases as used in the text, including figurative and connotative meanings.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.4',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:518b581a-25da-4edb-8171-051da1273836',
                                    'targetName': 'Analyze Multiple Interpretations of a Text',
                                    'targetDescription':
                                        'Analyze multiple interpretations of a story, drama, or poem, evaluating how each version interprets the source text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'targetType': 'CFItem',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.7',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:3c0b7ff7-b7b4-4a9b-827b-7536a7bb659b',
                                'narrative': 'Completion of Mythology H (course 309905HW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'English Language Arts',
                            'humanCode': '309905HW',
                            'id': 'urn:uuid:a79897d8-6210-4dfb-942d-c2fb97d86f88',
                            'inLanguage': 'en',
                            'name': 'Mythology H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:e92b7a22-389c-4ad6-83e0-accd16671089',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:1629eda4-bd0b-4899-bd99-da01ea37a5eb',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2028-06-02T00:00:00Z',
                        'activityStartDate': '2028-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:f4e73ea5-69c2-49be-89bd-e58f0777545c',
                                'resultDescription':
                                    'urn:uuid:e92b7a22-389c-4ad6-83e0-accd16671089',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:cbc46457-b545-4dee-86ad-fdfcba655a9c',
                                'resultDescription':
                                    'urn:uuid:1629eda4-bd0b-4899-bd99-da01ea37a5eb',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2028',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:ef8dea46-7148-4364-bc2c-87eefe67929e',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Mythology H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2028-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:4be156bf-7cae-4770-84e5-7ab069371958',
                                    'targetName': 'Access an API to Change Data',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to change data for a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:13909fa2-107d-4c80-8a46-13f05eedbc73',
                                    'targetName': 'Access an API to Process a Task',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to process a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:d1c7810e-4319-451b-8e00-89684f4784d9',
                                    'targetName': 'Call Functions in C',
                                    'targetDescription':
                                        'Call functions using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:2c9fe6fa-679c-4a2e-851c-660ca905ad6d',
                                    'targetName': 'Create Functions in C',
                                    'targetDescription':
                                        'Create functions using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:bbc86638-1a5f-4944-853c-c9e8390427d7',
                                    'targetName': 'Declare Variables in C',
                                    'targetDescription':
                                        'Declare variables using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:271df15a-7ccf-4ccb-8d6c-77ce5f32b8f6',
                                'narrative':
                                    'Completion of Intro to Computer Prog H (course 505003HW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'Computer Science',
                            'humanCode': '505003HW',
                            'id': 'urn:uuid:cd343ac0-c587-4deb-9a20-d8e72697a14d',
                            'inLanguage': 'en',
                            'name': 'Intro to Computer Prog H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:a3376f99-22a9-4b94-84de-7fa7afd69116',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:3b98d3ec-8b03-4c01-b57b-61e40f33e648',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2028-06-02T00:00:00Z',
                        'activityStartDate': '2028-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:65601371-bb9b-46e9-8130-e80c3ed0d760',
                                'resultDescription':
                                    'urn:uuid:a3376f99-22a9-4b94-84de-7fa7afd69116',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:34f5b637-32f5-4f03-87bf-00f8c88ccebc',
                                'resultDescription':
                                    'urn:uuid:3b98d3ec-8b03-4c01-b57b-61e40f33e648',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2028',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:ee95e7a8-c7a4-48b5-9104-5b6b5274d085',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Intro to Computer Prog H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2028-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:78d80278-57b2-4ba7-8f93-51401ecdbe89',
                                    'targetName': 'Create an Object-Oriented Program in Java',
                                    'targetDescription':
                                        'Create an object-oriented program using Java.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:f5089cdd-7f6b-4e7a-868b-dcb17fd6bdde',
                                    'targetName': 'Create an Object-Oriented Class in C++',
                                    'targetDescription':
                                        'Create an object-oriented class with C++.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:59cf8be9-f4a1-4e02-86b2-c4c0b4a9585e',
                                    'targetName': 'Implement Object-Oriented Programming in C#',
                                    'targetDescription':
                                        'Implement object-oriented programming using C#.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:96f590b2-6c8f-43ad-85c8-8a64c483e122',
                                    'targetName': 'Apply Iteration Loops in Java',
                                    'targetDescription': 'Apply loops to iterate using Java.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:8a8e07be-fa57-46c8-8588-29aa89659a25',
                                    'targetName': 'Create a Data Structure Map',
                                    'targetDescription': 'Create a data structure map.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'targetType': 'ceasn:Competency',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:a768a2b1-ec98-43cb-8362-f8cb6463a304',
                                'narrative':
                                    'Completion of Interm Computer Prog H (course 505103HW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'Computer Science',
                            'humanCode': '505103HW',
                            'id': 'urn:uuid:158393a6-3857-49fa-8722-25c8797a8170',
                            'inLanguage': 'en',
                            'name': 'Interm Computer Prog H',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:a640b2e2-3a15-4b97-93d6-1f5f8215cdcf',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:a2dd7c37-d3e4-4ad0-80f4-923d378b10ed',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2028-06-02T00:00:00Z',
                        'activityStartDate': '2028-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:888b7572-cdd9-419e-8c73-3f295d5cd647',
                                'resultDescription':
                                    'urn:uuid:a640b2e2-3a15-4b97-93d6-1f5f8215cdcf',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:a6495ea3-1043-4478-80c3-11b2e1f2122f',
                                'resultDescription':
                                    'urn:uuid:a2dd7c37-d3e4-4ad0-80f4-923d378b10ed',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2028',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:3d72da5c-0ca7-4aa1-bb4a-0e16f5548e63',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Interm Computer Prog H',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2028-06-02T00:00:00Z',
                },
                {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
                    ],
                    'credentialSchema': [
                        {
                            'id': 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                            'type': '1EdTechJsonSchemaValidator2019',
                        },
                    ],
                    'credentialSubject': {
                        'achievement': {
                            'achievementType': 'Course',
                            'alignment': [
                                {
                                    'id': 'urn:uuid:d32c6ec3-133f-4f46-82b8-3d18665d6545',
                                    'targetName': 'Apply the Engineering Design Process',
                                    'targetDescription':
                                        'Apply an iterative engineering design process - defining problems, developing solutions, and testing and refining prototypes - to a technological system.',
                                    'targetFramework':
                                        'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                                    'targetUrl': 'https://www.iteea.org/stel',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Engineering Design',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:19d8485f-9d4f-420a-80f2-31d584547693',
                                    'targetName': 'Troubleshoot Technological Systems',
                                    'targetDescription':
                                        'Operate, maintain, and troubleshoot a technological system, diagnosing and resolving malfunctions.',
                                    'targetFramework':
                                        'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                                    'targetUrl': 'https://www.iteea.org/stel',
                                    'targetType': 'CFItem',
                                    'targetCode': 'Abilities for a Technological World',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:6544bde5-570b-4d18-8e61-47e0af67beff',
                                    'targetName': 'Understand sUAS Airspace and Operating Rules',
                                    'targetDescription':
                                        'Understand small unmanned aircraft system (sUAS) airspace classifications, operating rules, and pilot responsibilities.',
                                    'targetFramework':
                                        'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                                    'targetUrl':
                                        'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                                    'targetType': 'CFItem',
                                    'targetCode': '14 CFR Part 107',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'urn:uuid:84716152-7908-49ac-8951-302289bbf313',
                                    'targetName': 'Conduct Pre-Flight Risk Assessment',
                                    'targetDescription':
                                        'Conduct a pre-flight risk assessment and follow safe operating procedures for small unmanned aircraft.',
                                    'targetFramework':
                                        'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                                    'targetUrl':
                                        'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                                    'targetType': 'CFItem',
                                    'targetCode': '14 CFR Part 107',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'creditsAvailable': 1,
                            'criteria': {
                                'id': 'urn:uuid:f5b184f8-c23d-4a9b-842b-65f38d245f73',
                                'narrative':
                                    'Completion of SUAS Scholars (Drones) I CP (course 329900CW).',
                            },
                            'description': 'Grade 12 course, 1 credit(s).',
                            'fieldOfStudy': 'Career & Technical Education',
                            'humanCode': '329900CW',
                            'id': 'urn:uuid:fc1d163f-9d8b-4c96-9bc1-27d2b7a3d16f',
                            'inLanguage': 'en',
                            'name': 'SUAS Scholars (Drones) I CP',
                            'resultDescription': [
                                {
                                    'id': 'urn:uuid:9f06267d-f593-43bc-9954-4851ff09bd7a',
                                    'name': 'Course Grade',
                                    'resultType': 'LetterGrade',
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'id': 'urn:uuid:87e600e4-33bc-412a-b8f6-af7c52ec8319',
                                    'name': 'Credits Earned',
                                    'resultType': 'RawScore',
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2028-06-02T00:00:00Z',
                        'activityStartDate': '2028-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'id': 'urn:uuid:34bb29e8-2b09-4a50-86ab-6a99e006cc8a',
                                'resultDescription':
                                    'urn:uuid:9f06267d-f593-43bc-9954-4851ff09bd7a',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:ec1d2fbf-9014-4af6-884a-0fc59888373d',
                                'resultDescription':
                                    'urn:uuid:87e600e4-33bc-412a-b8f6-af7c52ec8319',
                                'type': ['Result'],
                                'value': '1',
                            },
                        ],
                        'term': 'Spring 2028',
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:0938ad29-9bdc-46d8-a53b-3d1ecd597f4b',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'SUAS Scholars (Drones) I CP',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2028-06-02T00:00:00Z',
                },
            ],
        },
        'credentialSchema': [
            {
                'id': 'https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_clrcredential_schema.json',
                'type': '1EdTechJsonSchemaValidator2019',
            },
        ],
        'name': 'Official Transcript',
        'validFrom': '2028-06-05T00:00:00Z',
        'awardedDate': '2028-06-05T00:00:00Z',
    },
};
