import type { CredentialFixture } from '../../types';

export const obv3CourseCompletion: CredentialFixture = {
    id: 'obv3/course-completion',
    name: 'Introduction to Machine Learning Course Completion',
    description:
        'An online course completion badge from a MOOC platform, representing a common real-world use case for OBv3 credentials in online education.',
    spec: 'obv3',
    profile: 'course',
    features: ['image', 'evidence'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['course', 'mooc', 'machine-learning', 'online-education'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:a5f3e2c1-8d4b-47f0-b293-1e4a6f8c9d02',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Introduction to Machine Learning',
        description:
            'Successfully completed the Introduction to Machine Learning course, covering supervised learning, unsupervised learning, neural networks, and model evaluation.',
        image: {
            id: 'https://learn-platform-example.com/badges/intro-ml.png',
            type: 'Image',
            caption: 'Introduction to Machine Learning completion badge',
        },
        credentialSubject: {
            id: 'did:example:learner-ml-042',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://learn-platform-example.com/courses/intro-ml',
                type: ['Achievement'],
                achievementType: 'Course',
                name: 'Introduction to Machine Learning',
                description:
                    'A 10-week course covering the fundamentals of machine learning, including linear regression, classification, clustering, dimensionality reduction, and neural networks. Includes hands-on coding assignments in Python using scikit-learn and TensorFlow.',
                criteria: {
                    id: 'https://learn-platform-example.com/courses/intro-ml/criteria',
                    narrative:
                        'Complete all 10 weekly modules, pass each quiz with 80% or higher, and submit 3 coding assignments with a passing grade.',
                },
                image: {
                    id: 'https://learn-platform-example.com/badges/intro-ml.png',
                    type: 'Image',
                    caption: 'Intro to ML badge',
                },
                creator: {
                    id: 'https://learn-platform-example.com/issuers/platform',
                    type: ['Profile'],
                    name: 'LearnPlatform Online Education',
                    url: 'https://learn-platform-example.com',
                    description: 'An online learning platform offering courses in technology, data science, and business.',
                },
                tag: ['machine-learning', 'python', 'data-science', 'artificial-intelligence'],
            },
        },
        issuer: {
            id: 'did:web:learn-platform-example.com',
            type: ['Profile'],
            name: 'LearnPlatform Online Education',
            url: 'https://learn-platform-example.com',
            image: {
                id: 'https://learn-platform-example.com/logo.png',
                type: 'Image',
                caption: 'LearnPlatform logo',
            },
        },
        validFrom: '2025-01-20T00:00:00Z',
        evidence: [
            {
                id: 'https://learn-platform-example.com/evidence/learner-ml-042/intro-ml',
                type: ['Evidence'],
                narrative:
                    'Learner completed all 10 modules, achieved an average quiz score of 94%, and submitted all 3 coding assignments with passing grades. Final project: built a sentiment analysis classifier using scikit-learn achieving 91% accuracy on test data.',
            },
        ],
    },
};
