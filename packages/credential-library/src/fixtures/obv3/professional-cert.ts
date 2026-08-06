import type { CredentialFixture } from '../../types';

export const obv3ProfessionalCert: CredentialFixture = {
    id: 'obv3/professional-cert',
    name: 'AWS Solutions Architect Professional Certification',
    description:
        'A professional cloud certification credential modeled after real-world IT certifications, with expiration, alignment to industry frameworks, and credential schema.',
    spec: 'obv3',
    profile: 'certificate',
    features: ['expiration', 'alignment', 'image', 'credential-schema'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    tags: ['professional', 'certification', 'cloud', 'aws', 'it'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:b34ca6cd-29d7-4b2f-9e99-4902fd84c5a1',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'AWS Certified Solutions Architect – Professional',
        description:
            'Validates advanced technical skills and experience in designing distributed applications and systems on the AWS platform.',
        image: {
            id: 'https://example-training.com/badges/aws-sa-pro.png',
            type: 'Image',
            caption: 'AWS Solutions Architect Professional badge',
        },
        credentialSubject: {
            id: 'did:example:holder-aws-cert-001',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://example-training.com/achievements/aws-sa-pro',
                type: ['Achievement'],
                achievementType: 'Certification',
                name: 'AWS Certified Solutions Architect – Professional',
                description:
                    'The AWS Certified Solutions Architect – Professional exam validates advanced technical skills and experience in designing distributed applications and systems on the AWS platform. Earning this certification demonstrates the ability to design and deploy dynamically scalable, highly available, fault-tolerant, and reliable applications.',
                criteria: {
                    id: 'https://example-training.com/achievements/aws-sa-pro/criteria',
                    narrative:
                        'Pass the AWS Certified Solutions Architect – Professional exam (SAP-C02) with a score of 750/1000 or higher. Prerequisite: AWS Certified Solutions Architect – Associate or 2+ years hands-on experience.',
                },
                image: {
                    id: 'https://example-training.com/badges/aws-sa-pro.png',
                    type: 'Image',
                    caption: 'AWS Solutions Architect Professional badge',
                },
                creator: {
                    id: 'https://example-training.com/issuers/1',
                    type: ['Profile'],
                    name: 'Example Cloud Training & Certification',
                    url: 'https://example-training.com',
                    description:
                        'Global leader in cloud computing training and professional certifications.',
                },
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'Cloud Solutions Architect',
                        targetUrl: 'https://credentialengineregistry.org/resources/ce-cloud-arch-001',
                        targetDescription:
                            'Design and implement cloud infrastructure solutions that meet business requirements.',
                        targetFramework: 'Credential Engine Cloud Computing Competency Framework',
                        targetType: 'CTDL',
                    },
                    {
                        type: ['Alignment'],
                        targetName: 'Information Technology – Cloud Computing',
                        targetUrl: 'https://nces.ed.gov/ipeds/cipcode/cipdetail.aspx?y=56&cipid=91456',
                        targetDescription: 'CIP Code 11.0902 – Cloud Computing',
                        targetFramework: 'Classification of Instructional Programs (CIP)',
                        targetType: 'CFItem',
                        targetCode: '11.0902',
                    },
                ],
                tag: ['cloud', 'aws', 'architecture', 'infrastructure', 'professional'],
            },
        },
        issuer: {
            id: 'did:web:example-training.com',
            type: ['Profile'],
            name: 'Example Cloud Training & Certification',
            url: 'https://example-training.com',
            image: {
                id: 'https://example-training.com/logo.png',
                type: 'Image',
                caption: 'Example Cloud Training logo',
            },
        },
        validFrom: '2024-03-15T00:00:00Z',
        validUntil: '2027-03-15T00:00:00Z',
        credentialSchema: [
            {
                id: 'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json',
                type: '1EdTechJsonSchemaValidator2019',
            },
        ],
    },
};
