import z from 'zod';

export const BoostSkillHierarchyValidator = z.object({
    durable: z
        .object({
            skill: z.literal('adaptability'),
            subskills: z
                .enum([
                    'flexibility',
                    'resilience',
                    'problemSolving',
                    'resourcefulness',
                    'stressManagement',
                ])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('perseverance'),
                subskills: z
                    .enum(['discipline', 'focus', 'commitment', 'grit', 'tenacity'])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('mentalToughness'),
                subskills: z
                    .enum([
                        'optimism',
                        'selfConfidence',
                        'emotionalRegulation',
                        'growthMindset',
                        'positiveSelfTalk',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('physicalEndurance'),
                subskills: z
                    .enum([
                        'strength',
                        'stamina',
                        'cardiovascularFitness',
                        'painTolerance',
                        'injuryPrevention',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('lifelongLearning'),
                subskills: z
                    .enum([
                        'curiosity',
                        'openMindedness',
                        'critical thinking',
                        'selfDirectedLearning',
                        'knowledgeRetention',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    stem: z
        .object({
            skill: z.literal('mathematics'),
            subskills: z
                .enum(['algebra', 'geometry', 'trigonometry', 'calculus', 'statistics'])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('science'),
                subskills: z
                    .enum([
                        'physics',
                        'chemistry',
                        'biology',
                        'earthScience',
                        'environmentalScience',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('technology'),
                subskills: z
                    .enum([
                        'coding',
                        'softwareDevelopment',
                        'dataAnalysis',
                        'robotics',
                        'cybersecurity',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('engineering'),
                subskills: z
                    .enum([
                        'mechanicalEngineering',
                        'electricalEngineering',
                        'civilEngineering',
                        'chemicalEngineering',
                        'computerEngineering',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('research'),
                subskills: z
                    .enum([
                        'hypothesisDevelopment',
                        'experimentalDesign',
                        'dataCollection',
                        'analysis',
                        'presentation',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    athletic: z
        .object({
            skill: z.literal('sportSpecificSkills'),
            subskills: z
                .enum([
                    'ballHandling',
                    'runningTechnique',
                    'swingMechanics',
                    'tackling',
                    'swimmingStrokes',
                ])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('strengthAndConditioning'),
                subskills: z
                    .enum([
                        'weightLifting',
                        'speedTraining',
                        'agility',
                        'flexibility',
                        'injuryPrevention',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('coordination'),
                subskills: z
                    .enum([
                        'handEyeCoordination',
                        'footwork',
                        'balance',
                        'reactionTime',
                        'spatialAwareness',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('mentalFocus'),
                subskills: z
                    .enum([
                        'visualization',
                        'goalSetting',
                        'competitiveness',
                        'resilience',
                        'handlingPressure',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('teamwork'),
                subskills: z
                    .enum([
                        'communication',
                        'cooperation',
                        'roleUnderstanding',
                        'strategy',
                        'sportsmanship',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    creative: z
        .object({
            skill: z.literal('visualArts'),
            subskills: z
                .enum(['drawing', 'painting', 'sculpture', 'graphicDesign', 'photography'])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('performingArts'),
                subskills: z
                    .enum([
                        'acting',
                        'dance',
                        'singing',
                        'instrumental',
                        'theaterProduction',
                        'costumeDesign',
                        'directing',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('writing'),
                subskills: z
                    .enum([
                        'poetry',
                        'fiction',
                        'nonfiction',
                        'scriptWriting',
                        'copyWriting',
                        'journalism',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('design'),
                subskills: z
                    .enum([
                        'fashionDesign',
                        'interiorDesign',
                        'webDesign',
                        'productDesign',
                        'gameDesign',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('ideation'),
                subskills: z
                    .enum([
                        'brainstorming',
                        'concept development',
                        'innovation',
                        'problemSolving',
                        'outOfTheBoxThinking',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    business: z
        .object({
            skill: z.literal('management'),
            subskills: z
                .enum([
                    'leadership',
                    'strategicPlanning',
                    'teamBuilding',
                    'delegation',
                    'conflictResolution',
                ])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('finance'),
                subskills: z
                    .enum([
                        'accounting',
                        'budgeting',
                        'financialAnalysis',
                        'investment',
                        'riskManagement',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('marketing'),
                subskills: z
                    .enum([
                        'marketResearch',
                        'branding',
                        'advertising',
                        'sales',
                        'customerRelationshipManagement',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('operations'),
                subskills: z
                    .enum([
                        'logistics',
                        'supplyChainManagement',
                        'processImprovement',
                        'projectManagement',
                        'qualityControl',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('entrepreneurship'),
                subskills: z
                    .enum([
                        'opportunityRecognition',
                        'businessPlanning',
                        'fundraising',
                        'networking',
                        'decisionMaking',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    trade: z
        .object({
            skill: z.literal('construction'),
            subskills: z
                .enum(['carpentry', 'electricalWork', 'plumbing', 'masonry', 'HVAC'])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('mechanics'),
                subskills: z
                    .enum([
                        'automotiveRepair',
                        'dieselEngineRepair',
                        'smallEngineRepair',
                        'aircraftMaintenance',
                        'heavyEquipmentOperation',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('manufacturing'),
                subskills: z
                    .enum(['welding', 'machining', 'assembly', 'fabrication', 'qualityAssurance'])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('cosmetology'),
                subskills: z
                    .enum([
                        'hairstyling',
                        'barbering',
                        'nailTechnology',
                        'makeupArtistry',
                        'esthetics',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('culinaryArts'),
                subskills: z
                    .enum([
                        'cookingTechniques',
                        'baking',
                        'foodSafety',
                        'menuPlanning',
                        'restaurantManagement',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    social: z
        .object({
            skill: z.literal('history'),
            subskills: z
                .enum([
                    'researchMethods',
                    'analysisOfPrimarySources',
                    'chronologicalReasoning',
                    'comparativeHistory',
                    'historiography',
                ])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('psychology'),
                subskills: z
                    .enum([
                        'cognitivePsychology',
                        'developmentalPsychology',
                        'socialPsychology',
                        'experimentalMethods',
                        'clinicalPsychology',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('sociology'),
                subskills: z
                    .enum([
                        'socialInequality',
                        'socialInstitutions',
                        'researchMethods',
                        'socialChange',
                        'socialMovements',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('economics'),
                subskills: z
                    .enum([
                        'microeconomics',
                        'macroeconomics',
                        'econometrics',
                        'economicPolicy',
                        'internationalEconomics',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('politicalScience'),
                subskills: z
                    .enum([
                        'governmentSystems',
                        'politicalTheory',
                        'internationalRelations',
                        'comparativePolitics',
                        'publicPolicy',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    digital: z
        .object({
            skill: z.literal('basicComputerSkills'),
            subskills: z
                .enum(['typing', 'fileManagement', 'internetNavigation', 'email', 'wordProcessing'])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('informationLiteracy'),
                subskills: z
                    .enum([
                        'searchEngineProficiency',
                        'evaluatingSources',
                        'factChecking',
                        'criticalMediaAnalysis',
                        'understandingBias',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('softwareProficiency'),
                subskills: z
                    .enum([
                        'productivitySuites',
                        'specializedSoftware',
                        'designSoftware',
                        'programmingBasics',
                        'dataVisualizationTools',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('onlineCommunication'),
                subskills: z
                    .enum([
                        'netiquette',
                        'effectiveEmailAndMessaging',
                        'socialMediaPlatforms',
                        'videoConferencing',
                        'collaborationTools',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('cybersecurity'),
                subskills: z
                    .enum([
                        'passwordManagement',
                        'phishingAwareness',
                        'dataPrivacy',
                        'safeOnlinePractices',
                        'protectingDevices',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
    medical: z
        .object({
            skill: z.literal('clinicalSkills'),
            subskills: z
                .enum([
                    'patientAssessment',
                    'diagnosticProcedures',
                    'medicationAdministration',
                    'woundCare',
                    'basicLifeSupport',
                ])
                .array(),
        })
        .or(
            z.object({
                skill: z.literal('anatomyAndPhysiology'),
                subskills: z
                    .enum([
                        'bodySystems',
                        'medicalTerminology',
                        'diseaseProcesses',
                        'pharmacology',
                        'pathophysiology',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('patientCare'),
                subskills: z
                    .enum([
                        'bedsideManner',
                        'empathy',
                        'communication',
                        'culturalSensitivity',
                        'ethics',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('medicalSpecialties'),
                subskills: z
                    .enum([
                        'surgery',
                        'emergencyMedicine',
                        'pediatrics',
                        'radiology',
                        'diagnosticReasoning',
                        'treatmentPlanning',
                        'interdisciplinaryCollaboration',
                    ])
                    .array(),
            })
        )
        .or(
            z.object({
                skill: z.literal('healthcareAdministration'),
                subskills: z
                    .enum([
                        'insuranceAndBilling',
                        'medicalRecords',
                        'patientScheduling',
                        'regulatoryCompliance',
                        'facilityManagement',
                    ])
                    .array(),
            })
        )
        .array()
        .optional(),
});
export type BoostSkillHierarchy = z.infer<typeof BoostSkillHierarchyValidator>;
