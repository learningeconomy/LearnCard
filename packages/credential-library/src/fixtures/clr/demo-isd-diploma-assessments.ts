import type { CredentialFixture } from '../../types';

export const clrDemoIsdDiplomaAssessments: CredentialFixture = {
    id: 'clr/demo-isd-diploma-assessments',
    name: 'Demo ISD Diploma with Carnegie Skills Assessment',
    description:
        'Partner-issued K-12 transcript with 33 courses plus a Diploma, an Award, an ACT score report and a rubric-based Durable Skills Assessment (RubricCriterionLevel result descriptions, achievedLevel results, Carnegie Skills Progressions alignments). Every alignment/criteria/result carries an id.',
    spec: 'clr-v2',
    profile: 'learner-record',
    features: ['alignment', 'results', 'associations', 'nested-credentials'],
    source: 'real-world',
    signed: false,
    validity: 'valid',
    tags: ['clr-credential', 'assessment', 'rubric'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://purl.imsglobal.org/spec/ob/v3p0/extensions.json',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        'id': 'urn:uuid:2fd44d38-6815-4af4-8e04-c06b0fb81a43',
        'type': ['VerifiableCredential', 'ClrCredential'],
        'issuer': {
            'id': 'did:web:network.learncard.com:users:demo-isd',
            'type': ['Profile'],
            'name': 'Demo ISD',
        },
        'credentialSubject': {
            'id': 'did:example:student',
            'achievement': [
                {
                    'achievementType': 'Diploma',
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'id': 'urn:uuid:e9168aa2-c8ad-4022-8319-16727739cdba',
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
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.1',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.1',
                            'targetDescription':
                                'Cite strong and thorough textual evidence to support analysis of what a text says explicitly.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Cite Textual Evidence',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.2',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.2',
                            'targetDescription':
                                'Determine a theme or central idea of a text and analyze its development over the course of the text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Determine Theme',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.1',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.1',
                            'targetDescription':
                                'Write arguments to support claims using valid reasoning and relevant, sufficient evidence.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Write Arguments',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.9-10.1',
                            'targetCode': 'CCSS.ELA-LITERACY.L.9-10.1',
                            'targetDescription':
                                'Demonstrate command of the conventions of standard English grammar and usage when writing.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Command of Grammar and Usage',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.9-10.1',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.9-10.1',
                            'targetDescription':
                                'Initiate and participate effectively in a range of collaborative discussions.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Collaborative Discussions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                        'id': 'urn:uuid:5c224e58-13c6-4a75-aef4-1d1e92726bbd',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.1.9-12',
                            'targetCode': 'D2.Geo.1.9-12',
                            'targetDescription':
                                'Use maps and other representations to explain relationships between the locations of places and regions.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Analyze Spatial Relationships',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.4.9-12',
                            'targetCode': 'D2.Geo.4.9-12',
                            'targetDescription':
                                'Analyze relationships and interactions within and between human and physical systems.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Human-Environment Interaction',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.7.9-12',
                            'targetCode': 'D2.Geo.7.9-12',
                            'targetDescription':
                                'Analyze the reciprocal nature of how historical events and processes have shaped human and physical environments.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Geography and Historical Change',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.11.9-12',
                            'targetCode': 'D2.Geo.11.9-12',
                            'targetDescription':
                                'Evaluate the influence of long-term climate variability on human migration and settlement patterns.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Migration and Settlement Patterns',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:42d339e6-0f26-4c22-b6d0-f4ed99de8442',
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
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-retrieve-data',
                            'targetDescription':
                                'Access an application programming interface with a programming language to retrieve data for a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Access an API to Retrieve Data',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/adapt-to-changing-requirements',
                            'targetDescription':
                                'Adapt to changing requirements through task or behavior adjustment.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Adapt to Changing Requirements',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/analyze-complex-problems',
                            'targetDescription': 'Analyze a complex problem.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Analyze Complex Problems',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/differentiate-array-and-arraylist-data-structures',
                            'targetDescription':
                                'Differentiate between Array and ArrayList data structures.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Differentiate Array and ArrayList Data Structures',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-backend-applications',
                            'targetDescription':
                                'Create backend online applications using Node.js.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Create Backend Applications',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                        'id': 'urn:uuid:ac87353a-f6b2-407b-bb78-e7b1c17c52fe',
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
                            'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/address-hacking-threats',
                            'targetDescription':
                                'Address hacking threats via physical hardware security, asset inventory, device, and patch management.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetName': 'Address Hacking Threats',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/design-access-and-physical-security-protocols',
                            'targetDescription':
                                'Design access and physical security protocols where users have only the access required to complete their assigned tasks.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetName': 'Design Access and Physical Security Protocols',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/implement-advanced-security-technology',
                            'targetDescription':
                                'Implement advanced security technologies and tools to detect and prevent data loss and exposure.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetName': 'Implement Advanced Security Technology',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/detect-adverse-events',
                            'targetDescription': 'Detect adverse events using cyber defense tools.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetName': 'Detect Adverse Events',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/analyze-attack-trends',
                            'targetDescription':
                                'Analyze collected security data to determine attack trends in systems.',
                            'targetFramework': 'WGU Open Skills - Cybersecurity',
                            'targetName': 'Analyze Attack Trends',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
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
                        'id': 'urn:uuid:dab2f734-a0d2-498f-a3f2-27e5b22465f8',
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
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-CED.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-CED.A.1',
                            'targetDescription':
                                'Create equations and inequalities in one variable and use them to solve problems.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Create Equations in One Variable',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.B.3',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.B.3',
                            'targetDescription':
                                'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Solve Linear Equations and Inequalities',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-SSE.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-SSE.A.1',
                            'targetDescription':
                                'Interpret expressions that represent a quantity in terms of its context.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Interpret Expressions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSF-IF.A.2',
                            'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.A.2',
                            'targetDescription':
                                'Use function notation, evaluate functions for inputs in their domains.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Use Function Notation',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.D.10',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.D.10',
                            'targetDescription':
                                'Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Graph Equations in Two Variables',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
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
                        'id': 'urn:uuid:17a74606-c11a-4d3b-aeeb-6b25b686b995',
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
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-1',
                            'targetCode': 'Standard 1',
                            'targetDescription':
                                'Demonstrates competency in a variety of motor skills and movement patterns.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Motor Skill Competency',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-2',
                            'targetCode': 'Standard 2',
                            'targetDescription':
                                'Applies knowledge of concepts, principles, strategies and tactics related to movement and performance.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Movement Concepts and Strategies',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-3',
                            'targetCode': 'Standard 3',
                            'targetDescription':
                                'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Health-Enhancing Fitness',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
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
                        'id': 'urn:uuid:8ba351b2-31e0-491e-a963-a27c601088cf',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.3.9-12',
                            'targetCode': 'D2.Civ.3.9-12',
                            'targetDescription':
                                'Analyze the impact of constitutions, laws, treaties, and international agreements on the maintenance of national and international order.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Constitutions, Laws, and Agreements',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.8.9-12',
                            'targetCode': 'D2.Civ.8.9-12',
                            'targetDescription':
                                'Evaluate social and political systems in different contexts, times, and places that promote civic virtues and enact democratic principles.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Civic Virtues Across Systems',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.12.9-12',
                            'targetCode': 'D2.Civ.12.9-12',
                            'targetDescription':
                                'Analyze how people use and challenge laws to address a variety of public issues.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Using and Challenging Laws',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:be165eb7-39b8-41c5-bc0d-c9064ad8cd4d',
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
                            'id': 'https://www.nextgenscience.org/HS-LS1-1',
                            'targetCode': 'HS-LS1-1',
                            'targetDescription':
                                'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'DNA and Protein Structure',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS1-2',
                            'targetCode': 'HS-LS1-2',
                            'targetDescription':
                                'Develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Hierarchical Organization of Organisms',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS2-1',
                            'targetCode': 'HS-LS2-1',
                            'targetDescription':
                                'Use mathematical and/or computational representations to support explanations of factors that affect carrying capacity of ecosystems.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Carrying Capacity of Ecosystems',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS4-2',
                            'targetCode': 'HS-LS4-2',
                            'targetDescription':
                                'Construct an explanation based on evidence that the process of evolution primarily results from four factors.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Factors Driving Evolution',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS1-4',
                            'targetCode': 'HS-LS1-4',
                            'targetDescription':
                                'Use a model to illustrate the role of cellular division and differentiation in producing and maintaining complex organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Cellular Division and Differentiation',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
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
                        'id': 'urn:uuid:99835478-94a8-40ee-810c-9f84b7ac8beb',
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
                            'id': 'https://www.nextgenscience.org/HS-PS1-1',
                            'targetCode': 'HS-PS1-1',
                            'targetDescription':
                                'Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Periodic Table and Electron Patterns',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-PS1-2',
                            'targetCode': 'HS-PS1-2',
                            'targetDescription':
                                'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Explain Chemical Reaction Outcomes',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-PS1-4',
                            'targetCode': 'HS-PS1-4',
                            'targetDescription':
                                'Develop a model to illustrate that the release or absorption of energy from a chemical reaction system depends on the changes in total bond energy.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Model Energy in Chemical Reactions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-PS1-7',
                            'targetCode': 'HS-PS1-7',
                            'targetDescription':
                                'Use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Conservation of Mass',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-PS1-5',
                            'targetCode': 'HS-PS1-5',
                            'targetDescription':
                                'Apply scientific principles and evidence to provide an explanation about the effects of changing temperature or concentration on reaction rate.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Factors Affecting Reaction Rate',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
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
                        'id': 'urn:uuid:03970a24-ca14-49c9-9a45-8b622bee0463',
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
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-3',
                            'targetCode': 'Standard 3',
                            'targetDescription':
                                'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Health-Enhancing Fitness',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-4',
                            'targetCode': 'Standard 4',
                            'targetDescription':
                                'Exhibits responsible personal and social behavior that respects self and others.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Personal and Social Responsibility',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.shapeamerica.org/standards/pe/Standard-5',
                            'targetCode': 'Standard 5',
                            'targetDescription':
                                'Recognizes the value of physical activity for health, enjoyment, challenge, self-expression, and/or social interaction.',
                            'targetFramework':
                                'SHAPE America National Standards for K-12 Physical Education',
                            'targetName': 'Value of Physical Activity',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
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
                        'id': 'urn:uuid:d5902cb9-6c8a-4199-8985-de1cbb069202',
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
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.3',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.3',
                            'targetDescription':
                                'Analyze how complex characters develop over the course of a text, interact with other characters, and advance the plot.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Analyze Character Development',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.9-10.6',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.9-10.6',
                            'targetDescription':
                                "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric.",
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': "Analyze Author's Point of View",
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.3',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.3',
                            'targetDescription':
                                'Write narratives to develop real or imagined experiences using effective technique and well-structured event sequences.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Write Narratives',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.9-10.5',
                            'targetCode': 'CCSS.ELA-LITERACY.L.9-10.5',
                            'targetDescription':
                                'Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Understand Figurative Language',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.9',
                            'targetCode': 'CCSS.ELA-LITERACY.W.9-10.9',
                            'targetDescription':
                                'Draw evidence from literary or informational texts to support analysis, reflection, and research.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Draw Evidence From Texts',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                        'id': 'urn:uuid:8f2b0536-49a1-471f-8ee8-6766a6ac4d01',
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
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-CO.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.A.1',
                            'targetDescription':
                                'Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Define Geometric Terms',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-CO.B.7',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.B.7',
                            'targetDescription':
                                'Use the definition of congruence in terms of rigid motions to show two triangles are congruent.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Prove Triangle Congruence',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-SRT.B.5',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-SRT.B.5',
                            'targetDescription':
                                'Use congruence and similarity criteria for triangles to solve problems and prove relationships in geometric figures.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Similarity and Congruence Criteria',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-GPE.B.7',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-GPE.B.7',
                            'targetDescription':
                                'Use coordinates to compute perimeters of polygons and areas of triangles and rectangles.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Coordinate Geometry: Perimeter and Area',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-C.A.2',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-C.A.2',
                            'targetDescription':
                                'Identify and describe relationships among inscribed angles, radii, and chords.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Inscribed Angle and Circle Relationships',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
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
                        'id': 'urn:uuid:f667bdd0-18ba-43df-98db-c6111791a32e',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.1.9-12',
                            'targetCode': 'D2.His.1.9-12',
                            'targetDescription':
                                'Evaluate how historical events and developments were shaped by unique circumstances of time and place.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Historical Context of Events',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.3.9-12',
                            'targetCode': 'D2.His.3.9-12',
                            'targetDescription':
                                'Use questions generated about multiple historical sources to pursue further investigation.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Generate Historical Questions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.14.9-12',
                            'targetCode': 'D2.His.14.9-12',
                            'targetDescription':
                                'Analyze multiple and complex causes and effects of events in the past.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Analyze Causes and Effects',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.16.9-12',
                            'targetCode': 'D2.His.16.9-12',
                            'targetDescription':
                                'Integrate evidence from multiple relevant historical sources and interpretations into a reasoned argument.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Construct Historical Arguments',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:835d5f46-ca69-4e32-a576-555d665b418b',
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
                            'id': 'https://www.actfl.org/Standard-2.1',
                            'targetCode': 'Standard 2.1',
                            'targetDescription':
                                'Demonstrate an understanding of the relationship between the practices and perspectives of the culture studied.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Cultural Practices and Perspectives',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-2.2',
                            'targetCode': 'Standard 2.2',
                            'targetDescription':
                                'Demonstrate an understanding of the relationship between the products and perspectives of the culture studied.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Cultural Products and Perspectives',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-3.1',
                            'targetCode': 'Standard 3.1',
                            'targetDescription':
                                'Use the language to reinforce and further knowledge of other disciplines.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Making Interdisciplinary Connections',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-5.1',
                            'targetCode': 'Standard 5.1',
                            'targetDescription':
                                'Use the language both within and beyond the school setting.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Language Use Beyond the Classroom',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
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
                        'id': 'urn:uuid:c6274e6b-3225-43a2-920d-8076371965f5',
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
                            'id': 'https://www.actfl.org/Standard-1.1',
                            'targetCode': 'Standard 1.1',
                            'targetDescription':
                                'Engage in conversations, provide and obtain information, express feelings and emotions, and exchange opinions.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Interpersonal Communication',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-1.2',
                            'targetCode': 'Standard 1.2',
                            'targetDescription':
                                'Understand and interpret spoken and written language on a variety of topics.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Interpretive Communication',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-1.3',
                            'targetCode': 'Standard 1.3',
                            'targetDescription':
                                'Present information, concepts, and ideas to an audience of listeners or readers on a variety of topics.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Presentational Communication',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.actfl.org/Standard-4.1',
                            'targetCode': 'Standard 4.1',
                            'targetDescription':
                                'Demonstrate understanding of the nature of language through comparisons of the language studied and their own.',
                            'targetFramework':
                                'ACTFL World-Readiness Standards for Learning Languages',
                            'targetName': 'Comparing Language Structures',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.actfl.org/',
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
                        'id': 'urn:uuid:c3c7856c-a816-4364-8756-d645097f4742',
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
                            'id': 'https://www.nextgenscience.org/HS-LS3-1',
                            'targetCode': 'HS-LS3-1',
                            'targetDescription':
                                'Ask questions to clarify relationships about the role of DNA and chromosomes in coding instructions for characteristic traits.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'DNA and Chromosomes in Inheritance',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS3-2',
                            'targetCode': 'HS-LS3-2',
                            'targetDescription':
                                'Make and defend a claim based on evidence that inheritable genetic variations may result from new genetic combinations, mutation, or environmental factors.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Sources of Genetic Variation',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS2-6',
                            'targetCode': 'HS-LS2-6',
                            'targetDescription':
                                'Evaluate claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Ecosystem Stability Evidence',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS2-7',
                            'targetCode': 'HS-LS2-7',
                            'targetDescription':
                                'Design, evaluate, and refine a solution for reducing the impacts of human activities on the environment.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Design Solutions to Reduce Human Impact',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nextgenscience.org/HS-LS4-4',
                            'targetCode': 'HS-LS4-4',
                            'targetDescription':
                                'Construct an explanation based on evidence for how natural selection leads to adaptation of populations.',
                            'targetFramework': 'Next Generation Science Standards',
                            'targetName': 'Natural Selection and Adaptation',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nextgenscience.org/',
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
                        'id': 'urn:uuid:7c4bd3f2-42ef-4561-8ccf-f9682693f717',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.2.9-12',
                            'targetCode': 'D2.His.2.9-12',
                            'targetDescription':
                                'Analyze change and continuity in historical eras.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Change and Continuity in Eras',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.5.9-12',
                            'targetCode': 'D2.His.5.9-12',
                            'targetDescription':
                                "Analyze how historical contexts shaped and continue to shape people's perspectives.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Historical Context and Perspective',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.His.12.9-12',
                            'targetCode': 'D2.His.12.9-12',
                            'targetDescription':
                                'Analyze the relationship between historical sources and the secondary interpretations made from them.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Sources and Interpretations',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.10.9-12',
                            'targetCode': 'D2.Civ.10.9-12',
                            'targetDescription':
                                'Analyze the impact and the appropriate use of power in the United States and other nations.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Analyzing the Use of Power',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:80830c70-fdc0-472f-81fd-de93a59500f3',
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
                            'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/identify-application-development-software',
                            'targetDescription':
                                'Identify appropriate software for developing web, desktop, or mobile applications.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetName': 'Identify Application Development Software',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/create-client-server-systems',
                            'targetDescription':
                                'Create client-server systems using object-oriented programming.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetName': 'Create Client-Server Systems',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/track-and-address-bug-fixes',
                            'targetDescription': 'Track and address bug fixes.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetName': 'Track and Address Bug Fixes',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/identify-software-design-requirements',
                            'targetDescription':
                                'Identify business requirements for software design.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetName': 'Identify Software Design Requirements',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/collaborative-troubleshooting',
                            'targetDescription':
                                'Collaborate on troubleshooting software problems.',
                            'targetFramework': 'WGU Open Skills - Software Engineering',
                            'targetName': 'Collaborative Troubleshooting',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
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
                        'id': 'urn:uuid:722665b3-b59e-4c3e-b01d-9c9116c4e256',
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
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-APR.B.3',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-APR.B.3',
                            'targetDescription':
                                'Identify zeros of polynomials and use the zeros to construct a rough graph of the function.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Zeros of Polynomials',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSF-IF.C.7C',
                            'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.C.7C',
                            'targetDescription':
                                'Graph polynomial functions, identifying zeros when suitable factorizations are available.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Graph Polynomial Functions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-CP.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.A.1',
                            'targetDescription':
                                'Describe events as subsets of a sample space using characteristics of the outcomes.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Describe Events as Sample Spaces',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-CP.B.9',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.B.9',
                            'targetDescription':
                                'Use permutations and combinations to compute probabilities of compound events.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Permutations and Combinations',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.A.2',
                            'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.A.2',
                            'targetDescription':
                                'Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Solve Rational and Radical Equations',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
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
                        'id': 'urn:uuid:7103098e-f25c-4a77-ad41-94847b1f4a46',
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
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-MG.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-MG.A.1',
                            'targetDescription':
                                'Use geometric shapes, their measures, and their properties to describe objects.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Geometric Modeling',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-GMD.A.3',
                            'targetCode': 'CCSS.MATH.CONTENT.HSG-GMD.A.3',
                            'targetDescription':
                                'Use volume formulas for cylinders, pyramids, cones, and spheres to solve problems.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Volume Formulas',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.A.1',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.1',
                            'targetDescription':
                                'Represent data with plots on the real number line (dot plots, histograms, and box plots).',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Represent Data with Plots',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.B.6',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.B.6',
                            'targetDescription':
                                'Represent data on two quantitative variables on a scatter plot, and describe how the variables are related.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Summarize Two-Variable Data',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.A.4',
                            'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.4',
                            'targetDescription':
                                'Use the mean and standard deviation of a data set to fit it to a normal distribution.',
                            'targetFramework': 'Common Core State Standards for Mathematics',
                            'targetName': 'Fit Data to a Normal Distribution',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/Math/',
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
                        'id': 'urn:uuid:6f9b216e-389f-4e03-8829-b389f619afa3',
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
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.2',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.2',
                            'targetDescription':
                                'Determine two or more themes or central ideas of a text and analyze their development over the course of the text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Analyze Theme Development',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.11-12.7',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.7',
                            'targetDescription':
                                'Integrate and evaluate multiple sources of information presented in different media or formats.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Integrate Multiple Sources',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.1',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.1',
                            'targetDescription':
                                'Write arguments to support claims using valid reasoning and sufficient evidence.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Write Arguments with Sufficient Evidence',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.11-12.4',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.4',
                            'targetDescription':
                                'Present information, findings, and supporting evidence clearly, concisely, and logically.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Present Findings Clearly',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.11-12.3',
                            'targetCode': 'CCSS.ELA-LITERACY.L.11-12.3',
                            'targetDescription':
                                'Apply knowledge of language to understand how language functions in different contexts.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Apply Knowledge of Language',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                        'id': 'urn:uuid:ac1f9e74-0282-45a0-919e-1231f98b1651',
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
                            'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/analyze-market-trends',
                            'targetDescription':
                                'Analyze market trends, competitor activities and customer needs to develop business plans and proposals.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetName': 'Analyze Market Trends',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-relationships-with-investors',
                            'targetDescription': 'Build relationships with investors.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetName': 'Build Relationships With Investors',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-customer-loyalty',
                            'targetDescription': 'Build customer loyalty.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetName': 'Build Customer Loyalty',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/manage-business-cash-flow',
                            'targetDescription': 'Manage cash flow in a business.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetName': 'Manage Business Cash Flow',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-business-relationships',
                            'targetDescription': 'Build business relationships.',
                            'targetFramework': 'WGU Open Skills - Entrepreneurs',
                            'targetName': 'Build Business Relationships',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
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
                        'id': 'urn:uuid:00f9f6ef-36a3-4f57-9496-52a4c498564d',
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
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/apply-design-principles',
                            'targetDescription':
                                'Apply knowledge of design principles and best practices to create visually cohesive and aesthetically pleasing designs using digital tools.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Apply Design Principles',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/demonstrate-empathy-for-users',
                            'targetDescription':
                                'Demonstrate empathy for users to inform solutions to design problems.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Demonstrate Empathy for Users',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/apply-design-thinking-methodologies',
                            'targetDescription':
                                'Apply design thinking methodologies to develop innovative solutions.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Apply Design Thinking Methodologies',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/create-low-fidelity-prototypes',
                            'targetDescription': 'Create a low-fidelity prototype.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Create Low-Fidelity Prototypes',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/conduct-user-research',
                            'targetDescription':
                                "Conduct user research to understand target audiences' preferences and behaviors.",
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Conduct User Research',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
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
                        'id': 'urn:uuid:d3530d7c-ca5f-437e-82b7-43c21ca0d130',
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
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/create-intuitive-interfaces',
                            'targetDescription':
                                'Create intuitive and user-friendly interfaces that align with business goals and target audience expectations.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Create Intuitive Interfaces',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/leverage-prototyping-tools',
                            'targetDescription':
                                'Leverage prototyping tools to create interactive digital prototypes and mockups.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Leverage Prototyping Tools',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/develop-a-prototype-strategy',
                            'targetDescription': 'Identify inputs for a prototype strategy.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Develop a Prototype Strategy',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/test-prototypes-against-requirements',
                            'targetDescription':
                                'Test a prototype against defined product requirements.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Test Prototypes Against Requirements',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/product-design-strategy',
                            'targetDescription':
                                'Identify the optimal approach to introduce a new product into the marketplace.',
                            'targetFramework': 'WGU Open Skills - Product and Experience Design',
                            'targetName': 'Product Design Strategy',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
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
                        'id': 'urn:uuid:b3ed97b4-ca9f-4a3f-a4ab-c1abcd2eb22e',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.1.9-12',
                            'targetCode': 'D2.Civ.1.9-12',
                            'targetDescription':
                                'Distinguish the powers and responsibilities of local, state, tribal, national, and international civic and political institutions.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Powers of Civic Institutions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.5.9-12',
                            'targetCode': 'D2.Civ.5.9-12',
                            'targetDescription':
                                "Evaluate citizens' and institutions' effectiveness in addressing social and political problems.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Effectiveness of Civic Institutions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.6.9-12',
                            'targetCode': 'D2.Civ.6.9-12',
                            'targetDescription':
                                'Critique relationships among governments, civil societies, and economic markets.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Governments, Civil Society, and Markets',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.14.9-12',
                            'targetCode': 'D2.Civ.14.9-12',
                            'targetDescription':
                                'Analyze historical, contemporary, and emerging means of changing societies, promoting the common good, and protecting rights.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Means of Changing Society',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:353c7aa5-b91f-45c1-b3f5-78dc0f3ed067',
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
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.6',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.6',
                            'targetDescription':
                                'Analyze a case in which grasping point of view requires distinguishing what is directly stated from what is really meant.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Analyze Point of View',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.7',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.7',
                            'targetDescription':
                                'Conduct short as well as more sustained research projects to answer a question or solve a problem.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Conduct Research Projects',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.11-12.8',
                            'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.8',
                            'targetDescription':
                                'Delineate and evaluate the reasoning in seminal texts, assessing the validity of the reasoning.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Evaluate Reasoning in Texts',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.4',
                            'targetCode': 'CCSS.ELA-LITERACY.W.11-12.4',
                            'targetDescription':
                                'Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Produce Clear and Coherent Writing',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.11-12.1',
                            'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.1',
                            'targetDescription':
                                "Initiate and participate effectively in a range of collaborative discussions, building on others' ideas.",
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Engage in Collaborative Discussions',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                        'id': 'urn:uuid:8da3add6-6e84-4de8-9724-e85afa66c893',
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
                            'id': 'https://www.nationalartsstandards.org/Anchor-Standard-7',
                            'targetCode': 'Anchor Standard 7',
                            'targetDescription': 'Perceive and analyze artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetName': 'Perceive and Analyze Artistic Work',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nationalartsstandards.org/Anchor-Standard-8',
                            'targetCode': 'Anchor Standard 8',
                            'targetDescription': 'Interpret intent and meaning in artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetName': 'Interpret Intent and Meaning',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nationalartsstandards.org/Anchor-Standard-9',
                            'targetCode': 'Anchor Standard 9',
                            'targetDescription': 'Apply criteria to evaluate artistic work.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetName': 'Apply Criteria to Evaluate Art',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.nationalartsstandards.org/Anchor-Standard-11',
                            'targetCode': 'Anchor Standard 11',
                            'targetDescription':
                                'Relate artistic ideas and works with societal, cultural, and historical context to deepen understanding.',
                            'targetFramework': 'National Core Arts Standards',
                            'targetName': 'Connect Art to Historical Context',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.nationalartsstandards.org/',
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
                        'id': 'urn:uuid:88904be8-3a4a-4e5c-9a23-970577ba6fb8',
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
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.1.9-12',
                            'targetCode': 'D2.Eco.1.9-12',
                            'targetDescription':
                                'Analyze how incentives influence choices that may result in policies with a range of costs and benefits for different groups.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Incentives and Policy Tradeoffs',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.2.9-12',
                            'targetCode': 'D2.Eco.2.9-12',
                            'targetDescription':
                                'Use marginal benefits and marginal costs to construct an argument for or against a decision.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Marginal Benefit and Cost Analysis',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.13.9-12',
                            'targetCode': 'D2.Eco.13.9-12',
                            'targetDescription':
                                'Explain why individuals and institutions specialize and trade.',
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Specialization and Trade',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.15.9-12',
                            'targetCode': 'D2.Eco.15.9-12',
                            'targetDescription':
                                "Explain how changes in monetary and fiscal policy can affect an individual's spending and saving decisions.",
                            'targetFramework': 'C3 Framework for Social Studies State Standards',
                            'targetName': 'Monetary and Fiscal Policy Effects',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                        'id': 'urn:uuid:57073938-cabb-4d91-bd24-a16696e8f0d1',
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
                            'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/basic-inferential-analysis',
                            'targetDescription': 'Perform basic inferential analyses.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetName': 'Basic Inferential Analysis',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/apply-basic-probability-and-statistics',
                            'targetDescription': 'Apply basic probability and statistics.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetName': 'Apply Basic Probability and Statistics',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/calculate-descriptive-statistics',
                            'targetDescription':
                                'Calculate descriptive statistics to better understand data.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetName': 'Calculate Descriptive Statistics',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/define-distribution-properties',
                            'targetDescription':
                                'Define the distribution properties of a data set.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetName': 'Define Distribution Properties',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/identify-data-set-bias',
                            'targetDescription':
                                'Identify any data set biases that may exist for a given statistical analysis.',
                            'targetFramework':
                                'WGU Open Skills - Foundations: Data Science and Analytics',
                            'targetName': 'Identify Data Set Bias',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
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
                        'id': 'urn:uuid:c38360f6-44b9-4bc3-b304-051d9f659801',
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
                        'id': 'urn:uuid:22a60e3b-dd3c-4eca-996b-277826a24ca8',
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
                        'id': 'urn:uuid:20735dac-b5a9-4041-99f0-9868a2ffabd9',
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
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.1',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.1',
                            'targetDescription':
                                'Cite strong and thorough textual evidence, including where the text leaves matters uncertain, to support analysis and inferences drawn from it.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Cite Textual Evidence and Draw Inferences',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.3',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.3',
                            'targetDescription':
                                'Analyze the impact of the choices an author makes regarding how to develop and relate elements of a story.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': "Analyze Author's Choices in Story Elements",
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.4',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.4',
                            'targetDescription':
                                'Determine the meaning of words and phrases as used in the text, including figurative and connotative meanings.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Analyze Figurative and Connotative Language',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.7',
                            'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.7',
                            'targetDescription':
                                'Analyze multiple interpretations of a story, drama, or poem, evaluating how each version interprets the source text.',
                            'targetFramework': 'Common Core State Standards for ELA',
                            'targetName': 'Analyze Multiple Interpretations of a Text',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                        'id': 'urn:uuid:76421a81-3956-4d8a-91de-f192a53d1969',
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
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-change-data',
                            'targetDescription':
                                'Access an application programming interface with a programming language to change data for a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Access an API to Change Data',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-process-a-task',
                            'targetDescription':
                                'Access an application programming interface with a programming language to process a task.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Access an API to Process a Task',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/call-functions-in-c',
                            'targetDescription': 'Call functions using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Call Functions in C',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-functions-in-c',
                            'targetDescription':
                                'Create functions using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Create Functions in C',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/declare-variables-in-c',
                            'targetDescription':
                                'Declare variables using the C programming language.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Declare Variables in C',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                        'id': 'urn:uuid:1b14aa8c-acfe-46b2-91c1-9892e00d2fed',
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
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-an-object-oriented-program-in-java',
                            'targetDescription': 'Create an object-oriented program using Java.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Create an Object-Oriented Program in Java',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-an-object-oriented-class-in-cpp',
                            'targetDescription': 'Create an object-oriented class with C++.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Create an Object-Oriented Class in C++',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/implement-object-oriented-programming-in-csharp',
                            'targetDescription': 'Implement object-oriented programming using C#.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Implement Object-Oriented Programming in C#',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/apply-iteration-loops-in-java',
                            'targetDescription': 'Apply loops to iterate using Java.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Apply Iteration Loops in Java',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-a-data-structure-map',
                            'targetDescription': 'Create a data structure map.',
                            'targetFramework': 'WGU Open Skills - Computer Science',
                            'targetName': 'Create a Data Structure Map',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                        'id': 'urn:uuid:95569308-c46e-406f-8ad9-a0860d8c32fb',
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
                            'id': 'https://www.iteea.org/stel/Engineering-Design',
                            'targetCode': 'Engineering Design',
                            'targetDescription':
                                'Apply an iterative engineering design process - defining problems, developing solutions, and testing and refining prototypes - to a technological system.',
                            'targetFramework':
                                'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                            'targetName': 'Apply the Engineering Design Process',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.iteea.org/stel',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.iteea.org/stel/Abilities-for-a-Technological-World',
                            'targetCode': 'Abilities for a Technological World',
                            'targetDescription':
                                'Operate, maintain, and troubleshoot a technological system, diagnosing and resolving malfunctions.',
                            'targetFramework':
                                'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                            'targetName': 'Troubleshoot Technological Systems',
                            'targetType': 'CFItem',
                            'targetUrl': 'https://www.iteea.org/stel',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.faa.gov/uas/commercial_operators/part_107_landing/understand-suas-airspace-and-operating-rules',
                            'targetCode': '14 CFR Part 107',
                            'targetDescription':
                                'Understand small unmanned aircraft system (sUAS) airspace classifications, operating rules, and pilot responsibilities.',
                            'targetFramework':
                                'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                            'targetName': 'Understand sUAS Airspace and Operating Rules',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://www.faa.gov/uas/commercial_operators/part_107_landing/conduct-pre-flight-risk-assessment',
                            'targetCode': '14 CFR Part 107',
                            'targetDescription':
                                'Conduct a pre-flight risk assessment and follow safe operating procedures for small unmanned aircraft.',
                            'targetFramework':
                                'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                            'targetName': 'Conduct Pre-Flight Risk Assessment',
                            'targetType': 'CFItem',
                            'targetUrl':
                                'https://www.faa.gov/uas/commercial_operators/part_107_landing',
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
                        'id': 'urn:uuid:614d7d2b-4d8a-4c36-9d59-5bc4f95fdcf4',
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
                {
                    'achievementType': 'Assessment',
                    'alignment': [
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/ed224bb6-2380-51ef-90bb-4f2d785f9d4c',
                            'targetCode': 'COM.1',
                            'targetDescription': 'Communication',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName':
                                'Use multimodal forms of communication to effectively convey ideas (e.g., spoken, written, listening, visual, artistic, etc.).',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/ed224bb6-2380-51ef-90bb-4f2d785f9d4c',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/898de315-629f-5857-a521-103eb4735996',
                            'targetCode': 'COM.3',
                            'targetDescription': 'Communication',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Demonstrate active listening or comprehension',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/898de315-629f-5857-a521-103eb4735996',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/042535ff-fa95-53f8-aad6-2baa1cfe021c',
                            'targetCode': 'COM.4',
                            'targetDescription': 'Communication',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName':
                                'Understand and leverage the social, emotional and ethical dimensions of communication',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/042535ff-fa95-53f8-aad6-2baa1cfe021c',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/b1424046-9963-53d0-a0da-93f3d9c48f58',
                            'targetCode': 'COL.1',
                            'targetDescription': 'Collaboration',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName':
                                'Engage with ideas through intentional communication in service of shared goals',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/b1424046-9963-53d0-a0da-93f3d9c48f58',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/0132cddf-7ac0-55e2-8be4-8b938b490cdb',
                            'targetCode': 'COL.2',
                            'targetDescription': 'Collaboration',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName':
                                'Effectively engage in and facilitate group activities and decision-making toward shared goal',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/0132cddf-7ac0-55e2-8be4-8b938b490cdb',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/e3317793-cd61-58a3-8518-620284b9d05e',
                            'targetCode': 'COL.3',
                            'targetDescription': 'Collaboration',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Emphasize interpersonal relationships',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/e3317793-cd61-58a3-8518-620284b9d05e',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/5d7ef913-d954-52a1-a119-f4eb97a4a926',
                            'targetCode': 'CT.1',
                            'targetDescription': 'Critical Thinking',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Information Seeking',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/5d7ef913-d954-52a1-a119-f4eb97a4a926',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/3853cee3-50bc-5fa8-a129-d44aea3dd57f',
                            'targetCode': 'CT.2',
                            'targetDescription': 'Critical Thinking',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Information Analysis',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/3853cee3-50bc-5fa8-a129-d44aea3dd57f',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/d1804b83-63a8-5f81-9d03-4d2aa5c36bb3',
                            'targetCode': 'CT.3',
                            'targetDescription': 'Critical Thinking',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Argument Generation',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/d1804b83-63a8-5f81-9d03-4d2aa5c36bb3',
                            'type': ['Alignment'],
                        },
                        {
                            'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/84b089ee-0a79-544c-b74a-e18ae695b2b6',
                            'targetCode': 'CT.4',
                            'targetDescription': 'Critical Thinking',
                            'targetFramework': 'Carnegie Skills Progressions',
                            'targetName': 'Logical Reasoning',
                            'targetType': 'ceasn:Competency',
                            'targetUrl':
                                'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/84b089ee-0a79-544c-b74a-e18ae695b2b6',
                            'type': ['Alignment'],
                        },
                    ],
                    'creator': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'criteria': {
                        'id': 'urn:uuid:4bac4ee2-6dd3-49d3-ba9b-afab6ac85eaf',
                        'narrative':
                            'Administered by Demo ISD staff using the Carnegie Skills Progressions rubric. Each subskill is rated at one of four progression levels: Exploring, Analyzing, Integrating, or Extending.',
                    },
                    'description':
                        'A schoolwide assessment of student growth on the Carnegie Foundation / ETS Durable Skills Progressions, covering Communication, Collaboration, and Critical Thinking.',
                    'id': 'urn:uuid:c5fd4cdb-187a-4093-90b5-d555a548ecf5',
                    'inLanguage': 'en',
                    'name': 'Durable Skills Assessment',
                    'resultDescription': [
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:bbf2de29-d389-4989-a49f-52c34591fe29',
                            'name': 'COM.1 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Conveys a basic idea using a single mode of communication (e.g., speaking or writing).',
                                    'id': 'urn:uuid:27bcf1c9-0cd3-4020-8017-f6aec371ee15',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Selects a communication mode appropriate to a simple task or audience.',
                                    'id': 'urn:uuid:8ac002fd-45a3-4635-8220-13dc8372a1c7',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Combines multiple modes (e.g., visual and spoken) to convey an idea more clearly.',
                                    'id': 'urn:uuid:ea261424-9377-4a36-b256-65e210c772fe',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Deliberately blends and adapts multiple modes of communication to strengthen an idea's impact for a specific audience.",
                                    'id': 'urn:uuid:4658588d-7f0e-494a-8d37-15045c66ae30',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:10962331-10cc-49af-8962-03b7d70e3540',
                            'name': 'COM.3 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Recognizes when a message has not been fully understood.',
                                    'id': 'urn:uuid:d2d0da22-7948-4059-9444-682df452ec05',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Identifies the key point of a message conveyed by others.',
                                    'id': 'urn:uuid:9b589d04-027d-4592-ba75-719263d6602a',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Summarizes a message accurately, including ideas beyond what was directly stated.',
                                    'id': 'urn:uuid:7267ecda-b983-4313-8cac-42e6deb9dfbf',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Synthesizes and builds on others' messages, drawing out implications the speaker did not state directly.",
                                    'id': 'urn:uuid:26b660c3-70a2-4979-8a75-95c7087913b1',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:054dea20-8fdf-438b-9199-4329b72f387a',
                            'name': 'COM.4 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Shows awareness that communication norms differ across people and contexts.',
                                    'id': 'urn:uuid:45812cb1-67ba-4643-907b-bcf1ca5276d5',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Demonstrates curiosity about how social and cultural context shapes communication (e.g., by asking questions).',
                                    'id': 'urn:uuid:8a9967d9-0f79-4cd4-bcbb-8f2eb91fdb00',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Adapts communication with intention based on the social or emotional context of a conversation.',
                                    'id': 'urn:uuid:4f8b96ec-d36c-485e-946c-c4c601372515',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Anticipates how social, emotional, and ethical factors will shape a conversation and adjusts proactively.',
                                    'id': 'urn:uuid:a9958bec-a853-4a4d-812d-64e4fc7f9208',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:9aa7b9a7-a559-43ef-8e1b-be253dfded11',
                            'name': 'COL.1 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Recognizes that sharing an idea with the group can move shared work forward.',
                                    'id': 'urn:uuid:84d77f8f-9f87-48c2-9099-1361437b6c3a',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Contributes an idea to a group discussion when prompted.',
                                    'id': 'urn:uuid:926e0092-7228-4ba3-9640-581264f14a9d',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Offers ideas unprompted and builds on others' contributions toward the group's goal.",
                                    'id': 'urn:uuid:3896b825-1f02-40a6-ac3d-68ed8fb5e8b0',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Frames and connects contributions to the group's shared goal in ways that move the discussion forward.",
                                    'id': 'urn:uuid:21175625-d725-409d-9c11-893d6c7f67d2',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:6e19068c-1e64-40b2-8077-b7db4dc5b4bd',
                            'name': 'COL.2 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        "Identifies challenges that disrupt a group's progress.",
                                    'id': 'urn:uuid:a2c7378b-333a-435f-8db8-c69f3e776a5d',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Makes changes to personal tasks when group challenges arise.',
                                    'id': 'urn:uuid:99ccc3a2-e99a-4cbb-9f40-00ff1dc1b297',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Discusses with the group how to adapt when challenges arise.',
                                    'id': 'urn:uuid:cad4bd0b-005b-4b6c-acc2-daf3a9353ee4',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Facilitates the group in adjusting roles, tasks, or timelines to keep shared work on track.',
                                    'id': 'urn:uuid:10b3f93f-ef0b-48b5-8ef7-fd0ad7644cd6',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:8394aa12-c94d-45ec-80ca-18bb82bef67a',
                            'name': 'COL.3 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        "Shows awareness of other group members' feelings or perspectives.",
                                    'id': 'urn:uuid:5abdb95e-37cd-436e-8e04-e1f3bd7e25a6',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Responds to a group member's feelings or needs when asked.",
                                    'id': 'urn:uuid:bfad17ba-59ef-4259-bfc1-43a171d1a73a',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Proactively checks in on group members' well-being and adjusts behavior in response.",
                                    'id': 'urn:uuid:80a43193-a3b5-460c-94eb-f2e45d926894',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        "Builds and sustains trust within the group by consistently attending to members' needs and perspectives.",
                                    'id': 'urn:uuid:4b377918-f773-46c6-9f28-2a8056aeece4',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:de9c3583-e756-4228-a159-0fa808da6931',
                            'name': 'CT.1 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Seeks out sources of information relevant to a question.',
                                    'id': 'urn:uuid:f3fa1cb4-d460-400f-9620-86597b6e847a',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Uses basic search terms to locate a relevant source.',
                                    'id': 'urn:uuid:8ec3ece7-41a4-4a1b-9b3d-7dc89a8f5bf2',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Uses varied search terms to locate multiple relevant sources, some of which are credible.',
                                    'id': 'urn:uuid:ec16d33f-c4c3-448a-8f24-84f4252d1f99',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Locates multiple credible sources using varied search strategies and evaluates them by their content.',
                                    'id': 'urn:uuid:702095a3-fbb9-4c78-a3ab-5eade18d5026',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:d27d3c20-9587-4039-8d28-b484d744e70a',
                            'name': 'CT.2 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Identifies the evidence used to support a conclusion.',
                                    'id': 'urn:uuid:545cca51-48e3-416b-9534-9aab1b25760c',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Recognizes when evidence is relevant to a conclusion.',
                                    'id': 'urn:uuid:2f991c01-0ad8-411e-883e-7ef967477007',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Distinguishes between weaker and stronger evidence used to form a conclusion.',
                                    'id': 'urn:uuid:c521eb29-f682-4b53-967b-78d91332ca43',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Distinguishes between weaker and stronger evidence and articulates specific, defensible reasons for that evaluation.',
                                    'id': 'urn:uuid:7c9ecaef-b970-4344-9eaf-3192c51cdb78',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:e72cf75e-a82c-4f08-afcc-565981b2562f',
                            'name': 'CT.3 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description': 'States a claim without supporting reasoning.',
                                    'id': 'urn:uuid:8be35d20-0a12-4c22-bc4b-0700a9c50b30',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'States a claim and offers a reason to support it.',
                                    'id': 'urn:uuid:0290cc4e-0137-423b-ac6b-a8f315d20d73',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Builds an argument that connects a claim to evidence with clear reasoning.',
                                    'id': 'urn:uuid:9f0d679c-9708-4753-ad9e-06b411ce9d2c',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Constructs a well-reasoned argument that anticipates and addresses counterclaims.',
                                    'id': 'urn:uuid:cbfd1a2f-6a6c-43ef-b6ee-2c03c2051375',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
                            'type': ['ResultDescription'],
                        },
                        {
                            'allowedValue': ['Exploring', 'Analyzing', 'Integrating', 'Extending'],
                            'id': 'urn:uuid:7dfdbbb1-4e93-4e70-acd4-4fb1818cde62',
                            'name': 'CT.4 progression level',
                            'resultType': 'RubricCriterionLevel',
                            'rubricCriterionLevel': [
                                {
                                    'description':
                                        'Recognizes whether a conclusion follows from a stated premise.',
                                    'id': 'urn:uuid:1fca751c-9085-48d0-9021-65ce9b5ef45f',
                                    'level': 'Exploring',
                                    'name': 'Exploring',
                                    'points': '1',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Identifies a gap or flaw in a simple line of reasoning.',
                                    'id': 'urn:uuid:e5a547c6-63d6-439f-b385-1a1c1770c548',
                                    'level': 'Analyzing',
                                    'name': 'Analyzing',
                                    'points': '2',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Constructs a logical chain of reasoning from premises to a conclusion.',
                                    'id': 'urn:uuid:8197dc2b-cfb7-4fe7-b0a6-e46f4039f32b',
                                    'level': 'Integrating',
                                    'name': 'Integrating',
                                    'points': '3',
                                    'type': ['RubricCriterionLevel'],
                                },
                                {
                                    'description':
                                        'Evaluates and strengthens the logical structure of an argument, identifying and correcting flawed reasoning.',
                                    'id': 'urn:uuid:61f74355-5ca7-46be-99f8-c68af415ca70',
                                    'level': 'Extending',
                                    'name': 'Extending',
                                    'points': '4',
                                    'type': ['RubricCriterionLevel'],
                                },
                            ],
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
                                'id': 'urn:uuid:e9168aa2-c8ad-4022-8319-16727739cdba',
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
                                'id': 'urn:uuid:c84ab45f-d639-46f5-8066-44dc835658e6',
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
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.1',
                                    'targetDescription':
                                        'Cite strong and thorough textual evidence to support analysis of what a text says explicitly.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Cite Textual Evidence',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.2',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.2',
                                    'targetDescription':
                                        'Determine a theme or central idea of a text and analyze its development over the course of the text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Determine Theme',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.1',
                                    'targetDescription':
                                        'Write arguments to support claims using valid reasoning and relevant, sufficient evidence.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Write Arguments',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.9-10.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.9-10.1',
                                    'targetDescription':
                                        'Demonstrate command of the conventions of standard English grammar and usage when writing.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Command of Grammar and Usage',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.9-10.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.9-10.1',
                                    'targetDescription':
                                        'Initiate and participate effectively in a range of collaborative discussions.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Collaborative Discussions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                                'id': 'urn:uuid:5c224e58-13c6-4a75-aef4-1d1e92726bbd',
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
                                'id': 'urn:uuid:87141ae9-b896-4721-929b-38326f9bc183',
                                'resultDescription':
                                    'urn:uuid:4ae2b748-4dff-407f-b49e-48caa8633680',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:87bbb821-8a8e-4e3e-9751-462dc8e0400b',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.1.9-12',
                                    'targetCode': 'D2.Geo.1.9-12',
                                    'targetDescription':
                                        'Use maps and other representations to explain relationships between the locations of places and regions.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Analyze Spatial Relationships',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.4.9-12',
                                    'targetCode': 'D2.Geo.4.9-12',
                                    'targetDescription':
                                        'Analyze relationships and interactions within and between human and physical systems.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Human-Environment Interaction',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.7.9-12',
                                    'targetCode': 'D2.Geo.7.9-12',
                                    'targetDescription':
                                        'Analyze the reciprocal nature of how historical events and processes have shaped human and physical environments.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Geography and Historical Change',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Geo.11.9-12',
                                    'targetCode': 'D2.Geo.11.9-12',
                                    'targetDescription':
                                        'Evaluate the influence of long-term climate variability on human migration and settlement patterns.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Migration and Settlement Patterns',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:42d339e6-0f26-4c22-b6d0-f4ed99de8442',
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
                                'id': 'urn:uuid:23fb4a51-f2d4-4d89-9984-18789c99c957',
                                'resultDescription':
                                    'urn:uuid:ca20b8da-3491-45a9-b34e-c283cf898eff',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:bfe3c180-4d1c-4941-9a50-a0767194833f',
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
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-retrieve-data',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to retrieve data for a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Access an API to Retrieve Data',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/adapt-to-changing-requirements',
                                    'targetDescription':
                                        'Adapt to changing requirements through task or behavior adjustment.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Adapt to Changing Requirements',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/analyze-complex-problems',
                                    'targetDescription': 'Analyze a complex problem.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Analyze Complex Problems',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/differentiate-array-and-arraylist-data-structures',
                                    'targetDescription':
                                        'Differentiate between Array and ArrayList data structures.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName':
                                        'Differentiate Array and ArrayList Data Structures',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-backend-applications',
                                    'targetDescription':
                                        'Create backend online applications using Node.js.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Create Backend Applications',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                                'id': 'urn:uuid:ac87353a-f6b2-407b-bb78-e7b1c17c52fe',
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
                                'id': 'urn:uuid:60aa0e91-e738-4c7d-a8f9-847fc0285c1e',
                                'resultDescription':
                                    'urn:uuid:5da40141-4e92-4c8d-9883-9760646bc811',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:95935bdd-8741-48c0-a9b3-9dae1c2dac2c',
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
                                    'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/address-hacking-threats',
                                    'targetDescription':
                                        'Address hacking threats via physical hardware security, asset inventory, device, and patch management.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetName': 'Address Hacking Threats',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/design-access-and-physical-security-protocols',
                                    'targetDescription':
                                        'Design access and physical security protocols where users have only the access required to complete their assigned tasks.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetName': 'Design Access and Physical Security Protocols',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/implement-advanced-security-technology',
                                    'targetDescription':
                                        'Implement advanced security technologies and tools to detect and prevent data loss and exposure.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetName': 'Implement Advanced Security Technology',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/detect-adverse-events',
                                    'targetDescription':
                                        'Detect adverse events using cyber defense tools.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetName': 'Detect Adverse Events',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662/analyze-attack-trends',
                                    'targetDescription':
                                        'Analyze collected security data to determine attack trends in systems.',
                                    'targetFramework': 'WGU Open Skills - Cybersecurity',
                                    'targetName': 'Analyze Attack Trends',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/3cc1f145-a9c1-4d3c-8ab4-c08de1b08662',
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
                                'id': 'urn:uuid:dab2f734-a0d2-498f-a3f2-27e5b22465f8',
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
                                'id': 'urn:uuid:14bdb627-0abd-4f3e-8d55-1be1212a224f',
                                'resultDescription':
                                    'urn:uuid:098e12e6-87f1-44fb-9818-889a5542408c',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:f8cf79cc-fe0d-41ea-acc5-88a63f180143',
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
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-CED.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-CED.A.1',
                                    'targetDescription':
                                        'Create equations and inequalities in one variable and use them to solve problems.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Create Equations in One Variable',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.B.3',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.B.3',
                                    'targetDescription':
                                        'Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Solve Linear Equations and Inequalities',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-SSE.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-SSE.A.1',
                                    'targetDescription':
                                        'Interpret expressions that represent a quantity in terms of its context.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Interpret Expressions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSF-IF.A.2',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.A.2',
                                    'targetDescription':
                                        'Use function notation, evaluate functions for inputs in their domains.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Use Function Notation',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.D.10',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.D.10',
                                    'targetDescription':
                                        'Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Graph Equations in Two Variables',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
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
                                'id': 'urn:uuid:17a74606-c11a-4d3b-aeeb-6b25b686b995',
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
                                'id': 'urn:uuid:50bec6ce-121f-4a37-9964-aea1392b1b6b',
                                'resultDescription':
                                    'urn:uuid:a7dee52d-d599-4e5b-941f-579c3b776088',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:f0b602f0-82c0-4f09-9876-73e88ca2f915',
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
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-1',
                                    'targetCode': 'Standard 1',
                                    'targetDescription':
                                        'Demonstrates competency in a variety of motor skills and movement patterns.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Motor Skill Competency',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-2',
                                    'targetCode': 'Standard 2',
                                    'targetDescription':
                                        'Applies knowledge of concepts, principles, strategies and tactics related to movement and performance.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Movement Concepts and Strategies',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-3',
                                    'targetCode': 'Standard 3',
                                    'targetDescription':
                                        'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Health-Enhancing Fitness',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
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
                                'id': 'urn:uuid:8ba351b2-31e0-491e-a963-a27c601088cf',
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
                                'id': 'urn:uuid:a3126ae4-9db7-49f9-b9c2-d3b1eb8a667f',
                                'resultDescription':
                                    'urn:uuid:210e4208-10f0-4152-8437-3e37a1901645',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:fff5a14f-61bd-490f-b7c8-96c9d0946c75',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.3.9-12',
                                    'targetCode': 'D2.Civ.3.9-12',
                                    'targetDescription':
                                        'Analyze the impact of constitutions, laws, treaties, and international agreements on the maintenance of national and international order.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Constitutions, Laws, and Agreements',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.8.9-12',
                                    'targetCode': 'D2.Civ.8.9-12',
                                    'targetDescription':
                                        'Evaluate social and political systems in different contexts, times, and places that promote civic virtues and enact democratic principles.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Civic Virtues Across Systems',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.12.9-12',
                                    'targetCode': 'D2.Civ.12.9-12',
                                    'targetDescription':
                                        'Analyze how people use and challenge laws to address a variety of public issues.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Using and Challenging Laws',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:be165eb7-39b8-41c5-bc0d-c9064ad8cd4d',
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
                                'id': 'urn:uuid:f3da8a83-9809-4b82-9e2b-34779977cbe8',
                                'resultDescription':
                                    'urn:uuid:e1e9ebb1-3caa-4218-bca5-6ccce93e3f47',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:77e5c55f-cc65-458e-8359-1ec7c96570d7',
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
                                    'id': 'https://www.nextgenscience.org/HS-LS1-1',
                                    'targetCode': 'HS-LS1-1',
                                    'targetDescription':
                                        'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'DNA and Protein Structure',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS1-2',
                                    'targetCode': 'HS-LS1-2',
                                    'targetDescription':
                                        'Develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Hierarchical Organization of Organisms',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS2-1',
                                    'targetCode': 'HS-LS2-1',
                                    'targetDescription':
                                        'Use mathematical and/or computational representations to support explanations of factors that affect carrying capacity of ecosystems.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Carrying Capacity of Ecosystems',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS4-2',
                                    'targetCode': 'HS-LS4-2',
                                    'targetDescription':
                                        'Construct an explanation based on evidence that the process of evolution primarily results from four factors.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Factors Driving Evolution',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS1-4',
                                    'targetCode': 'HS-LS1-4',
                                    'targetDescription':
                                        'Use a model to illustrate the role of cellular division and differentiation in producing and maintaining complex organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Cellular Division and Differentiation',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
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
                                'id': 'urn:uuid:99835478-94a8-40ee-810c-9f84b7ac8beb',
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
                                'id': 'urn:uuid:164c1813-09b9-4684-83dd-567e5718c499',
                                'resultDescription':
                                    'urn:uuid:0f7af524-d85b-454a-a65d-cf4bd4caca2a',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:2db15c99-599d-413c-aca1-4619b3857f04',
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
                                    'id': 'https://www.nextgenscience.org/HS-PS1-1',
                                    'targetCode': 'HS-PS1-1',
                                    'targetDescription':
                                        'Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Periodic Table and Electron Patterns',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-PS1-2',
                                    'targetCode': 'HS-PS1-2',
                                    'targetDescription':
                                        'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Explain Chemical Reaction Outcomes',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-PS1-4',
                                    'targetCode': 'HS-PS1-4',
                                    'targetDescription':
                                        'Develop a model to illustrate that the release or absorption of energy from a chemical reaction system depends on the changes in total bond energy.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Model Energy in Chemical Reactions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-PS1-7',
                                    'targetCode': 'HS-PS1-7',
                                    'targetDescription':
                                        'Use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Conservation of Mass',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-PS1-5',
                                    'targetCode': 'HS-PS1-5',
                                    'targetDescription':
                                        'Apply scientific principles and evidence to provide an explanation about the effects of changing temperature or concentration on reaction rate.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Factors Affecting Reaction Rate',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
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
                                'id': 'urn:uuid:03970a24-ca14-49c9-9a45-8b622bee0463',
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
                                'id': 'urn:uuid:e2bddd61-b54a-455e-815b-8474e85992d3',
                                'resultDescription':
                                    'urn:uuid:88156d11-f7aa-4dbb-9651-0050d39c0aa9',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:84368267-2651-4463-99c3-52d6be6fe1a3',
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
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-3',
                                    'targetCode': 'Standard 3',
                                    'targetDescription':
                                        'Demonstrates the knowledge and skills to achieve and maintain a health-enhancing level of physical activity and fitness.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Health-Enhancing Fitness',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-4',
                                    'targetCode': 'Standard 4',
                                    'targetDescription':
                                        'Exhibits responsible personal and social behavior that respects self and others.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Personal and Social Responsibility',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.shapeamerica.org/standards/pe/Standard-5',
                                    'targetCode': 'Standard 5',
                                    'targetDescription':
                                        'Recognizes the value of physical activity for health, enjoyment, challenge, self-expression, and/or social interaction.',
                                    'targetFramework':
                                        'SHAPE America National Standards for K-12 Physical Education',
                                    'targetName': 'Value of Physical Activity',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.shapeamerica.org/standards/pe/',
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
                                'id': 'urn:uuid:d5902cb9-6c8a-4199-8985-de1cbb069202',
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
                                'id': 'urn:uuid:6f5ffe23-492a-45eb-af46-cdd87f75dde5',
                                'resultDescription':
                                    'urn:uuid:5317a828-76df-42df-8e08-67ed2eb209f2',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:c944daba-d844-4d57-a1cd-a610c71bcf6f',
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
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.9-10.3',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.9-10.3',
                                    'targetDescription':
                                        'Analyze how complex characters develop over the course of a text, interact with other characters, and advance the plot.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Analyze Character Development',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.9-10.6',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.9-10.6',
                                    'targetDescription':
                                        "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric.",
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': "Analyze Author's Point of View",
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.3',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.3',
                                    'targetDescription':
                                        'Write narratives to develop real or imagined experiences using effective technique and well-structured event sequences.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Write Narratives',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.9-10.5',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.9-10.5',
                                    'targetDescription':
                                        'Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Understand Figurative Language',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.9-10.9',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.9-10.9',
                                    'targetDescription':
                                        'Draw evidence from literary or informational texts to support analysis, reflection, and research.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Draw Evidence From Texts',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                                'id': 'urn:uuid:8f2b0536-49a1-471f-8ee8-6766a6ac4d01',
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
                                'id': 'urn:uuid:3e1b4355-49a5-4d3f-9a36-137ff2021c20',
                                'resultDescription':
                                    'urn:uuid:34837572-f67b-4834-a916-25007ab148be',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:76269d1b-24a9-482d-8aef-096a5c1e58dc',
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
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-CO.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.A.1',
                                    'targetDescription':
                                        'Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Define Geometric Terms',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-CO.B.7',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-CO.B.7',
                                    'targetDescription':
                                        'Use the definition of congruence in terms of rigid motions to show two triangles are congruent.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Prove Triangle Congruence',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-SRT.B.5',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-SRT.B.5',
                                    'targetDescription':
                                        'Use congruence and similarity criteria for triangles to solve problems and prove relationships in geometric figures.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Similarity and Congruence Criteria',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-GPE.B.7',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-GPE.B.7',
                                    'targetDescription':
                                        'Use coordinates to compute perimeters of polygons and areas of triangles and rectangles.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Coordinate Geometry: Perimeter and Area',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-C.A.2',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-C.A.2',
                                    'targetDescription':
                                        'Identify and describe relationships among inscribed angles, radii, and chords.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Inscribed Angle and Circle Relationships',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
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
                                'id': 'urn:uuid:f667bdd0-18ba-43df-98db-c6111791a32e',
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
                                'id': 'urn:uuid:94006fd3-d062-42a8-b562-8a18d069bff6',
                                'resultDescription':
                                    'urn:uuid:c4d357cc-1c18-4af0-9ad6-121cb43b5ffd',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:cb7c1f88-1417-4e11-8962-1adb83e3d567',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.1.9-12',
                                    'targetCode': 'D2.His.1.9-12',
                                    'targetDescription':
                                        'Evaluate how historical events and developments were shaped by unique circumstances of time and place.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Historical Context of Events',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.3.9-12',
                                    'targetCode': 'D2.His.3.9-12',
                                    'targetDescription':
                                        'Use questions generated about multiple historical sources to pursue further investigation.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Generate Historical Questions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.14.9-12',
                                    'targetCode': 'D2.His.14.9-12',
                                    'targetDescription':
                                        'Analyze multiple and complex causes and effects of events in the past.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Analyze Causes and Effects',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.16.9-12',
                                    'targetCode': 'D2.His.16.9-12',
                                    'targetDescription':
                                        'Integrate evidence from multiple relevant historical sources and interpretations into a reasoned argument.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Construct Historical Arguments',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:835d5f46-ca69-4e32-a576-555d665b418b',
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
                                'id': 'urn:uuid:cd1a9fd1-f163-4a39-b574-50966e255828',
                                'resultDescription':
                                    'urn:uuid:7c524d10-788e-4900-9b07-c3ba74fad6a1',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:a10cf9b5-c83e-4f59-b52c-99bdea4594eb',
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
                                    'id': 'https://www.actfl.org/Standard-2.1',
                                    'targetCode': 'Standard 2.1',
                                    'targetDescription':
                                        'Demonstrate an understanding of the relationship between the practices and perspectives of the culture studied.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Cultural Practices and Perspectives',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-2.2',
                                    'targetCode': 'Standard 2.2',
                                    'targetDescription':
                                        'Demonstrate an understanding of the relationship between the products and perspectives of the culture studied.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Cultural Products and Perspectives',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-3.1',
                                    'targetCode': 'Standard 3.1',
                                    'targetDescription':
                                        'Use the language to reinforce and further knowledge of other disciplines.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Making Interdisciplinary Connections',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-5.1',
                                    'targetCode': 'Standard 5.1',
                                    'targetDescription':
                                        'Use the language both within and beyond the school setting.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Language Use Beyond the Classroom',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
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
                                'id': 'urn:uuid:c6274e6b-3225-43a2-920d-8076371965f5',
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
                                'id': 'urn:uuid:3c379ec4-c1ee-47f5-984e-e31d4e227505',
                                'resultDescription':
                                    'urn:uuid:cb4df6ee-28fc-4dc9-b527-dbc5852efdd2',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:1975d9a7-5633-4af6-bc01-39d3d64074f1',
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
                                    'id': 'https://www.actfl.org/Standard-1.1',
                                    'targetCode': 'Standard 1.1',
                                    'targetDescription':
                                        'Engage in conversations, provide and obtain information, express feelings and emotions, and exchange opinions.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Interpersonal Communication',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-1.2',
                                    'targetCode': 'Standard 1.2',
                                    'targetDescription':
                                        'Understand and interpret spoken and written language on a variety of topics.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Interpretive Communication',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-1.3',
                                    'targetCode': 'Standard 1.3',
                                    'targetDescription':
                                        'Present information, concepts, and ideas to an audience of listeners or readers on a variety of topics.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Presentational Communication',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.actfl.org/Standard-4.1',
                                    'targetCode': 'Standard 4.1',
                                    'targetDescription':
                                        'Demonstrate understanding of the nature of language through comparisons of the language studied and their own.',
                                    'targetFramework':
                                        'ACTFL World-Readiness Standards for Learning Languages',
                                    'targetName': 'Comparing Language Structures',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.actfl.org/',
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
                                'id': 'urn:uuid:c3c7856c-a816-4364-8756-d645097f4742',
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
                                'id': 'urn:uuid:0b036777-01ba-4ac8-bf21-ce7ae38427e6',
                                'resultDescription':
                                    'urn:uuid:79641812-076f-4f48-b827-4a0be23e5614',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:b971fcfa-d679-4d95-a180-533b3b9ffb46',
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
                                    'id': 'https://www.nextgenscience.org/HS-LS3-1',
                                    'targetCode': 'HS-LS3-1',
                                    'targetDescription':
                                        'Ask questions to clarify relationships about the role of DNA and chromosomes in coding instructions for characteristic traits.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'DNA and Chromosomes in Inheritance',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS3-2',
                                    'targetCode': 'HS-LS3-2',
                                    'targetDescription':
                                        'Make and defend a claim based on evidence that inheritable genetic variations may result from new genetic combinations, mutation, or environmental factors.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Sources of Genetic Variation',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS2-6',
                                    'targetCode': 'HS-LS2-6',
                                    'targetDescription':
                                        'Evaluate claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Ecosystem Stability Evidence',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS2-7',
                                    'targetCode': 'HS-LS2-7',
                                    'targetDescription':
                                        'Design, evaluate, and refine a solution for reducing the impacts of human activities on the environment.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Design Solutions to Reduce Human Impact',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nextgenscience.org/HS-LS4-4',
                                    'targetCode': 'HS-LS4-4',
                                    'targetDescription':
                                        'Construct an explanation based on evidence for how natural selection leads to adaptation of populations.',
                                    'targetFramework': 'Next Generation Science Standards',
                                    'targetName': 'Natural Selection and Adaptation',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nextgenscience.org/',
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
                                'id': 'urn:uuid:7c4bd3f2-42ef-4561-8ccf-f9682693f717',
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
                                'id': 'urn:uuid:d34acd36-a23f-4028-b8c9-8604d344a24b',
                                'resultDescription':
                                    'urn:uuid:59b8492f-2126-46de-bf90-543ea15000f0',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:6990391f-fb32-44ea-8860-ba3b2990f242',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.2.9-12',
                                    'targetCode': 'D2.His.2.9-12',
                                    'targetDescription':
                                        'Analyze change and continuity in historical eras.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Change and Continuity in Eras',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.5.9-12',
                                    'targetCode': 'D2.His.5.9-12',
                                    'targetDescription':
                                        "Analyze how historical contexts shaped and continue to shape people's perspectives.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Historical Context and Perspective',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.His.12.9-12',
                                    'targetCode': 'D2.His.12.9-12',
                                    'targetDescription':
                                        'Analyze the relationship between historical sources and the secondary interpretations made from them.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Sources and Interpretations',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.10.9-12',
                                    'targetCode': 'D2.Civ.10.9-12',
                                    'targetDescription':
                                        'Analyze the impact and the appropriate use of power in the United States and other nations.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Analyzing the Use of Power',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:80830c70-fdc0-472f-81fd-de93a59500f3',
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
                                'id': 'urn:uuid:e073d9a0-bab2-4b16-b83e-567ecc6d4933',
                                'resultDescription':
                                    'urn:uuid:076caf2e-cd87-4ae1-89f7-1a15c03c6a21',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:0ec5bf1e-a685-4640-9284-04cef9728902',
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
                                    'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/identify-application-development-software',
                                    'targetDescription':
                                        'Identify appropriate software for developing web, desktop, or mobile applications.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetName': 'Identify Application Development Software',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/create-client-server-systems',
                                    'targetDescription':
                                        'Create client-server systems using object-oriented programming.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetName': 'Create Client-Server Systems',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/track-and-address-bug-fixes',
                                    'targetDescription': 'Track and address bug fixes.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetName': 'Track and Address Bug Fixes',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/identify-software-design-requirements',
                                    'targetDescription':
                                        'Identify business requirements for software design.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetName': 'Identify Software Design Requirements',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf/collaborative-troubleshooting',
                                    'targetDescription':
                                        'Collaborate on troubleshooting software problems.',
                                    'targetFramework': 'WGU Open Skills - Software Engineering',
                                    'targetName': 'Collaborative Troubleshooting',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/aa9149fe-d86f-42af-9c3d-eadc6081fedf',
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
                                'id': 'urn:uuid:722665b3-b59e-4c3e-b01d-9c9116c4e256',
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
                                'id': 'urn:uuid:787ca18f-35eb-4822-9ff4-ccfd8acaa15c',
                                'resultDescription':
                                    'urn:uuid:83b950d8-57c7-4323-864b-880ebd4f985c',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:f410157c-02ae-4281-82e6-7dd402402de9',
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
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-APR.B.3',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-APR.B.3',
                                    'targetDescription':
                                        'Identify zeros of polynomials and use the zeros to construct a rough graph of the function.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Zeros of Polynomials',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSF-IF.C.7C',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSF-IF.C.7C',
                                    'targetDescription':
                                        'Graph polynomial functions, identifying zeros when suitable factorizations are available.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Graph Polynomial Functions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-CP.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.A.1',
                                    'targetDescription':
                                        'Describe events as subsets of a sample space using characteristics of the outcomes.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Describe Events as Sample Spaces',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-CP.B.9',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-CP.B.9',
                                    'targetDescription':
                                        'Use permutations and combinations to compute probabilities of compound events.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Permutations and Combinations',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSA-REI.A.2',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSA-REI.A.2',
                                    'targetDescription':
                                        'Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Solve Rational and Radical Equations',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
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
                                'id': 'urn:uuid:7103098e-f25c-4a77-ad41-94847b1f4a46',
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
                                'id': 'urn:uuid:bd39b81b-9f71-48e0-bbbc-3ada310c9f6c',
                                'resultDescription':
                                    'urn:uuid:893ca7a8-03be-4720-8026-17eeb83266fd',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:2de8cbcc-ce71-42c9-8528-c7870bcafeb6',
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
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-MG.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-MG.A.1',
                                    'targetDescription':
                                        'Use geometric shapes, their measures, and their properties to describe objects.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Geometric Modeling',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSG-GMD.A.3',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSG-GMD.A.3',
                                    'targetDescription':
                                        'Use volume formulas for cylinders, pyramids, cones, and spheres to solve problems.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Volume Formulas',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.A.1',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.1',
                                    'targetDescription':
                                        'Represent data with plots on the real number line (dot plots, histograms, and box plots).',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Represent Data with Plots',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.B.6',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.B.6',
                                    'targetDescription':
                                        'Represent data on two quantitative variables on a scatter plot, and describe how the variables are related.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Summarize Two-Variable Data',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/Math/CCSS.MATH.CONTENT.HSS-ID.A.4',
                                    'targetCode': 'CCSS.MATH.CONTENT.HSS-ID.A.4',
                                    'targetDescription':
                                        'Use the mean and standard deviation of a data set to fit it to a normal distribution.',
                                    'targetFramework':
                                        'Common Core State Standards for Mathematics',
                                    'targetName': 'Fit Data to a Normal Distribution',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/Math/',
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
                                'id': 'urn:uuid:6f9b216e-389f-4e03-8829-b389f619afa3',
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
                                'id': 'urn:uuid:993bc22f-4387-48a2-b082-dfcd38070af0',
                                'resultDescription':
                                    'urn:uuid:a724f76a-0b47-499b-ab47-3ba658bc401c',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:b9616d7c-563c-438b-b9f6-bdcd04e8964b',
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
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.2',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.2',
                                    'targetDescription':
                                        'Determine two or more themes or central ideas of a text and analyze their development over the course of the text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Analyze Theme Development',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.11-12.7',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.7',
                                    'targetDescription':
                                        'Integrate and evaluate multiple sources of information presented in different media or formats.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Integrate Multiple Sources',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.1',
                                    'targetDescription':
                                        'Write arguments to support claims using valid reasoning and sufficient evidence.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Write Arguments with Sufficient Evidence',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.11-12.4',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.4',
                                    'targetDescription':
                                        'Present information, findings, and supporting evidence clearly, concisely, and logically.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Present Findings Clearly',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.L.11-12.3',
                                    'targetCode': 'CCSS.ELA-LITERACY.L.11-12.3',
                                    'targetDescription':
                                        'Apply knowledge of language to understand how language functions in different contexts.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Apply Knowledge of Language',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                                'id': 'urn:uuid:ac1f9e74-0282-45a0-919e-1231f98b1651',
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
                                'id': 'urn:uuid:7a2b65d0-a79e-42e5-9246-22ba52998367',
                                'resultDescription':
                                    'urn:uuid:c7157447-ed74-4882-b6d1-4cb94f25410b',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:b88411fa-cbc0-4af2-b2dc-694c34b096d3',
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
                                    'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/analyze-market-trends',
                                    'targetDescription':
                                        'Analyze market trends, competitor activities and customer needs to develop business plans and proposals.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetName': 'Analyze Market Trends',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-relationships-with-investors',
                                    'targetDescription': 'Build relationships with investors.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetName': 'Build Relationships With Investors',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-customer-loyalty',
                                    'targetDescription': 'Build customer loyalty.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetName': 'Build Customer Loyalty',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/manage-business-cash-flow',
                                    'targetDescription': 'Manage cash flow in a business.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetName': 'Manage Business Cash Flow',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355/build-business-relationships',
                                    'targetDescription': 'Build business relationships.',
                                    'targetFramework': 'WGU Open Skills - Entrepreneurs',
                                    'targetName': 'Build Business Relationships',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/4f8095e2-afb0-48cf-bb30-d1d135899355',
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
                                'id': 'urn:uuid:00f9f6ef-36a3-4f57-9496-52a4c498564d',
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
                                'id': 'urn:uuid:2169c133-98a4-4a13-af93-c9bbadf02a35',
                                'resultDescription':
                                    'urn:uuid:a35b5993-e54e-4f59-a20a-34fb48fc06a3',
                                'type': ['Result'],
                                'value': 'BC',
                            },
                            {
                                'id': 'urn:uuid:ddf40cc9-312f-402d-969a-361bf2a5d27d',
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
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/apply-design-principles',
                                    'targetDescription':
                                        'Apply knowledge of design principles and best practices to create visually cohesive and aesthetically pleasing designs using digital tools.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Apply Design Principles',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/demonstrate-empathy-for-users',
                                    'targetDescription':
                                        'Demonstrate empathy for users to inform solutions to design problems.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Demonstrate Empathy for Users',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/apply-design-thinking-methodologies',
                                    'targetDescription':
                                        'Apply design thinking methodologies to develop innovative solutions.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Apply Design Thinking Methodologies',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/create-low-fidelity-prototypes',
                                    'targetDescription': 'Create a low-fidelity prototype.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Create Low-Fidelity Prototypes',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/conduct-user-research',
                                    'targetDescription':
                                        "Conduct user research to understand target audiences' preferences and behaviors.",
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Conduct User Research',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
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
                                'id': 'urn:uuid:d3530d7c-ca5f-437e-82b7-43c21ca0d130',
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
                                'id': 'urn:uuid:df1920ba-431a-40b7-a4df-929f87530d84',
                                'resultDescription':
                                    'urn:uuid:9d7f8e42-713d-46c3-8287-baf80ccaedde',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:d3b72ca8-fdd6-4e48-8ec1-94fabaf84a79',
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
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/create-intuitive-interfaces',
                                    'targetDescription':
                                        'Create intuitive and user-friendly interfaces that align with business goals and target audience expectations.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Create Intuitive Interfaces',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/leverage-prototyping-tools',
                                    'targetDescription':
                                        'Leverage prototyping tools to create interactive digital prototypes and mockups.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Leverage Prototyping Tools',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/develop-a-prototype-strategy',
                                    'targetDescription':
                                        'Identify inputs for a prototype strategy.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Develop a Prototype Strategy',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/test-prototypes-against-requirements',
                                    'targetDescription':
                                        'Test a prototype against defined product requirements.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Test Prototypes Against Requirements',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36/product-design-strategy',
                                    'targetDescription':
                                        'Identify the optimal approach to introduce a new product into the marketplace.',
                                    'targetFramework':
                                        'WGU Open Skills - Product and Experience Design',
                                    'targetName': 'Product Design Strategy',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/f5910830-a387-446a-9b00-86eb141d1d36',
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
                                'id': 'urn:uuid:b3ed97b4-ca9f-4a3f-a4ab-c1abcd2eb22e',
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
                                'id': 'urn:uuid:1ceb4a41-8385-4c7e-8638-34e9b81021eb',
                                'resultDescription':
                                    'urn:uuid:bc7cbddd-0a87-45d0-a778-2fad084f964b',
                                'type': ['Result'],
                                'value': 'D',
                            },
                            {
                                'id': 'urn:uuid:36af0b42-26b9-43be-a11a-a7dcd1062963',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.1.9-12',
                                    'targetCode': 'D2.Civ.1.9-12',
                                    'targetDescription':
                                        'Distinguish the powers and responsibilities of local, state, tribal, national, and international civic and political institutions.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Powers of Civic Institutions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.5.9-12',
                                    'targetCode': 'D2.Civ.5.9-12',
                                    'targetDescription':
                                        "Evaluate citizens' and institutions' effectiveness in addressing social and political problems.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Effectiveness of Civic Institutions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.6.9-12',
                                    'targetCode': 'D2.Civ.6.9-12',
                                    'targetDescription':
                                        'Critique relationships among governments, civil societies, and economic markets.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Governments, Civil Society, and Markets',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Civ.14.9-12',
                                    'targetCode': 'D2.Civ.14.9-12',
                                    'targetDescription':
                                        'Analyze historical, contemporary, and emerging means of changing societies, promoting the common good, and protecting rights.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Means of Changing Society',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:353c7aa5-b91f-45c1-b3f5-78dc0f3ed067',
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
                                'id': 'urn:uuid:10891e3f-2cb8-4e7d-84a8-22b3bbb72d80',
                                'resultDescription':
                                    'urn:uuid:8bd28b48-2a65-408e-b6a8-f1b2c09509cf',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:48af4a3e-529f-4615-a60a-a47dec8c3dfa',
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
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.6',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.6',
                                    'targetDescription':
                                        'Analyze a case in which grasping point of view requires distinguishing what is directly stated from what is really meant.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Analyze Point of View',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.7',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.7',
                                    'targetDescription':
                                        'Conduct short as well as more sustained research projects to answer a question or solve a problem.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Conduct Research Projects',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RI.11-12.8',
                                    'targetCode': 'CCSS.ELA-LITERACY.RI.11-12.8',
                                    'targetDescription':
                                        'Delineate and evaluate the reasoning in seminal texts, assessing the validity of the reasoning.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Evaluate Reasoning in Texts',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.W.11-12.4',
                                    'targetCode': 'CCSS.ELA-LITERACY.W.11-12.4',
                                    'targetDescription':
                                        'Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Produce Clear and Coherent Writing',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.SL.11-12.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.SL.11-12.1',
                                    'targetDescription':
                                        "Initiate and participate effectively in a range of collaborative discussions, building on others' ideas.",
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Engage in Collaborative Discussions',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                                'id': 'urn:uuid:8da3add6-6e84-4de8-9724-e85afa66c893',
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
                                'id': 'urn:uuid:2fac6129-ecda-4f22-a976-2d39a570d1a9',
                                'resultDescription':
                                    'urn:uuid:e34ff4d2-9ed1-4c01-b65f-943c225912bc',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:fc93326b-27e8-4ad3-bc77-31b69ddaf688',
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
                                    'id': 'https://www.nationalartsstandards.org/Anchor-Standard-7',
                                    'targetCode': 'Anchor Standard 7',
                                    'targetDescription': 'Perceive and analyze artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetName': 'Perceive and Analyze Artistic Work',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nationalartsstandards.org/Anchor-Standard-8',
                                    'targetCode': 'Anchor Standard 8',
                                    'targetDescription':
                                        'Interpret intent and meaning in artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetName': 'Interpret Intent and Meaning',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nationalartsstandards.org/Anchor-Standard-9',
                                    'targetCode': 'Anchor Standard 9',
                                    'targetDescription':
                                        'Apply criteria to evaluate artistic work.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetName': 'Apply Criteria to Evaluate Art',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.nationalartsstandards.org/Anchor-Standard-11',
                                    'targetCode': 'Anchor Standard 11',
                                    'targetDescription':
                                        'Relate artistic ideas and works with societal, cultural, and historical context to deepen understanding.',
                                    'targetFramework': 'National Core Arts Standards',
                                    'targetName': 'Connect Art to Historical Context',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.nationalartsstandards.org/',
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
                                'id': 'urn:uuid:88904be8-3a4a-4e5c-9a23-970577ba6fb8',
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
                                'id': 'urn:uuid:236ae91c-7fb4-475a-afc8-729387d3bfb4',
                                'resultDescription':
                                    'urn:uuid:b22d5ca7-20ab-48c9-9966-d6cd33793778',
                                'type': ['Result'],
                                'value': 'C',
                            },
                            {
                                'id': 'urn:uuid:e31b289b-ac7e-41dd-bf5c-bf9e29a7d954',
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
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.1.9-12',
                                    'targetCode': 'D2.Eco.1.9-12',
                                    'targetDescription':
                                        'Analyze how incentives influence choices that may result in policies with a range of costs and benefits for different groups.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Incentives and Policy Tradeoffs',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.2.9-12',
                                    'targetCode': 'D2.Eco.2.9-12',
                                    'targetDescription':
                                        'Use marginal benefits and marginal costs to construct an argument for or against a decision.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Marginal Benefit and Cost Analysis',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.13.9-12',
                                    'targetCode': 'D2.Eco.13.9-12',
                                    'targetDescription':
                                        'Explain why individuals and institutions specialize and trade.',
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Specialization and Trade',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.socialstudies.org/standards/c3/D2.Eco.15.9-12',
                                    'targetCode': 'D2.Eco.15.9-12',
                                    'targetDescription':
                                        "Explain how changes in monetary and fiscal policy can affect an individual's spending and saving decisions.",
                                    'targetFramework':
                                        'C3 Framework for Social Studies State Standards',
                                    'targetName': 'Monetary and Fiscal Policy Effects',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.socialstudies.org/standards/c3',
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
                                'id': 'urn:uuid:57073938-cabb-4d91-bd24-a16696e8f0d1',
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
                                'id': 'urn:uuid:af3fde4f-adba-4e5e-a467-591014a4b224',
                                'resultDescription':
                                    'urn:uuid:8a54aceb-b22c-4c82-9190-4937597a4c51',
                                'type': ['Result'],
                                'value': 'B',
                            },
                            {
                                'id': 'urn:uuid:aa7d4972-c579-4204-ae6b-a59427391694',
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
                                    'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/basic-inferential-analysis',
                                    'targetDescription': 'Perform basic inferential analyses.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetName': 'Basic Inferential Analysis',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/apply-basic-probability-and-statistics',
                                    'targetDescription': 'Apply basic probability and statistics.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetName': 'Apply Basic Probability and Statistics',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/calculate-descriptive-statistics',
                                    'targetDescription':
                                        'Calculate descriptive statistics to better understand data.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetName': 'Calculate Descriptive Statistics',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/define-distribution-properties',
                                    'targetDescription':
                                        'Define the distribution properties of a data set.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetName': 'Define Distribution Properties',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d/identify-data-set-bias',
                                    'targetDescription':
                                        'Identify any data set biases that may exist for a given statistical analysis.',
                                    'targetFramework':
                                        'WGU Open Skills - Foundations: Data Science and Analytics',
                                    'targetName': 'Identify Data Set Bias',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/1f90cce5-3905-4f08-b374-3a4f4e0a936d',
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
                                'id': 'urn:uuid:c38360f6-44b9-4bc3-b304-051d9f659801',
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
                                'id': 'urn:uuid:7b5931db-4386-4158-aa0a-d9747def4876',
                                'resultDescription':
                                    'urn:uuid:784a4a74-d423-4d06-9e1d-2f4945202842',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:dda08355-1e6d-4400-92a1-dcebc42cbd16',
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
                                'id': 'urn:uuid:22a60e3b-dd3c-4eca-996b-277826a24ca8',
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
                                'id': 'urn:uuid:20735dac-b5a9-4041-99f0-9868a2ffabd9',
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
                                'id': 'urn:uuid:c4e10c83-3e74-48ff-a151-5d9da63e4c3d',
                                'resultDescription':
                                    'urn:uuid:70e18226-28fa-431e-92f9-e230ce0af6cb',
                                'type': ['Result'],
                                'value': '22',
                            },
                            {
                                'id': 'urn:uuid:e5652656-938b-4a36-b275-4e76366456e6',
                                'resultDescription':
                                    'urn:uuid:00c322d4-1291-4ba8-8300-5a89a79418ea',
                                'type': ['Result'],
                                'value': '20',
                            },
                            {
                                'id': 'urn:uuid:1e20ca42-75a2-4476-83e4-ed19c0a75e52',
                                'resultDescription':
                                    'urn:uuid:b97aa3ca-e16c-430d-adbb-826ffb6da76d',
                                'type': ['Result'],
                                'value': '23',
                            },
                            {
                                'id': 'urn:uuid:25de415f-4d8a-4d59-ac95-a7fc25907c3b',
                                'resultDescription':
                                    'urn:uuid:e9bcea1a-83f2-401a-930e-7b207d08c1d4',
                                'type': ['Result'],
                                'value': '24',
                            },
                            {
                                'id': 'urn:uuid:f566b19a-b2ea-482b-8c32-264c03c5693e',
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
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.1',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.1',
                                    'targetDescription':
                                        'Cite strong and thorough textual evidence, including where the text leaves matters uncertain, to support analysis and inferences drawn from it.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Cite Textual Evidence and Draw Inferences',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.3',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.3',
                                    'targetDescription':
                                        'Analyze the impact of the choices an author makes regarding how to develop and relate elements of a story.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': "Analyze Author's Choices in Story Elements",
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.4',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.4',
                                    'targetDescription':
                                        'Determine the meaning of words and phrases as used in the text, including figurative and connotative meanings.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Analyze Figurative and Connotative Language',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://corestandards.org/ELA-Literacy/CCSS.ELA-LITERACY.RL.11-12.7',
                                    'targetCode': 'CCSS.ELA-LITERACY.RL.11-12.7',
                                    'targetDescription':
                                        'Analyze multiple interpretations of a story, drama, or poem, evaluating how each version interprets the source text.',
                                    'targetFramework': 'Common Core State Standards for ELA',
                                    'targetName': 'Analyze Multiple Interpretations of a Text',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://corestandards.org/ELA-Literacy/',
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
                                'id': 'urn:uuid:76421a81-3956-4d8a-91de-f192a53d1969',
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
                                'id': 'urn:uuid:19f4ea7c-f17a-4ea6-a45f-3184213102e4',
                                'resultDescription':
                                    'urn:uuid:e92b7a22-389c-4ad6-83e0-accd16671089',
                                'type': ['Result'],
                                'value': 'AB',
                            },
                            {
                                'id': 'urn:uuid:244918a2-d501-48ef-9173-629062b70cfd',
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
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-change-data',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to change data for a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Access an API to Change Data',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/access-an-api-to-process-a-task',
                                    'targetDescription':
                                        'Access an application programming interface with a programming language to process a task.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Access an API to Process a Task',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/call-functions-in-c',
                                    'targetDescription':
                                        'Call functions using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Call Functions in C',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-functions-in-c',
                                    'targetDescription':
                                        'Create functions using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Create Functions in C',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/declare-variables-in-c',
                                    'targetDescription':
                                        'Declare variables using the C programming language.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Declare Variables in C',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                                'id': 'urn:uuid:1b14aa8c-acfe-46b2-91c1-9892e00d2fed',
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
                                'id': 'urn:uuid:a0dd7100-ca51-4390-9f5e-e2f413847b28',
                                'resultDescription':
                                    'urn:uuid:a3376f99-22a9-4b94-84de-7fa7afd69116',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:057177ff-9fe0-4835-af6d-8c4c15f0d188',
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
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-an-object-oriented-program-in-java',
                                    'targetDescription':
                                        'Create an object-oriented program using Java.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Create an Object-Oriented Program in Java',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-an-object-oriented-class-in-cpp',
                                    'targetDescription':
                                        'Create an object-oriented class with C++.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Create an Object-Oriented Class in C++',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/implement-object-oriented-programming-in-csharp',
                                    'targetDescription':
                                        'Implement object-oriented programming using C#.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Implement Object-Oriented Programming in C#',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/apply-iteration-loops-in-java',
                                    'targetDescription': 'Apply loops to iterate using Java.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Apply Iteration Loops in Java',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea/create-a-data-structure-map',
                                    'targetDescription': 'Create a data structure map.',
                                    'targetFramework': 'WGU Open Skills - Computer Science',
                                    'targetName': 'Create a Data Structure Map',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://osmt.wgu.edu/collections/168fae01-783d-422e-8b9f-93b9dc9102ea',
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
                                'id': 'urn:uuid:95569308-c46e-406f-8ad9-a0860d8c32fb',
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
                                'id': 'urn:uuid:1b52a41b-0c9f-4fe5-a4b7-9c0d057a9a66',
                                'resultDescription':
                                    'urn:uuid:a640b2e2-3a15-4b97-93d6-1f5f8215cdcf',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:2cdf597b-9886-4810-a211-207ed95b25bc',
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
                                    'id': 'https://www.iteea.org/stel/Engineering-Design',
                                    'targetCode': 'Engineering Design',
                                    'targetDescription':
                                        'Apply an iterative engineering design process - defining problems, developing solutions, and testing and refining prototypes - to a technological system.',
                                    'targetFramework':
                                        'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                                    'targetName': 'Apply the Engineering Design Process',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.iteea.org/stel',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.iteea.org/stel/Abilities-for-a-Technological-World',
                                    'targetCode': 'Abilities for a Technological World',
                                    'targetDescription':
                                        'Operate, maintain, and troubleshoot a technological system, diagnosing and resolving malfunctions.',
                                    'targetFramework':
                                        'ITEEA Standards for Technological and Engineering Literacy (STEL)',
                                    'targetName': 'Troubleshoot Technological Systems',
                                    'targetType': 'CFItem',
                                    'targetUrl': 'https://www.iteea.org/stel',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.faa.gov/uas/commercial_operators/part_107_landing/understand-suas-airspace-and-operating-rules',
                                    'targetCode': '14 CFR Part 107',
                                    'targetDescription':
                                        'Understand small unmanned aircraft system (sUAS) airspace classifications, operating rules, and pilot responsibilities.',
                                    'targetFramework':
                                        'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                                    'targetName': 'Understand sUAS Airspace and Operating Rules',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://www.faa.gov/uas/commercial_operators/part_107_landing',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://www.faa.gov/uas/commercial_operators/part_107_landing/conduct-pre-flight-risk-assessment',
                                    'targetCode': '14 CFR Part 107',
                                    'targetDescription':
                                        'Conduct a pre-flight risk assessment and follow safe operating procedures for small unmanned aircraft.',
                                    'targetFramework':
                                        'FAA Part 107 (Small Unmanned Aircraft Systems Rule)',
                                    'targetName': 'Conduct Pre-Flight Risk Assessment',
                                    'targetType': 'CFItem',
                                    'targetUrl':
                                        'https://www.faa.gov/uas/commercial_operators/part_107_landing',
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
                                'id': 'urn:uuid:614d7d2b-4d8a-4c36-9d59-5bc4f95fdcf4',
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
                                'id': 'urn:uuid:07fb8bb8-9493-472f-9a4b-eadb06a51cbb',
                                'resultDescription':
                                    'urn:uuid:9f06267d-f593-43bc-9954-4851ff09bd7a',
                                'type': ['Result'],
                                'value': 'A',
                            },
                            {
                                'id': 'urn:uuid:1cd089b3-700b-441c-a342-bfbd3dca6fc2',
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
                            'alignment': [
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/ed224bb6-2380-51ef-90bb-4f2d785f9d4c',
                                    'targetCode': 'COM.1',
                                    'targetDescription': 'Communication',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName':
                                        'Use multimodal forms of communication to effectively convey ideas (e.g., spoken, written, listening, visual, artistic, etc.).',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/ed224bb6-2380-51ef-90bb-4f2d785f9d4c',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/898de315-629f-5857-a521-103eb4735996',
                                    'targetCode': 'COM.3',
                                    'targetDescription': 'Communication',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Demonstrate active listening or comprehension',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/898de315-629f-5857-a521-103eb4735996',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/042535ff-fa95-53f8-aad6-2baa1cfe021c',
                                    'targetCode': 'COM.4',
                                    'targetDescription': 'Communication',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName':
                                        'Understand and leverage the social, emotional and ethical dimensions of communication',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/042535ff-fa95-53f8-aad6-2baa1cfe021c',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/b1424046-9963-53d0-a0da-93f3d9c48f58',
                                    'targetCode': 'COL.1',
                                    'targetDescription': 'Collaboration',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName':
                                        'Engage with ideas through intentional communication in service of shared goals',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/b1424046-9963-53d0-a0da-93f3d9c48f58',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/0132cddf-7ac0-55e2-8be4-8b938b490cdb',
                                    'targetCode': 'COL.2',
                                    'targetDescription': 'Collaboration',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName':
                                        'Effectively engage in and facilitate group activities and decision-making toward shared goal',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/0132cddf-7ac0-55e2-8be4-8b938b490cdb',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/e3317793-cd61-58a3-8518-620284b9d05e',
                                    'targetCode': 'COL.3',
                                    'targetDescription': 'Collaboration',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Emphasize interpersonal relationships',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/e3317793-cd61-58a3-8518-620284b9d05e',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/5d7ef913-d954-52a1-a119-f4eb97a4a926',
                                    'targetCode': 'CT.1',
                                    'targetDescription': 'Critical Thinking',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Information Seeking',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/5d7ef913-d954-52a1-a119-f4eb97a4a926',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/3853cee3-50bc-5fa8-a129-d44aea3dd57f',
                                    'targetCode': 'CT.2',
                                    'targetDescription': 'Critical Thinking',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Information Analysis',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/3853cee3-50bc-5fa8-a129-d44aea3dd57f',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/d1804b83-63a8-5f81-9d03-4d2aa5c36bb3',
                                    'targetCode': 'CT.3',
                                    'targetDescription': 'Critical Thinking',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Argument Generation',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/d1804b83-63a8-5f81-9d03-4d2aa5c36bb3',
                                    'type': ['Alignment'],
                                },
                                {
                                    'id': 'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/84b089ee-0a79-544c-b74a-e18ae695b2b6',
                                    'targetCode': 'CT.4',
                                    'targetDescription': 'Critical Thinking',
                                    'targetFramework': 'Carnegie Skills Progressions',
                                    'targetName': 'Logical Reasoning',
                                    'targetType': 'ceasn:Competency',
                                    'targetUrl':
                                        'https://api.learningcommons.org/knowledge-graph/v0/durable-skills/84b089ee-0a79-544c-b74a-e18ae695b2b6',
                                    'type': ['Alignment'],
                                },
                            ],
                            'creator': {
                                'id': 'https://demoisd.k12.sc.us.gov/',
                                'name': 'Demo ISD',
                                'type': ['Profile'],
                            },
                            'criteria': {
                                'id': 'urn:uuid:4bac4ee2-6dd3-49d3-ba9b-afab6ac85eaf',
                                'narrative':
                                    'Administered by Demo ISD staff using the Carnegie Skills Progressions rubric. Each subskill is rated at one of four progression levels: Exploring, Analyzing, Integrating, or Extending.',
                            },
                            'description':
                                'A schoolwide assessment of student growth on the Carnegie Foundation / ETS Durable Skills Progressions, covering Communication, Collaboration, and Critical Thinking.',
                            'id': 'urn:uuid:c5fd4cdb-187a-4093-90b5-d555a548ecf5',
                            'inLanguage': 'en',
                            'name': 'Durable Skills Assessment',
                            'resultDescription': [
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:bbf2de29-d389-4989-a49f-52c34591fe29',
                                    'name': 'COM.1 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Conveys a basic idea using a single mode of communication (e.g., speaking or writing).',
                                            'id': 'urn:uuid:27bcf1c9-0cd3-4020-8017-f6aec371ee15',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Selects a communication mode appropriate to a simple task or audience.',
                                            'id': 'urn:uuid:8ac002fd-45a3-4635-8220-13dc8372a1c7',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Combines multiple modes (e.g., visual and spoken) to convey an idea more clearly.',
                                            'id': 'urn:uuid:ea261424-9377-4a36-b256-65e210c772fe',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Deliberately blends and adapts multiple modes of communication to strengthen an idea's impact for a specific audience.",
                                            'id': 'urn:uuid:4658588d-7f0e-494a-8d37-15045c66ae30',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:10962331-10cc-49af-8962-03b7d70e3540',
                                    'name': 'COM.3 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Recognizes when a message has not been fully understood.',
                                            'id': 'urn:uuid:d2d0da22-7948-4059-9444-682df452ec05',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Identifies the key point of a message conveyed by others.',
                                            'id': 'urn:uuid:9b589d04-027d-4592-ba75-719263d6602a',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Summarizes a message accurately, including ideas beyond what was directly stated.',
                                            'id': 'urn:uuid:7267ecda-b983-4313-8cac-42e6deb9dfbf',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Synthesizes and builds on others' messages, drawing out implications the speaker did not state directly.",
                                            'id': 'urn:uuid:26b660c3-70a2-4979-8a75-95c7087913b1',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:054dea20-8fdf-438b-9199-4329b72f387a',
                                    'name': 'COM.4 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Shows awareness that communication norms differ across people and contexts.',
                                            'id': 'urn:uuid:45812cb1-67ba-4643-907b-bcf1ca5276d5',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Demonstrates curiosity about how social and cultural context shapes communication (e.g., by asking questions).',
                                            'id': 'urn:uuid:8a9967d9-0f79-4cd4-bcbb-8f2eb91fdb00',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Adapts communication with intention based on the social or emotional context of a conversation.',
                                            'id': 'urn:uuid:4f8b96ec-d36c-485e-946c-c4c601372515',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Anticipates how social, emotional, and ethical factors will shape a conversation and adjusts proactively.',
                                            'id': 'urn:uuid:a9958bec-a853-4a4d-812d-64e4fc7f9208',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:9aa7b9a7-a559-43ef-8e1b-be253dfded11',
                                    'name': 'COL.1 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Recognizes that sharing an idea with the group can move shared work forward.',
                                            'id': 'urn:uuid:84d77f8f-9f87-48c2-9099-1361437b6c3a',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Contributes an idea to a group discussion when prompted.',
                                            'id': 'urn:uuid:926e0092-7228-4ba3-9640-581264f14a9d',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Offers ideas unprompted and builds on others' contributions toward the group's goal.",
                                            'id': 'urn:uuid:3896b825-1f02-40a6-ac3d-68ed8fb5e8b0',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Frames and connects contributions to the group's shared goal in ways that move the discussion forward.",
                                            'id': 'urn:uuid:21175625-d725-409d-9c11-893d6c7f67d2',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:6e19068c-1e64-40b2-8077-b7db4dc5b4bd',
                                    'name': 'COL.2 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                "Identifies challenges that disrupt a group's progress.",
                                            'id': 'urn:uuid:a2c7378b-333a-435f-8db8-c69f3e776a5d',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Makes changes to personal tasks when group challenges arise.',
                                            'id': 'urn:uuid:99ccc3a2-e99a-4cbb-9f40-00ff1dc1b297',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Discusses with the group how to adapt when challenges arise.',
                                            'id': 'urn:uuid:cad4bd0b-005b-4b6c-acc2-daf3a9353ee4',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Facilitates the group in adjusting roles, tasks, or timelines to keep shared work on track.',
                                            'id': 'urn:uuid:10b3f93f-ef0b-48b5-8ef7-fd0ad7644cd6',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:8394aa12-c94d-45ec-80ca-18bb82bef67a',
                                    'name': 'COL.3 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                "Shows awareness of other group members' feelings or perspectives.",
                                            'id': 'urn:uuid:5abdb95e-37cd-436e-8e04-e1f3bd7e25a6',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Responds to a group member's feelings or needs when asked.",
                                            'id': 'urn:uuid:bfad17ba-59ef-4259-bfc1-43a171d1a73a',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Proactively checks in on group members' well-being and adjusts behavior in response.",
                                            'id': 'urn:uuid:80a43193-a3b5-460c-94eb-f2e45d926894',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                "Builds and sustains trust within the group by consistently attending to members' needs and perspectives.",
                                            'id': 'urn:uuid:4b377918-f773-46c6-9f28-2a8056aeece4',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:de9c3583-e756-4228-a159-0fa808da6931',
                                    'name': 'CT.1 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Seeks out sources of information relevant to a question.',
                                            'id': 'urn:uuid:f3fa1cb4-d460-400f-9620-86597b6e847a',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Uses basic search terms to locate a relevant source.',
                                            'id': 'urn:uuid:8ec3ece7-41a4-4a1b-9b3d-7dc89a8f5bf2',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Uses varied search terms to locate multiple relevant sources, some of which are credible.',
                                            'id': 'urn:uuid:ec16d33f-c4c3-448a-8f24-84f4252d1f99',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Locates multiple credible sources using varied search strategies and evaluates them by their content.',
                                            'id': 'urn:uuid:702095a3-fbb9-4c78-a3ab-5eade18d5026',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:d27d3c20-9587-4039-8d28-b484d744e70a',
                                    'name': 'CT.2 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Identifies the evidence used to support a conclusion.',
                                            'id': 'urn:uuid:545cca51-48e3-416b-9534-9aab1b25760c',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Recognizes when evidence is relevant to a conclusion.',
                                            'id': 'urn:uuid:2f991c01-0ad8-411e-883e-7ef967477007',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Distinguishes between weaker and stronger evidence used to form a conclusion.',
                                            'id': 'urn:uuid:c521eb29-f682-4b53-967b-78d91332ca43',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Distinguishes between weaker and stronger evidence and articulates specific, defensible reasons for that evaluation.',
                                            'id': 'urn:uuid:7c9ecaef-b970-4344-9eaf-3192c51cdb78',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:e72cf75e-a82c-4f08-afcc-565981b2562f',
                                    'name': 'CT.3 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'States a claim without supporting reasoning.',
                                            'id': 'urn:uuid:8be35d20-0a12-4c22-bc4b-0700a9c50b30',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'States a claim and offers a reason to support it.',
                                            'id': 'urn:uuid:0290cc4e-0137-423b-ac6b-a8f315d20d73',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Builds an argument that connects a claim to evidence with clear reasoning.',
                                            'id': 'urn:uuid:9f0d679c-9708-4753-ad9e-06b411ce9d2c',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Constructs a well-reasoned argument that anticipates and addresses counterclaims.',
                                            'id': 'urn:uuid:cbfd1a2f-6a6c-43ef-b6ee-2c03c2051375',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                                {
                                    'allowedValue': [
                                        'Exploring',
                                        'Analyzing',
                                        'Integrating',
                                        'Extending',
                                    ],
                                    'id': 'urn:uuid:7dfdbbb1-4e93-4e70-acd4-4fb1818cde62',
                                    'name': 'CT.4 progression level',
                                    'resultType': 'RubricCriterionLevel',
                                    'rubricCriterionLevel': [
                                        {
                                            'description':
                                                'Recognizes whether a conclusion follows from a stated premise.',
                                            'id': 'urn:uuid:1fca751c-9085-48d0-9021-65ce9b5ef45f',
                                            'level': 'Exploring',
                                            'name': 'Exploring',
                                            'points': '1',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Identifies a gap or flaw in a simple line of reasoning.',
                                            'id': 'urn:uuid:e5a547c6-63d6-439f-b385-1a1c1770c548',
                                            'level': 'Analyzing',
                                            'name': 'Analyzing',
                                            'points': '2',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Constructs a logical chain of reasoning from premises to a conclusion.',
                                            'id': 'urn:uuid:8197dc2b-cfb7-4fe7-b0a6-e46f4039f32b',
                                            'level': 'Integrating',
                                            'name': 'Integrating',
                                            'points': '3',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                        {
                                            'description':
                                                'Evaluates and strengthens the logical structure of an argument, identifying and correcting flawed reasoning.',
                                            'id': 'urn:uuid:61f74355-5ca7-46be-99f8-c68af415ca70',
                                            'level': 'Extending',
                                            'name': 'Extending',
                                            'points': '4',
                                            'type': ['RubricCriterionLevel'],
                                        },
                                    ],
                                    'type': ['ResultDescription'],
                                },
                            ],
                            'type': ['Achievement'],
                        },
                        'activityEndDate': '2027-05-14T00:00:00Z',
                        'activityStartDate': '2027-01-08T00:00:00Z',
                        'id': 'did:example:student',
                        'result': [
                            {
                                'achievedLevel': 'urn:uuid:ea261424-9377-4a36-b256-65e210c772fe',
                                'id': 'urn:uuid:9b787f13-129d-46f9-a6cb-3b86bedada60',
                                'resultDescription':
                                    'urn:uuid:bbf2de29-d389-4989-a49f-52c34591fe29',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Integrating',
                            },
                            {
                                'achievedLevel': 'urn:uuid:26b660c3-70a2-4979-8a75-95c7087913b1',
                                'id': 'urn:uuid:bdabb1c9-f875-40d7-9d6b-45c35e393641',
                                'resultDescription':
                                    'urn:uuid:10962331-10cc-49af-8962-03b7d70e3540',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Extending',
                            },
                            {
                                'achievedLevel': 'urn:uuid:8a9967d9-0f79-4cd4-bcbb-8f2eb91fdb00',
                                'id': 'urn:uuid:263dc1ce-19e8-491b-9240-e2faae558f52',
                                'resultDescription':
                                    'urn:uuid:054dea20-8fdf-438b-9199-4329b72f387a',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Analyzing',
                            },
                            {
                                'achievedLevel': 'urn:uuid:84d77f8f-9f87-48c2-9099-1361437b6c3a',
                                'id': 'urn:uuid:41a3378e-da8e-4574-a312-ca800bc8ebd2',
                                'resultDescription':
                                    'urn:uuid:9aa7b9a7-a559-43ef-8e1b-be253dfded11',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Exploring',
                            },
                            {
                                'achievedLevel': 'urn:uuid:10b3f93f-ef0b-48b5-8ef7-fd0ad7644cd6',
                                'id': 'urn:uuid:93393df3-cd18-43d6-aa83-fc9ff0af8d4c',
                                'resultDescription':
                                    'urn:uuid:6e19068c-1e64-40b2-8077-b7db4dc5b4bd',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Extending',
                            },
                            {
                                'achievedLevel': 'urn:uuid:80a43193-a3b5-460c-94eb-f2e45d926894',
                                'id': 'urn:uuid:2b9c526f-6d8a-46b9-a83c-26dd781366e0',
                                'resultDescription':
                                    'urn:uuid:8394aa12-c94d-45ec-80ca-18bb82bef67a',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Integrating',
                            },
                            {
                                'achievedLevel': 'urn:uuid:8ec3ece7-41a4-4a1b-9b3d-7dc89a8f5bf2',
                                'id': 'urn:uuid:f7e32a8d-6263-4ca3-a61b-7ce70d425409',
                                'resultDescription':
                                    'urn:uuid:de9c3583-e756-4228-a159-0fa808da6931',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Analyzing',
                            },
                            {
                                'achievedLevel': 'urn:uuid:7c9ecaef-b970-4344-9eaf-3192c51cdb78',
                                'id': 'urn:uuid:c36dd7b0-a5e9-4ed6-b747-9bcb831d1849',
                                'resultDescription':
                                    'urn:uuid:d27d3c20-9587-4039-8d28-b484d744e70a',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Extending',
                            },
                            {
                                'achievedLevel': 'urn:uuid:8be35d20-0a12-4c22-bc4b-0700a9c50b30',
                                'id': 'urn:uuid:0dcf6202-e287-45c5-9793-2f76d951ebf8',
                                'resultDescription':
                                    'urn:uuid:e72cf75e-a82c-4f08-afcc-565981b2562f',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Exploring',
                            },
                            {
                                'achievedLevel': 'urn:uuid:8197dc2b-cfb7-4fe7-b0a6-e46f4039f32b',
                                'id': 'urn:uuid:122192d6-a979-43aa-8a4a-b2150b2371a8',
                                'resultDescription':
                                    'urn:uuid:7dfdbbb1-4e93-4e70-acd4-4fb1818cde62',
                                'status': 'Completed',
                                'type': ['Result'],
                                'value': 'Integrating',
                            },
                        ],
                        'type': 'AchievementSubject',
                    },
                    'id': 'urn:uuid:159e9b19-8780-45df-b382-5e849ce5c600',
                    'issuer': {
                        'id': 'https://demoisd.k12.sc.us.gov/',
                        'name': 'Demo ISD',
                        'type': ['Profile'],
                    },
                    'name': 'Durable Skills Assessment',
                    'type': ['VerifiableCredential', 'AchievementCredential'],
                    'validFrom': '2027-05-14T00:00:00Z',
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
        'validFrom': '2026-09-08T19:01:21.648Z',
        'awardedDate': '2028-06-05T00:00:00Z',
    },
};
