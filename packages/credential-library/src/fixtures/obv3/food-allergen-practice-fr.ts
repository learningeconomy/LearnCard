import { UnsignedAchievementCredentialValidator } from '@learncard/types';

import type { CredentialFixture } from '../../types';

// Example corpus provenance and alignment attribution: ../../../SOURCES.md.
export const obv3FoodAllergenPracticeFr: CredentialFixture = {
    id: 'obv3/food-allergen-practice-fr',
    name: 'Prévention des contacts croisés avec des allergènes',
    description:
        'French counterpart of the food-allergen practice assessment, retaining its RubricScore and alignment.',
    spec: 'obv3',
    profile: 'generic',
    features: ['evidence', 'alignment', 'results', 'expiration'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    validator: UnsignedAchievementCredentialValidator,
    tags: ['food-safety', 'rubric-score', 'french', 'localization', 'learner'],

    credential: {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: 'urn:uuid:14adf3a3-43d2-5271-90be-9812f906deef',
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Prévention des contacts croisés avec des allergènes',
        description:
            "Évaluation d'un exercice de prévention des contacts croisés avec des allergènes.",
        issuer: {
            id: 'did:example:lc2184-cedar-training',
            type: ['Profile'],
            name: 'Cedar Technical Training',
            url: 'https://cedar-training.example',
        },
        validFrom: '2026-09-01T00:00:00Z',
        validUntil: '2028-09-01T00:00:00Z',
        credentialSubject: {
            id: 'https://fixtures.example.org/frenchfry/personas/d56d0c592ac6',
            type: ['AchievementSubject'],
            achievement: {
                id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice/fr',
                type: ['Achievement'],
                achievementType: 'Assessment',
                name: 'Prévention des contacts croisés avec des allergènes',
                description:
                    "Planifie la préparation d'une commande fictive dans un exercice de cuisine simulé.",
                criteria: {
                    narrative:
                        'Repère les possibilités de contact croisé, précise les étapes de communication et signale les incertitudes sans faire de diagnostic médical.',
                },
                fieldOfStudy: 'vocational',
                inLanguage: 'fr',
                tag: ['vocational', 'Food allergen control', 'learner'],
                resultDescription: [
                    {
                        id: 'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice/fr/rubric',
                        type: ['ResultDescription'],
                        name: "Points de la grille d'observation",
                        resultType: 'RubricScore',
                        valueMin: '0',
                        valueMax: '4',
                        requiredValue: '3',
                    },
                ],
                alignment: [
                    {
                        type: ['Alignment'],
                        targetName: 'food safety principles',
                        targetUrl:
                            'http://data.europa.eu/esco/skill/3f4e4eab-a8e0-4aed-b8bb-79afe7c890e3',
                        targetFramework: 'ESCO (requested dataset v1.2.0)',
                        targetDescription:
                            'Scientific background of food safety which includes preparation, handling, and storage of food to minimise the risk of foodborne illness and other health hazards.',
                    },
                ],
            },
            role: 'learner',
            narrative:
                "Planifie la préparation d'une commande fictive dans un exercice de cuisine simulé.",
            activityStartDate: '2026-08-01T00:00:00Z',
            activityEndDate: '2026-08-31T00:00:00Z',
            result: [
                {
                    type: ['Result'],
                    resultDescription:
                        'https://fixtures.example.org/frenchfry/achievements/d56d0c592ac6/practice/fr/rubric',
                    value: '4',
                    status: 'Completed',
                },
            ],
        },
        evidence: [
            {
                id: 'https://fixtures.example.org/frenchfry/evidence/d56d0c592ac6/practice/fr',
                type: ['Evidence'],
                name: "Liste de contrôle et compte rendu d'un exercice de simulation",
                description:
                    "Planifie la préparation d'une commande fictive dans un exercice de cuisine simulé.",
                narrative:
                    "Planifie la préparation d'une commande fictive dans un exercice de cuisine simulé.",
                genre: "Compte rendu d'observation",
                audience: 'Évaluateurs',
            },
        ],
    },
};
