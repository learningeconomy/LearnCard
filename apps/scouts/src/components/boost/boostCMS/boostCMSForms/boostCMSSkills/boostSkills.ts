import Athletics from '../../../../../assets/images/athletics.png';
import Business from '../../../../../assets/images/business.png';
import Creative from '../../../../../assets/images/creative.png';
import Digital from '../../../../../assets/images/digital.png';
import Durable from '../../../../../assets/images/durable.png';
import Medical from '../../../../../assets/images/medical.png';
import Social from '../../../../../assets/images/social.png';
import Stem from '../../../../../assets/images/stem.png';
import Trade from '../../../../../assets/images/trade.png';
import * as m from '../../../../../paraglide/messages.js';

export enum BoostCMSSKillsCategoryEnum {
    Durable = 'durable',
    Stem = 'stem',
    Athletic = 'athletic',
    Creative = 'creative',
    Business = 'business',
    Trade = 'trade',
    Social = 'social',
    Digital = 'digital',
    Medical = 'medical',
}

export const boostCMSSKillCategories: {
    id: number;
    title: string;
    IconComponent: React.ReactNode;
    iconClassName: string;
    iconCircleClass: string;
    type: BoostCMSSKillsCategoryEnum;
}[] = [
    {
        id: 1,
        get title() {
            return m['boostContent.skillCategories.durable.title']();
        },
        IconComponent: Durable,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Durable,
    },
    {
        id: 2,
        get title() {
            return m['boostContent.skillCategories.stem.title']();
        },
        IconComponent: Stem,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Stem,
    },
    {
        id: 3,
        get title() {
            return m['boostContent.skillCategories.athletic.title']();
        },
        IconComponent: Athletics,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Athletic,
    },
    {
        id: 4,
        get title() {
            return m['boostContent.skillCategories.creative.title']();
        },
        IconComponent: Creative,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Creative,
    },
    {
        id: 5,
        get title() {
            return m['boostContent.skillCategories.business.title']();
        },
        IconComponent: Business,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Business,
    },
    {
        id: 6,
        get title() {
            return m['boostContent.skillCategories.trade.title']();
        },
        IconComponent: Trade,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Trade,
    },
    {
        id: 7,
        get title() {
            return m['boostContent.skillCategories.social.title']();
        },
        IconComponent: Social,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Social,
    },
    {
        id: 8,
        get title() {
            return m['boostContent.skillCategories.digital.title']();
        },
        IconComponent: Digital,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Digital,
    },
    {
        id: 9,
        get title() {
            return m['boostContent.skillCategories.medical.title']();
        },
        IconComponent: Medical,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Medical,
    },
];

export enum BoostCMSCategorySkillEnum {
    // durable skills
    Adaptability = 'adaptability',
    Perseverance = 'perseverance',
    MentalToughness = 'mentalToughness',
    PhysicalEndurance = 'physicalEndurance',
    LifelongLearning = 'lifelongLearning',

    // STEM skills
    Mathematics = 'mathematics',
    Science = 'science',
    Technology = 'technology',
    Engineering = 'engineering',
    Research = 'research',

    // athletic
    SportSpecificSkills = 'sportSpecificSkills',
    StrengthAndConditioning = 'strengthAndConditioning',
    Coordination = 'coordination',
    MentalFocus = 'mentalFocus',
    Teamwork = 'teamwork',

    // creative skills
    VisualArts = 'visualArts',
    PerformingArts = 'performingArts',
    Writing = 'writing',
    Design = 'design',
    Ideation = 'ideation',

    // business skills
    Management = 'management',
    Finance = 'finance',
    Marketing = 'marketing',
    Operations = 'operations',
    Entrepreneurship = 'entrepreneurship',

    // trade skills
    Construction = 'construction',
    Mechanics = 'mechanics',
    Manufacturing = 'manufacturing',
    Cosmetology = 'cosmetology',
    CulinaryArts = 'culinaryArts',

    // social skills
    History = 'history',
    Psychology = 'psychology',
    Sociology = 'sociology',
    Economics = 'economics',
    PoliticalScience = 'politicalScience',

    // digital skills
    BasicComputerSkills = 'basicComputerSkills',
    InformationLiteracy = 'informationLiteracy',
    SoftwareProficiency = 'softwareProficiency',
    OnlineCommunication = 'onlineCommunication',
    Cybersecurity = 'cybersecurity',

    // medical skills
    ClinicalSkills = 'clinicalSkills',
    AnatomyAndPhysiology = 'anatomyAndPhysiology',
    PatientCare = 'patientCare',
    MedicalSpecialties = 'medicalSpecialties',
    HealthcareAdministration = 'healthcareAdministration',
}

export const CATEGORY_TO_SKILLS = {
    [BoostCMSSKillsCategoryEnum.Durable]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.adaptability.title']();
            },
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.Adaptability,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.perseverance.title']();
            },
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.Perseverance,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.mentalToughness.title']();
            },
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.MentalToughness,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.physicalEndurance.title']();
            },
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.PhysicalEndurance,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.lifelongLearning.title']();
            },
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.LifelongLearning,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Stem]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.mathematics.title']();
            },
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Mathematics,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.science.title']();
            },
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Science,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.technology.title']();
            },
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Technology,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.engineering.title']();
            },
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Engineering,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.research.title']();
            },
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Research,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Athletic]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.sportSpecificSkills.title']();
            },
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.SportSpecificSkills,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.strengthAndConditioning.title']();
            },
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.coordination.title']();
            },
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.Coordination,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.mentalFocus.title']();
            },
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.MentalFocus,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.teamwork.title']();
            },
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.Teamwork,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Creative]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.visualArts.title']();
            },
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.VisualArts,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.performingArts.title']();
            },
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.PerformingArts,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.writing.title']();
            },
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.Writing,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.design.title']();
            },
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.Design,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.ideation.title']();
            },
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.Ideation,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Business]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.management.title']();
            },
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Management,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.finance.title']();
            },
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Finance,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.marketing.title']();
            },
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Marketing,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.operations.title']();
            },
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Operations,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.entrepreneurship.title']();
            },
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Entrepreneurship,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Trade]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.construction.title']();
            },
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Construction,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.mechanics.title']();
            },
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Mechanics,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.manufacturing.title']();
            },
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Manufacturing,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.cosmetology.title']();
            },
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Cosmetology,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.culinaryArts.title']();
            },
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.CulinaryArts,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Social]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.history.title']();
            },
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.History,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.psychology.title']();
            },
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Psychology,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.sociology.title']();
            },
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Sociology,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.economics.title']();
            },
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Economics,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.politicalScience.title']();
            },
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.PoliticalScience,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Digital]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.basicComputerSkills.title']();
            },
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.BasicComputerSkills,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.informationLiteracy.title']();
            },
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.InformationLiteracy,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.softwareProficiency.title']();
            },
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.SoftwareProficiency,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.onlineCommunication.title']();
            },
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.OnlineCommunication,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.cybersecurity.title']();
            },
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.Cybersecurity,
        },
    ],
    [BoostCMSSKillsCategoryEnum.Medical]: [
        {
            id: 1,
            get title() {
                return m['boostContent.categorySkills.clinicalSkills.title']();
            },
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.ClinicalSkills,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.categorySkills.anatomyAndPhysiology.title']();
            },
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.categorySkills.patientCare.title']();
            },
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.PatientCare,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.categorySkills.medicalSpecialties.title']();
            },
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.MedicalSpecialties,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.categorySkills.healthcareAdministration.title']();
            },
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.HealthcareAdministration,
        },
    ],
};

export enum BoostCMSSubSkillEnum {
    // * Durable
    // Adaptability
    flexibility = 'flexibility',
    resilience = 'resilience',
    problemSolving = 'problemSolving',
    resourcefulness = 'resourcefulness',
    stressManagement = 'stressManagement',

    // Perseverance
    discipline = 'discipline',
    focus = 'focus',
    commitment = 'commitment',
    grit = 'grit',
    tenacity = 'tenacity',

    // Mental toughness
    optimism = 'optimism',
    selfConfidence = 'selfConfidence',
    emotionalRegulation = 'emotionalRegulation',
    growthMindset = 'growthMindset',
    positiveSelfTalk = 'positiveSelfTalk',

    // physical edurance
    strength = 'strength',
    stamina = 'stamina',
    cardiovascularFitness = 'cardiovascularFitness',
    painTolerance = 'painTolerance',
    injuryPrevention = 'injuryPrevention',

    // lifelong learning
    curiosity = 'curiosity',
    openMindedness = 'openMindedness',
    criticalThinking = 'critical thinking',
    selfDirectedLearning = 'selfDirectedLearning',
    knowledgeRetention = 'knowledgeRetention',

    // * STEM
    // Mathematics
    algebra = 'algebra',
    geometry = 'geometry',
    trigonometry = 'trigonometry',
    calculus = 'calculus',
    statistics = 'statistics',

    // science
    physics = 'physics',
    chemistry = 'chemistry',
    biology = 'biology',
    earthScience = 'earthScience',
    environmentalScience = 'environmentalScience',

    // technology
    coding = 'coding',
    softwareDevelopment = 'softwareDevelopment',
    dataAnalysis = 'dataAnalysis',
    robotics = 'robotics',
    cybersecurity = 'cybersecurity',

    // engineering
    mechanicalEngineering = 'mechanicalEngineering',
    electricalEngineering = 'electricalEngineering',
    civilEngineering = 'civilEngineering',
    chemicalEngineering = 'chemicalEngineering',
    computerEngineering = 'computerEngineering',

    // research
    hypothesisDevelopment = 'hypothesisDevelopment',
    experimentalDesign = 'experimentalDesign',
    dataCollection = 'dataCollection',
    analysis = 'analysis',
    presentation = 'presentation',

    // * Athletic
    // sport specific skills
    ballHandling = 'ballHandling',
    runningTechnique = 'runningTechnique',
    swingMechanics = 'swingMechanics',
    tackling = 'tackling',
    swimmingStrokes = 'swimmingStrokes',

    // strength and conditioning
    weightLifting = 'weightLifting',
    speedTraining = 'speedTraining',
    agility = 'agility',
    lexibility = 'flexibility',
    // injuryPrevention = 'injuryPrevention', // ! duplicate

    // coordination
    handEyeCoordination = 'handEyeCoordination',
    footwork = 'footwork',
    balance = 'balance',
    reactionTime = 'reactionTime',
    spatialAwareness = 'spatialAwareness',

    // mental focus
    visualization = 'visualization',
    goalSetting = 'goalSetting',
    competitiveness = 'competitiveness',
    // resilience = 'resilience', // ! duplicate
    handlingPressure = 'handlingPressure',

    // teamwork
    communication = 'communication',
    cooperation = 'cooperation',
    roleUnderstanding = 'roleUnderstanding',
    strategy = 'strategy',
    sportsmanship = 'sportsmanship',

    // * Creative
    // visual arts
    drawing = 'drawing',
    painting = 'painting',
    sculpture = 'sculpture',
    graphicDesign = 'graphicDesign',
    photography = 'photography',

    // performing arts
    acting = 'acting',
    dance = 'dance',
    singing = 'singing',
    instrumental = 'instrumental',
    theaterProduction = 'theaterProduction',
    costumeDesign = 'costumeDesign',
    directing = 'directing',

    // writing
    poetry = 'poetry',
    fiction = 'fiction',
    nonfiction = 'nonfiction',
    scriptWriting = 'scriptWriting',
    copyWriting = 'copyWriting',
    journalism = 'journalism',

    // design
    fashionDesign = 'fashionDesign',
    interiorDesign = 'interiorDesign',
    webDesign = 'webDesign',
    productDesign = 'productDesign',
    gameDesign = 'gameDesign',

    // ideation
    brainstorming = 'brainstorming',
    conceptDevelopment = 'concept development',
    innovation = 'innovation',
    // problemSolving = 'problem-solving', // ! duplicate
    outOfTheBoxThinking = 'outOfTheBoxThinking',

    // * Business
    // management
    leadership = 'leadership',
    strategicPlanning = 'strategicPlanning',
    teamBuilding = 'teamBuilding',
    delegation = 'delegation',
    conflictResolution = 'conflictResolution',

    // finance
    accounting = 'accounting',
    budgeting = 'budgeting',
    financialAnalysis = 'financialAnalysis',
    investment = 'investment',
    riskManagement = 'riskManagement',

    // marketing
    marketResearch = 'marketResearch',
    branding = 'branding',
    advertising = 'advertising',
    sales = 'sales',
    customerRelationshipManagement = 'customerRelationshipManagement',

    // operations
    logistics = 'logistics',
    supplyChainManagement = 'supplyChainManagement',
    processImprovement = 'processImprovement',
    projectManagement = 'projectManagement',
    qualityControl = 'qualityControl',

    // entrepreneurship
    opportunityRecognition = 'opportunityRecognition',
    businessPlanning = 'businessPlanning',
    fundraising = 'fundraising',
    networking = 'networking',
    decisionMaking = 'decisionMaking',

    // * Trade
    // construction
    carpentry = 'carpentry',
    electricalWork = 'electricalWork',
    plumbing = 'plumbing',
    masonry = 'masonry',
    HVAC = 'HVAC',

    // mechanics
    automotiveRepair = 'automotiveRepair',
    dieselEngineRepair = 'dieselEngineRepair',
    smallEngineRepair = 'smallEngineRepair',
    aircraftMaintenance = 'aircraftMaintenance',
    heavyEquipmentOperation = 'heavyEquipmentOperation',

    // manufacturing
    welding = 'welding',
    machining = 'machining',
    assembly = 'assembly',
    fabrication = 'fabrication',
    qualityAssurance = 'qualityAssurance',

    // cosmetology
    hairstyling = 'hairstyling',
    barbering = 'barbering',
    nailTechnology = 'nailTechnology',
    makeupArtistry = 'makeupArtistry',
    esthetics = 'esthetics',

    // culinary arts
    cookingTechniques = 'cookingTechniques',
    baking = 'baking',
    foodSafety = 'foodSafety',
    menuPlanning = 'menuPlanning',
    restaurantManagement = 'restaurantManagement',

    // * Social
    // history
    researchMethods = 'researchMethods',
    analysisOfPrimarySources = 'analysisOfPrimarySources',
    chronologicalReasoning = 'chronologicalReasoning',
    comparativeHistory = 'comparativeHistory',
    historiography = 'historiography',

    // psychology
    cognitivePsychology = 'cognitivePsychology',
    developmentalPsychology = 'developmentalPsychology',
    socialPsychology = 'socialPsychology',
    experimentalMethods = 'experimentalMethods',
    clinicalPsychology = 'clinicalPsychology',

    // sociology
    socialInequality = 'socialInequality',
    socialInstitutions = 'socialInstitutions',
    // 'researchMethods = 'researchMethods', // !duplicate
    socialChange = 'socialChange',
    socialMovements = 'socialMovements',

    // economics
    microeconomics = 'microeconomics',
    macroeconomics = 'macroeconomics',
    econometrics = 'econometrics',
    economicPolicy = 'economicPolicy',
    internationalEconomics = 'internationalEconomics',

    // political science
    governmentSystems = 'governmentSystems',
    politicalTheory = 'politicalTheory',
    internationalRelations = 'internationalRelations',
    comparativePolitics = 'comparativePolitics',
    publicPolicy = 'publicPolicy',

    // * Digital
    // basic computer skills
    typing = 'typing',
    fileManagement = 'fileManagement',
    internetNavigation = 'internetNavigation',
    email = 'email',
    wordProcessing = 'wordProcessing',

    // information literacy
    searchEngineProficiency = 'searchEngineProficiency',
    evaluatingSources = 'evaluatingSources',
    factChecking = 'factChecking',
    criticalMediaAnalysis = 'criticalMediaAnalysis',
    understandingBias = 'understandingBias',

    // software proficiency
    productivitySuites = 'productivitySuites',
    specializedSoftware = 'specializedSoftware',
    designSoftware = 'designSoftware',
    programmingBasics = 'programmingBasics',
    dataVisualizationTools = 'dataVisualizationTools',

    // online communication
    netiquette = 'netiquette',
    effectiveEmailAndMessaging = 'effectiveEmailAndMessaging',
    socialMediaPlatforms = 'socialMediaPlatforms',
    videoConferencing = 'videoConferencing',
    collaborationTools = 'collaborationTools',

    // cyber security
    passwordManagement = 'passwordManagement',
    phishingAwareness = 'phishingAwareness',
    dataPrivacy = 'dataPrivacy',
    safeOnlinePractices = 'safeOnlinePractices',
    protectingDevices = 'protectingDevices',

    // * Medical
    // clinical skills
    patientAssessment = 'patientAssessment',
    diagnosticProcedures = 'diagnosticProcedures',
    medicationAdministration = 'medicationAdministration',
    woundCare = 'woundCare',
    basicLifeSupport = 'basicLifeSupport',

    // anatomy and physiology
    bodySystems = 'bodySystems',
    medicalTerminology = 'medicalTerminology',
    diseaseProcesses = 'diseaseProcesses',
    pharmacology = 'pharmacology',
    pathophysiology = 'pathophysiology',

    // patient care
    bedsideManner = 'bedsideManner',
    empathy = 'empathy',
    // 'communication = 'communication', // ! duplicate
    culturalSensitivity = 'culturalSensitivity',
    ethics = 'ethics',

    // medical specialties
    surgery = 'surgery',
    emergencyMedicine = 'emergencyMedicine',
    pediatrics = 'pediatrics',
    radiology = 'radiology',
    diagnosticReasoning = 'diagnosticReasoning',
    treatmentPlanning = 'treatmentPlanning',
    interdisciplinaryCollaboration = 'interdisciplinaryCollaboration',

    // healthcare administration
    insuranceAndBilling = 'insuranceAndBilling',
    medicalRecords = 'medicalRecords',
    patientScheduling = 'patientScheduling',
    regulatoryCompliance = 'regulatoryCompliance',
    facilityManagement = 'facilityManagement',
}

export const SKILLS_TO_SUBSKILLS = {
    // Durable
    [BoostCMSCategorySkillEnum.Adaptability]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.adaptability.flexibility.title']();
            },
            type: BoostCMSSubSkillEnum.flexibility,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.adaptability.resilience.title']();
            },
            type: BoostCMSSubSkillEnum.resilience,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.adaptability.problemSolving.title']();
            },
            type: BoostCMSSubSkillEnum.problemSolving,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.adaptability.resourcefulness.title']();
            },
            type: BoostCMSSubSkillEnum.resourcefulness,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.adaptability.stressManagement.title']();
            },
            type: BoostCMSSubSkillEnum.stressManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Perseverance]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.perseverance.discipline.title']();
            },
            type: BoostCMSSubSkillEnum.discipline,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.perseverance.focus.title']();
            },
            type: BoostCMSSubSkillEnum.focus,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.perseverance.commitment.title']();
            },
            type: BoostCMSSubSkillEnum.commitment,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.perseverance.grit.title']();
            },
            type: BoostCMSSubSkillEnum.grit,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.perseverance.tenacity.title']();
            },
            type: BoostCMSSubSkillEnum.tenacity,
        },
    ],
    [BoostCMSCategorySkillEnum.MentalToughness]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.mentalToughness.optimism.title']();
            },
            type: BoostCMSSubSkillEnum.optimism,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.mentalToughness.selfConfidence.title']();
            },
            type: BoostCMSSubSkillEnum.selfConfidence,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.mentalToughness.emotionalRegulation.title']();
            },
            type: BoostCMSSubSkillEnum.emotionalRegulation,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.mentalToughness.growthMindset.title']();
            },
            type: BoostCMSSubSkillEnum.growthMindset,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.mentalToughness.positiveSelfTalk.title']();
            },
            type: BoostCMSSubSkillEnum.positiveSelfTalk,
        },
    ],
    [BoostCMSCategorySkillEnum.PhysicalEndurance]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.physicalEndurance.strength.title']();
            },
            type: BoostCMSSubSkillEnum.strength,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.physicalEndurance.stamina.title']();
            },
            type: BoostCMSSubSkillEnum.stamina,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.physicalEndurance.cardiovascularFitness.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.cardiovascularFitness,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.physicalEndurance.painTolerance.title']();
            },
            type: BoostCMSSubSkillEnum.painTolerance,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.physicalEndurance.injuryPrevention.title']();
            },
            type: BoostCMSSubSkillEnum.injuryPrevention,
        },
    ],
    [BoostCMSCategorySkillEnum.LifelongLearning]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.lifelongLearning.curiosity.title']();
            },
            type: BoostCMSSubSkillEnum.curiosity,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.lifelongLearning.openMindedness.title']();
            },
            type: BoostCMSSubSkillEnum.openMindedness,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.lifelongLearning.criticalThinking.title']();
            },
            type: BoostCMSSubSkillEnum.criticalThinking,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.lifelongLearning.selfDirectedLearning.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.selfDirectedLearning,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.lifelongLearning.knowledgeRetention.title']();
            },
            type: BoostCMSSubSkillEnum.knowledgeRetention,
        },
    ],

    // STEM
    [BoostCMSCategorySkillEnum.Mathematics]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.mathematics.algebra.title']();
            },
            type: BoostCMSSubSkillEnum.algebra,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.mathematics.geometry.title']();
            },
            type: BoostCMSSubSkillEnum.geometry,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.mathematics.trigonometry.title']();
            },
            type: BoostCMSSubSkillEnum.trigonometry,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.mathematics.calculus.title']();
            },
            type: BoostCMSSubSkillEnum.calculus,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.mathematics.statistics.title']();
            },
            type: BoostCMSSubSkillEnum.statistics,
        },
    ],
    [BoostCMSCategorySkillEnum.Science]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.science.physics.title']();
            },
            type: BoostCMSSubSkillEnum.physics,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.science.chemistry.title']();
            },
            type: BoostCMSSubSkillEnum.chemistry,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.science.biology.title']();
            },
            type: BoostCMSSubSkillEnum.biology,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.science.earthScience.title']();
            },
            type: BoostCMSSubSkillEnum.earthScience,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.science.environmentalScience.title']();
            },
            type: BoostCMSSubSkillEnum.environmentalScience,
        },
    ],
    [BoostCMSCategorySkillEnum.Technology]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.technology.coding.title']();
            },
            type: BoostCMSSubSkillEnum.coding,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.technology.softwareDevelopment.title']();
            },
            type: BoostCMSSubSkillEnum.softwareDevelopment,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.technology.dataAnalysis.title']();
            },
            type: BoostCMSSubSkillEnum.dataAnalysis,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.technology.robotics.title']();
            },
            type: BoostCMSSubSkillEnum.robotics,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.technology.cybersecurity.title']();
            },
            type: BoostCMSSubSkillEnum.cybersecurity,
        },
    ],
    [BoostCMSCategorySkillEnum.Engineering]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.engineering.mechanicalEngineering.title']();
            },
            type: BoostCMSSubSkillEnum.mechanicalEngineering,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.engineering.electricalEngineering.title']();
            },
            type: BoostCMSSubSkillEnum.electricalEngineering,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.engineering.civilEngineering.title']();
            },
            type: BoostCMSSubSkillEnum.civilEngineering,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.engineering.chemicalEngineering.title']();
            },
            type: BoostCMSSubSkillEnum.chemicalEngineering,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.engineering.computerEngineering.title']();
            },
            type: BoostCMSSubSkillEnum.computerEngineering,
        },
    ],
    [BoostCMSCategorySkillEnum.Research]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.research.hypothesisDevelopment.title']();
            },
            type: BoostCMSSubSkillEnum.hypothesisDevelopment,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.research.experimentalDesign.title']();
            },
            type: BoostCMSSubSkillEnum.experimentalDesign,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.research.dataCollection.title']();
            },
            type: BoostCMSSubSkillEnum.dataCollection,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.research.analysis.title']();
            },
            type: BoostCMSSubSkillEnum.analysis,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.research.presentation.title']();
            },
            type: BoostCMSSubSkillEnum.presentation,
        },
    ],

    // athletic
    [BoostCMSCategorySkillEnum.SportSpecificSkills]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.sportSpecificSkills.ballHandling.title']();
            },
            type: BoostCMSSubSkillEnum.ballHandling,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.sportSpecificSkills.runningTechnique.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.runningTechnique,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.sportSpecificSkills.swingMechanics.title']();
            },
            type: BoostCMSSubSkillEnum.swingMechanics,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.sportSpecificSkills.tackling.title']();
            },
            type: BoostCMSSubSkillEnum.tackling,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.sportSpecificSkills.swimmingStrokes.title']();
            },
            type: BoostCMSSubSkillEnum.swimmingStrokes,
        },
    ],
    [BoostCMSCategorySkillEnum.StrengthAndConditioning]: [
        {
            id: 1,
            get title() {
                return m[
                    'boostContent.skillSubskills.strengthAndConditioning.weightLifting.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.weightLifting,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.strengthAndConditioning.speedTraining.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.speedTraining,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.strengthAndConditioning.agility.title']();
            },
            type: BoostCMSSubSkillEnum.agility,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.strengthAndConditioning.flexibility.title']();
            },
            type: BoostCMSSubSkillEnum.flexibility,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.strengthAndConditioning.injuryPrevention.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.injuryPrevention,
        },
    ],
    [BoostCMSCategorySkillEnum.Coordination]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.coordination.handEyeCoordination.title']();
            },
            type: BoostCMSSubSkillEnum.handEyeCoordination,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.coordination.footwork.title']();
            },
            type: BoostCMSSubSkillEnum.footwork,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.coordination.balance.title']();
            },
            type: BoostCMSSubSkillEnum.balance,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.coordination.reactionTime.title']();
            },
            type: BoostCMSSubSkillEnum.reactionTime,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.coordination.spatialAwareness.title']();
            },
            type: BoostCMSSubSkillEnum.spatialAwareness,
        },
    ],
    [BoostCMSCategorySkillEnum.MentalFocus]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.mentalFocus.visualization.title']();
            },
            type: BoostCMSSubSkillEnum.visualization,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.mentalFocus.goalSetting.title']();
            },
            type: BoostCMSSubSkillEnum.goalSetting,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.mentalFocus.competitiveness.title']();
            },
            type: BoostCMSSubSkillEnum.competitiveness,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.mentalFocus.resilience.title']();
            },
            type: BoostCMSSubSkillEnum.resilience,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.mentalFocus.handlingPressure.title']();
            },
            type: BoostCMSSubSkillEnum.handlingPressure,
        },
    ],
    [BoostCMSCategorySkillEnum.Teamwork]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.teamwork.communication.title']();
            },
            type: BoostCMSSubSkillEnum.communication,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.teamwork.cooperation.title']();
            },
            type: BoostCMSSubSkillEnum.cooperation,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.teamwork.roleUnderstanding.title']();
            },
            type: BoostCMSSubSkillEnum.roleUnderstanding,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.teamwork.strategy.title']();
            },
            type: BoostCMSSubSkillEnum.strategy,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.teamwork.sportsmanship.title']();
            },
            type: BoostCMSSubSkillEnum.sportsmanship,
        },
    ],

    // creative
    [BoostCMSCategorySkillEnum.VisualArts]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.visualArts.drawing.title']();
            },
            type: BoostCMSSubSkillEnum.drawing,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.visualArts.painting.title']();
            },
            type: BoostCMSSubSkillEnum.painting,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.visualArts.sculpture.title']();
            },
            type: BoostCMSSubSkillEnum.sculpture,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.visualArts.graphicDesign.title']();
            },
            type: BoostCMSSubSkillEnum.graphicDesign,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.visualArts.photography.title']();
            },
            type: BoostCMSSubSkillEnum.photography,
        },
    ],
    [BoostCMSCategorySkillEnum.PerformingArts]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.performingArts.acting.title']();
            },
            type: BoostCMSSubSkillEnum.acting,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.performingArts.dance.title']();
            },
            type: BoostCMSSubSkillEnum.dance,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.performingArts.singing.title']();
            },
            type: BoostCMSSubSkillEnum.singing,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.performingArts.instrumental.title']();
            },
            type: BoostCMSSubSkillEnum.instrumental,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.performingArts.theaterProduction.title']();
            },
            type: BoostCMSSubSkillEnum.theaterProduction,
        },
        {
            id: 6,
            get title() {
                return m['boostContent.skillSubskills.performingArts.costumeDesign.title']();
            },
            type: BoostCMSSubSkillEnum.costumeDesign,
        },
        {
            id: 7,
            get title() {
                return m['boostContent.skillSubskills.performingArts.directing.title']();
            },
            type: BoostCMSSubSkillEnum.directing,
        },
    ],
    [BoostCMSCategorySkillEnum.Writing]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.writing.poetry.title']();
            },
            type: BoostCMSSubSkillEnum.poetry,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.writing.fiction.title']();
            },
            type: BoostCMSSubSkillEnum.fiction,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.writing.nonfiction.title']();
            },
            type: BoostCMSSubSkillEnum.nonfiction,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.writing.scriptWriting.title']();
            },
            type: BoostCMSSubSkillEnum.scriptWriting,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.writing.copyWriting.title']();
            },
            type: BoostCMSSubSkillEnum.copyWriting,
        },
        {
            id: 6,
            get title() {
                return m['boostContent.skillSubskills.writing.journalism.title']();
            },
            type: BoostCMSSubSkillEnum.journalism,
        },
    ],
    [BoostCMSCategorySkillEnum.Design]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.design.fashionDesign.title']();
            },
            type: BoostCMSSubSkillEnum.fashionDesign,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.design.interiorDesign.title']();
            },
            type: BoostCMSSubSkillEnum.interiorDesign,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.design.webDesign.title']();
            },
            type: BoostCMSSubSkillEnum.webDesign,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.design.productDesign.title']();
            },
            type: BoostCMSSubSkillEnum.productDesign,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.design.gameDesign.title']();
            },
            type: BoostCMSSubSkillEnum.gameDesign,
        },
    ],
    [BoostCMSCategorySkillEnum.Ideation]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.ideation.brainstorming.title']();
            },
            type: BoostCMSSubSkillEnum.brainstorming,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.ideation.conceptDevelopment.title']();
            },
            type: BoostCMSSubSkillEnum.conceptDevelopment,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.ideation.innovation.title']();
            },
            type: BoostCMSSubSkillEnum.innovation,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.ideation.problemSolving.title']();
            },
            type: BoostCMSSubSkillEnum.problemSolving,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.ideation.outOfTheBoxThinking.title']();
            },
            type: BoostCMSSubSkillEnum.outOfTheBoxThinking,
        },
    ],

    // business
    [BoostCMSCategorySkillEnum.Management]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.management.leadership.title']();
            },
            type: BoostCMSSubSkillEnum.leadership,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.management.strategicPlanning.title']();
            },
            type: BoostCMSSubSkillEnum.strategicPlanning,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.management.teamBuilding.title']();
            },
            type: BoostCMSSubSkillEnum.teamBuilding,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.management.delegation.title']();
            },
            type: BoostCMSSubSkillEnum.delegation,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.management.conflictResolution.title']();
            },
            type: BoostCMSSubSkillEnum.conflictResolution,
        },
    ],
    [BoostCMSCategorySkillEnum.Finance]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.finance.accounting.title']();
            },
            type: BoostCMSSubSkillEnum.accounting,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.finance.budgeting.title']();
            },
            type: BoostCMSSubSkillEnum.budgeting,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.finance.financialAnalysis.title']();
            },
            type: BoostCMSSubSkillEnum.financialAnalysis,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.finance.investment.title']();
            },
            type: BoostCMSSubSkillEnum.investment,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.finance.riskManagement.title']();
            },
            type: BoostCMSSubSkillEnum.riskManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Marketing]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.marketing.marketResearch.title']();
            },
            type: BoostCMSSubSkillEnum.marketResearch,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.marketing.branding.title']();
            },
            type: BoostCMSSubSkillEnum.branding,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.marketing.advertising.title']();
            },
            type: BoostCMSSubSkillEnum.advertising,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.marketing.sales.title']();
            },
            type: BoostCMSSubSkillEnum.sales,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.marketing.customerRelationshipManagement.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.customerRelationshipManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Operations]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.operations.logistics.title']();
            },
            type: BoostCMSSubSkillEnum.logistics,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.operations.supplyChainManagement.title']();
            },
            type: BoostCMSSubSkillEnum.supplyChainManagement,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.operations.processImprovement.title']();
            },
            type: BoostCMSSubSkillEnum.processImprovement,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.operations.projectManagement.title']();
            },
            type: BoostCMSSubSkillEnum.projectManagement,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.operations.qualityControl.title']();
            },
            type: BoostCMSSubSkillEnum.qualityControl,
        },
    ],
    [BoostCMSCategorySkillEnum.Entrepreneurship]: [
        {
            id: 1,
            get title() {
                return m[
                    'boostContent.skillSubskills.entrepreneurship.opportunityRecognition.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.opportunityRecognition,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.entrepreneurship.businessPlanning.title']();
            },
            type: BoostCMSSubSkillEnum.businessPlanning,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.entrepreneurship.fundraising.title']();
            },
            type: BoostCMSSubSkillEnum.fundraising,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.entrepreneurship.networking.title']();
            },
            type: BoostCMSSubSkillEnum.networking,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.entrepreneurship.decisionMaking.title']();
            },
            type: BoostCMSSubSkillEnum.decisionMaking,
        },
    ],

    // trade
    [BoostCMSCategorySkillEnum.Construction]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.construction.carpentry.title']();
            },
            type: BoostCMSSubSkillEnum.carpentry,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.construction.electricalWork.title']();
            },
            type: BoostCMSSubSkillEnum.electricalWork,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.construction.plumbing.title']();
            },
            type: BoostCMSSubSkillEnum.plumbing,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.construction.masonry.title']();
            },
            type: BoostCMSSubSkillEnum.masonry,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.construction.hVAC.title']();
            },
            type: BoostCMSSubSkillEnum.HVAC,
        },
    ],
    [BoostCMSCategorySkillEnum.Mechanics]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.mechanics.automotiveRepair.title']();
            },
            type: BoostCMSSubSkillEnum.automotiveRepair,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.mechanics.dieselEngineRepair.title']();
            },
            type: BoostCMSSubSkillEnum.dieselEngineRepair,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.mechanics.smallEngineRepair.title']();
            },
            type: BoostCMSSubSkillEnum.smallEngineRepair,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.mechanics.aircraftMaintenance.title']();
            },
            type: BoostCMSSubSkillEnum.aircraftMaintenance,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.mechanics.heavyEquipmentOperation.title']();
            },
            type: BoostCMSSubSkillEnum.heavyEquipmentOperation,
        },
    ],
    [BoostCMSCategorySkillEnum.Manufacturing]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.manufacturing.welding.title']();
            },
            type: BoostCMSSubSkillEnum.welding,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.manufacturing.machining.title']();
            },
            type: BoostCMSSubSkillEnum.machining,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.manufacturing.assembly.title']();
            },
            type: BoostCMSSubSkillEnum.assembly,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.manufacturing.fabrication.title']();
            },
            type: BoostCMSSubSkillEnum.fabrication,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.manufacturing.qualityAssurance.title']();
            },
            type: BoostCMSSubSkillEnum.qualityAssurance,
        },
    ],
    [BoostCMSCategorySkillEnum.Cosmetology]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.cosmetology.hairstyling.title']();
            },
            type: BoostCMSSubSkillEnum.hairstyling,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.cosmetology.barbering.title']();
            },
            type: BoostCMSSubSkillEnum.barbering,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.cosmetology.nailTechnology.title']();
            },
            type: BoostCMSSubSkillEnum.nailTechnology,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.cosmetology.makeupArtistry.title']();
            },
            type: BoostCMSSubSkillEnum.makeupArtistry,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.cosmetology.esthetics.title']();
            },
            type: BoostCMSSubSkillEnum.esthetics,
        },
    ],
    [BoostCMSCategorySkillEnum.CulinaryArts]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.culinaryArts.cookingTechniques.title']();
            },
            type: BoostCMSSubSkillEnum.cookingTechniques,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.culinaryArts.baking.title']();
            },
            type: BoostCMSSubSkillEnum.baking,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.culinaryArts.foodSafety.title']();
            },
            type: BoostCMSSubSkillEnum.foodSafety,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.culinaryArts.menuPlanning.title']();
            },
            type: BoostCMSSubSkillEnum.menuPlanning,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.culinaryArts.restaurantManagement.title']();
            },
            type: BoostCMSSubSkillEnum.restaurantManagement,
        },
    ],

    // social
    [BoostCMSCategorySkillEnum.History]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.history.researchMethods.title']();
            },
            type: BoostCMSSubSkillEnum.researchMethods,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.history.analysisOfPrimarySources.title']();
            },
            type: BoostCMSSubSkillEnum.analysisOfPrimarySources,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.history.chronologicalReasoning.title']();
            },
            type: BoostCMSSubSkillEnum.chronologicalReasoning,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.history.comparativeHistory.title']();
            },
            type: BoostCMSSubSkillEnum.comparativeHistory,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.history.historiography.title']();
            },
            type: BoostCMSSubSkillEnum.historiography,
        },
    ],
    [BoostCMSCategorySkillEnum.Psychology]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.psychology.cognitivePsychology.title']();
            },
            type: BoostCMSSubSkillEnum.cognitivePsychology,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.psychology.developmentalPsychology.title']();
            },
            type: BoostCMSSubSkillEnum.developmentalPsychology,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.psychology.socialPsychology.title']();
            },
            type: BoostCMSSubSkillEnum.socialPsychology,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.psychology.experimentalMethods.title']();
            },
            type: BoostCMSSubSkillEnum.experimentalMethods,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.psychology.clinicalPsychology.title']();
            },
            type: BoostCMSSubSkillEnum.clinicalPsychology,
        },
    ],
    [BoostCMSCategorySkillEnum.Sociology]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.sociology.socialInequality.title']();
            },
            type: BoostCMSSubSkillEnum.socialInequality,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.sociology.socialInstitutions.title']();
            },
            type: BoostCMSSubSkillEnum.socialInstitutions,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.sociology.researchMethods.title']();
            },
            type: BoostCMSSubSkillEnum.researchMethods,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.sociology.socialChange.title']();
            },
            type: BoostCMSSubSkillEnum.socialChange,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.sociology.socialMovements.title']();
            },
            type: BoostCMSSubSkillEnum.socialMovements,
        },
    ],
    [BoostCMSCategorySkillEnum.Economics]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.economics.microeconomics.title']();
            },
            type: BoostCMSSubSkillEnum.microeconomics,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.economics.macroeconomics.title']();
            },
            type: BoostCMSSubSkillEnum.macroeconomics,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.economics.econometrics.title']();
            },
            type: BoostCMSSubSkillEnum.econometrics,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.economics.economicPolicy.title']();
            },
            type: BoostCMSSubSkillEnum.economicPolicy,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.economics.internationalEconomics.title']();
            },
            type: BoostCMSSubSkillEnum.internationalEconomics,
        },
    ],
    [BoostCMSCategorySkillEnum.PoliticalScience]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.politicalScience.governmentSystems.title']();
            },
            type: BoostCMSSubSkillEnum.governmentSystems,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.politicalScience.politicalTheory.title']();
            },
            type: BoostCMSSubSkillEnum.politicalTheory,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.politicalScience.internationalRelations.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.internationalRelations,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.politicalScience.comparativePolitics.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.comparativePolitics,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.politicalScience.publicPolicy.title']();
            },
            type: BoostCMSSubSkillEnum.publicPolicy,
        },
    ],

    // digital
    [BoostCMSCategorySkillEnum.BasicComputerSkills]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.basicComputerSkills.typing.title']();
            },
            type: BoostCMSSubSkillEnum.typing,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.basicComputerSkills.fileManagement.title']();
            },
            type: BoostCMSSubSkillEnum.fileManagement,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.basicComputerSkills.internetNavigation.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.internetNavigation,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.basicComputerSkills.email.title']();
            },
            type: BoostCMSSubSkillEnum.email,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.basicComputerSkills.wordProcessing.title']();
            },
            type: BoostCMSSubSkillEnum.wordProcessing,
        },
    ],
    [BoostCMSCategorySkillEnum.InformationLiteracy]: [
        {
            id: 1,
            get title() {
                return m[
                    'boostContent.skillSubskills.informationLiteracy.searchEngineProficiency.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.searchEngineProficiency,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.informationLiteracy.evaluatingSources.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.evaluatingSources,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.informationLiteracy.factChecking.title']();
            },
            type: BoostCMSSubSkillEnum.factChecking,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.informationLiteracy.criticalMediaAnalysis.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.criticalMediaAnalysis,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.informationLiteracy.understandingBias.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.understandingBias,
        },
    ],
    [BoostCMSCategorySkillEnum.SoftwareProficiency]: [
        {
            id: 1,
            get title() {
                return m[
                    'boostContent.skillSubskills.softwareProficiency.productivitySuites.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.productivitySuites,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.softwareProficiency.specializedSoftware.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.specializedSoftware,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.softwareProficiency.designSoftware.title']();
            },
            type: BoostCMSSubSkillEnum.designSoftware,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.softwareProficiency.programmingBasics.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.programmingBasics,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.softwareProficiency.dataVisualizationTools.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.dataVisualizationTools,
        },
    ],
    [BoostCMSCategorySkillEnum.OnlineCommunication]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.onlineCommunication.netiquette.title']();
            },
            type: BoostCMSSubSkillEnum.netiquette,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.onlineCommunication.effectiveEmailAndMessaging.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.effectiveEmailAndMessaging,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.onlineCommunication.socialMediaPlatforms.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.socialMediaPlatforms,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.onlineCommunication.videoConferencing.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.videoConferencing,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.onlineCommunication.collaborationTools.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.collaborationTools,
        },
    ],
    [BoostCMSCategorySkillEnum.Cybersecurity]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.cybersecurity.passwordManagement.title']();
            },
            type: BoostCMSSubSkillEnum.passwordManagement,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.cybersecurity.phishingAwareness.title']();
            },
            type: BoostCMSSubSkillEnum.phishingAwareness,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.cybersecurity.dataPrivacy.title']();
            },
            type: BoostCMSSubSkillEnum.dataPrivacy,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.cybersecurity.safeOnlinePractices.title']();
            },
            type: BoostCMSSubSkillEnum.safeOnlinePractices,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.cybersecurity.protectingDevices.title']();
            },
            type: BoostCMSSubSkillEnum.protectingDevices,
        },
    ],

    // medical
    [BoostCMSCategorySkillEnum.ClinicalSkills]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.clinicalSkills.patientAssessment.title']();
            },
            type: BoostCMSSubSkillEnum.patientAssessment,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.clinicalSkills.diagnosticProcedures.title']();
            },
            type: BoostCMSSubSkillEnum.diagnosticProcedures,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.clinicalSkills.medicationAdministration.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.medicationAdministration,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.clinicalSkills.woundCare.title']();
            },
            type: BoostCMSSubSkillEnum.woundCare,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.clinicalSkills.basicLifeSupport.title']();
            },
            type: BoostCMSSubSkillEnum.basicLifeSupport,
        },
    ],
    [BoostCMSCategorySkillEnum.AnatomyAndPhysiology]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.anatomyAndPhysiology.bodySystems.title']();
            },
            type: BoostCMSSubSkillEnum.bodySystems,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.anatomyAndPhysiology.medicalTerminology.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.medicalTerminology,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.anatomyAndPhysiology.diseaseProcesses.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.diseaseProcesses,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.anatomyAndPhysiology.pharmacology.title']();
            },
            type: BoostCMSSubSkillEnum.pharmacology,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.anatomyAndPhysiology.pathophysiology.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.pathophysiology,
        },
    ],
    [BoostCMSCategorySkillEnum.PatientCare]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.patientCare.bedsideManner.title']();
            },
            type: BoostCMSSubSkillEnum.bedsideManner,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.skillSubskills.patientCare.empathy.title']();
            },
            type: BoostCMSSubSkillEnum.empathy,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.patientCare.communication.title']();
            },
            type: BoostCMSSubSkillEnum.communication,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.patientCare.culturalSensitivity.title']();
            },
            type: BoostCMSSubSkillEnum.culturalSensitivity,
        },
        {
            id: 5,
            get title() {
                return m['boostContent.skillSubskills.patientCare.ethics.title']();
            },
            type: BoostCMSSubSkillEnum.ethics,
        },
    ],
    [BoostCMSCategorySkillEnum.MedicalSpecialties]: [
        {
            id: 1,
            get title() {
                return m['boostContent.skillSubskills.medicalSpecialties.surgery.title']();
            },
            type: BoostCMSSubSkillEnum.surgery,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.medicalSpecialties.emergencyMedicine.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.emergencyMedicine,
        },
        {
            id: 3,
            get title() {
                return m['boostContent.skillSubskills.medicalSpecialties.pediatrics.title']();
            },
            type: BoostCMSSubSkillEnum.pediatrics,
        },
        {
            id: 4,
            get title() {
                return m['boostContent.skillSubskills.medicalSpecialties.radiology.title']();
            },
            type: BoostCMSSubSkillEnum.radiology,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.medicalSpecialties.diagnosticReasoning.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.diagnosticReasoning,
        },
        {
            id: 6,
            get title() {
                return m[
                    'boostContent.skillSubskills.medicalSpecialties.treatmentPlanning.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.treatmentPlanning,
        },
        {
            id: 7,
            get title() {
                return m[
                    'boostContent.skillSubskills.medicalSpecialties.interdisciplinaryCollaboration.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.interdisciplinaryCollaboration,
        },
    ],
    [BoostCMSCategorySkillEnum.HealthcareAdministration]: [
        {
            id: 1,
            get title() {
                return m[
                    'boostContent.skillSubskills.healthcareAdministration.insuranceAndBilling.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.insuranceAndBilling,
        },
        {
            id: 2,
            get title() {
                return m[
                    'boostContent.skillSubskills.healthcareAdministration.medicalRecords.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.medicalRecords,
        },
        {
            id: 3,
            get title() {
                return m[
                    'boostContent.skillSubskills.healthcareAdministration.patientScheduling.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.patientScheduling,
        },
        {
            id: 4,
            get title() {
                return m[
                    'boostContent.skillSubskills.healthcareAdministration.regulatoryCompliance.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.regulatoryCompliance,
        },
        {
            id: 5,
            get title() {
                return m[
                    'boostContent.skillSubskills.healthcareAdministration.facilityManagement.title'
                ]();
            },
            type: BoostCMSSubSkillEnum.facilityManagement,
        },
    ],
};

/**
 * A flat list of all skills with category, type, title, and description.
 */
export const SKILLS: {
    category: BoostCMSSKillsCategoryEnum;
    type: BoostCMSCategorySkillEnum;
    title: string;
    description: string;
}[] = [
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.Adaptability,
        get title() {
            return m['boostContent.skills.adaptability.title']();
        },
        get description() {
            return m['boostContent.skills.adaptability.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.Perseverance,
        get title() {
            return m['boostContent.skills.perseverance.title']();
        },
        get description() {
            return m['boostContent.skills.perseverance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.MentalToughness,
        get title() {
            return m['boostContent.skills.mentalToughness.title']();
        },
        get description() {
            return m['boostContent.skills.mentalToughness.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.PhysicalEndurance,
        get title() {
            return m['boostContent.skills.physicalEndurance.title']();
        },
        get description() {
            return m['boostContent.skills.physicalEndurance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.LifelongLearning,
        get title() {
            return m['boostContent.skills.lifelongLearning.title']();
        },
        get description() {
            return m['boostContent.skills.lifelongLearning.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Mathematics,
        get title() {
            return m['boostContent.skills.mathematics.title']();
        },
        get description() {
            return m['boostContent.skills.mathematics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Science,
        get title() {
            return m['boostContent.skills.science.title']();
        },
        get description() {
            return m['boostContent.skills.science.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Technology,
        get title() {
            return m['boostContent.skills.technology.title']();
        },
        get description() {
            return m['boostContent.skills.technology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Engineering,
        get title() {
            return m['boostContent.skills.engineering.title']();
        },
        get description() {
            return m['boostContent.skills.engineering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Research,
        get title() {
            return m['boostContent.skills.research.title']();
        },
        get description() {
            return m['boostContent.skills.research.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.SportSpecificSkills,
        get title() {
            return m['boostContent.skills.sportSpecificSkills.title']();
        },
        get description() {
            return m['boostContent.skills.sportSpecificSkills.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        get title() {
            return m['boostContent.skills.strengthAndConditioning.title']();
        },
        get description() {
            return m['boostContent.skills.strengthAndConditioning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.Coordination,
        get title() {
            return m['boostContent.skills.coordination.title']();
        },
        get description() {
            return m['boostContent.skills.coordination.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.MentalFocus,
        get title() {
            return m['boostContent.skills.mentalFocus.title']();
        },
        get description() {
            return m['boostContent.skills.mentalFocus.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.Teamwork,
        get title() {
            return m['boostContent.skills.teamwork.title']();
        },
        get description() {
            return m['boostContent.skills.teamwork.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.VisualArts,
        get title() {
            return m['boostContent.skills.visualArts.title']();
        },
        get description() {
            return m['boostContent.skills.visualArts.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.PerformingArts,
        get title() {
            return m['boostContent.skills.performingArts.title']();
        },
        get description() {
            return m['boostContent.skills.performingArts.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Writing,
        get title() {
            return m['boostContent.skills.writing.title']();
        },
        get description() {
            return m['boostContent.skills.writing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Design,
        get title() {
            return m['boostContent.skills.design.title']();
        },
        get description() {
            return m['boostContent.skills.design.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Ideation,
        get title() {
            return m['boostContent.skills.ideation.title']();
        },
        get description() {
            return m['boostContent.skills.ideation.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Management,
        get title() {
            return m['boostContent.skills.management.title']();
        },
        get description() {
            return m['boostContent.skills.management.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Finance,
        get title() {
            return m['boostContent.skills.finance.title']();
        },
        get description() {
            return m['boostContent.skills.finance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Marketing,
        get title() {
            return m['boostContent.skills.marketing.title']();
        },
        get description() {
            return m['boostContent.skills.marketing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Operations,
        get title() {
            return m['boostContent.skills.operations.title']();
        },
        get description() {
            return m['boostContent.skills.operations.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Entrepreneurship,
        get title() {
            return m['boostContent.skills.entrepreneurship.title']();
        },
        get description() {
            return m['boostContent.skills.entrepreneurship.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Construction,
        get title() {
            return m['boostContent.skills.construction.title']();
        },
        get description() {
            return m['boostContent.skills.construction.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Mechanics,
        get title() {
            return m['boostContent.skills.mechanics.title']();
        },
        get description() {
            return m['boostContent.skills.mechanics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Manufacturing,
        get title() {
            return m['boostContent.skills.manufacturing.title']();
        },
        get description() {
            return m['boostContent.skills.manufacturing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Cosmetology,
        get title() {
            return m['boostContent.skills.cosmetology.title']();
        },
        get description() {
            return m['boostContent.skills.cosmetology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.CulinaryArts,
        get title() {
            return m['boostContent.skills.culinaryArts.title']();
        },
        get description() {
            return m['boostContent.skills.culinaryArts.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.History,
        get title() {
            return m['boostContent.skills.history.title']();
        },
        get description() {
            return m['boostContent.skills.history.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Psychology,
        get title() {
            return m['boostContent.skills.psychology.title']();
        },
        get description() {
            return m['boostContent.skills.psychology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Sociology,
        get title() {
            return m['boostContent.skills.sociology.title']();
        },
        get description() {
            return m['boostContent.skills.sociology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Economics,
        get title() {
            return m['boostContent.skills.economics.title']();
        },
        get description() {
            return m['boostContent.skills.economics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.PoliticalScience,
        get title() {
            return m['boostContent.skills.politicalScience.title']();
        },
        get description() {
            return m['boostContent.skills.politicalScience.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.BasicComputerSkills,
        get title() {
            return m['boostContent.skills.basicComputerSkills.title']();
        },
        get description() {
            return m['boostContent.skills.basicComputerSkills.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.InformationLiteracy,
        get title() {
            return m['boostContent.skills.informationLiteracy.title']();
        },
        get description() {
            return m['boostContent.skills.informationLiteracy.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.SoftwareProficiency,
        get title() {
            return m['boostContent.skills.softwareProficiency.title']();
        },
        get description() {
            return m['boostContent.skills.softwareProficiency.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.OnlineCommunication,
        get title() {
            return m['boostContent.skills.onlineCommunication.title']();
        },
        get description() {
            return m['boostContent.skills.onlineCommunication.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.Cybersecurity,
        get title() {
            return m['boostContent.skills.cybersecurity.title']();
        },
        get description() {
            return m['boostContent.skills.cybersecurity.description']();
        },
    },

    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.ClinicalSkills,
        get title() {
            return m['boostContent.skills.clinicalSkills.title']();
        },
        get description() {
            return m['boostContent.skills.clinicalSkills.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        get title() {
            return m['boostContent.skills.anatomyAndPhysiology.title']();
        },
        get description() {
            return m['boostContent.skills.anatomyAndPhysiology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.PatientCare,
        get title() {
            return m['boostContent.skills.patientCare.title']();
        },
        get description() {
            return m['boostContent.skills.patientCare.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.MedicalSpecialties,
        get title() {
            return m['boostContent.skills.medicalSpecialties.title']();
        },
        get description() {
            return m['boostContent.skills.medicalSpecialties.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.HealthcareAdministration,
        get title() {
            return m['boostContent.skills.healthcareAdministration.title']();
        },
        get description() {
            return m['boostContent.skills.healthcareAdministration.description']();
        },
    },
];

/**
 * Flat list of all subskills with their category, parent skill, type, title, and description.
 */
export const SUBSKILLS: {
    category: BoostCMSSKillsCategoryEnum;
    skill: BoostCMSCategorySkillEnum;
    type: BoostCMSSubSkillEnum;
    title: string;
    description: string;
}[] = [
    // Durable > Adaptability
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.flexibility,
        get title() {
            return m['boostContent.subskills.adaptability.flexibility.title']();
        },
        get description() {
            return m['boostContent.subskills.adaptability.flexibility.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.resilience,
        get title() {
            return m['boostContent.subskills.adaptability.resilience.title']();
        },
        get description() {
            return m['boostContent.subskills.adaptability.resilience.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.problemSolving,
        get title() {
            return m['boostContent.subskills.adaptability.problemSolving.title']();
        },
        get description() {
            return m['boostContent.subskills.adaptability.problemSolving.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.resourcefulness,
        get title() {
            return m['boostContent.subskills.adaptability.resourcefulness.title']();
        },
        get description() {
            return m['boostContent.subskills.adaptability.resourcefulness.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.stressManagement,
        get title() {
            return m['boostContent.subskills.adaptability.stressManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.adaptability.stressManagement.description']();
        },
    },

    // Durable > Perseverance
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.discipline,
        get title() {
            return m['boostContent.subskills.perseverance.discipline.title']();
        },
        get description() {
            return m['boostContent.subskills.perseverance.discipline.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.focus,
        get title() {
            return m['boostContent.subskills.perseverance.focus.title']();
        },
        get description() {
            return m['boostContent.subskills.perseverance.focus.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.commitment,
        get title() {
            return m['boostContent.subskills.perseverance.commitment.title']();
        },
        get description() {
            return m['boostContent.subskills.perseverance.commitment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.grit,
        get title() {
            return m['boostContent.subskills.perseverance.grit.title']();
        },
        get description() {
            return m['boostContent.subskills.perseverance.grit.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.tenacity,
        get title() {
            return m['boostContent.subskills.perseverance.tenacity.title']();
        },
        get description() {
            return m['boostContent.subskills.perseverance.tenacity.description']();
        },
    },

    // Durable > Mental Toughness
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.optimism,
        get title() {
            return m['boostContent.subskills.mentalToughness.optimism.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalToughness.optimism.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.selfConfidence,
        get title() {
            return m['boostContent.subskills.mentalToughness.selfConfidence.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalToughness.selfConfidence.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.emotionalRegulation,
        get title() {
            return m['boostContent.subskills.mentalToughness.emotionalRegulation.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalToughness.emotionalRegulation.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.growthMindset,
        get title() {
            return m['boostContent.subskills.mentalToughness.growthMindset.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalToughness.growthMindset.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.positiveSelfTalk,
        get title() {
            return m['boostContent.subskills.mentalToughness.positiveSelfTalk.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalToughness.positiveSelfTalk.description']();
        },
    },

    // Durable > Physical Endurance
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.strength,
        get title() {
            return m['boostContent.subskills.physicalEndurance.strength.title']();
        },
        get description() {
            return m['boostContent.subskills.physicalEndurance.strength.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.stamina,
        get title() {
            return m['boostContent.subskills.physicalEndurance.stamina.title']();
        },
        get description() {
            return m['boostContent.subskills.physicalEndurance.stamina.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.cardiovascularFitness,
        get title() {
            return m['boostContent.subskills.physicalEndurance.cardiovascularFitness.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.physicalEndurance.cardiovascularFitness.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.painTolerance,
        get title() {
            return m['boostContent.subskills.physicalEndurance.painTolerance.title']();
        },
        get description() {
            return m['boostContent.subskills.physicalEndurance.painTolerance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.injuryPrevention,
        get title() {
            return m['boostContent.subskills.physicalEndurance.injuryPrevention.title']();
        },
        get description() {
            return m['boostContent.subskills.physicalEndurance.injuryPrevention.description']();
        },
    },

    // Durable > Lifelong Learning
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.curiosity,
        get title() {
            return m['boostContent.subskills.lifelongLearning.curiosity.title']();
        },
        get description() {
            return m['boostContent.subskills.lifelongLearning.curiosity.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.openMindedness,
        get title() {
            return m['boostContent.subskills.lifelongLearning.openMindedness.title']();
        },
        get description() {
            return m['boostContent.subskills.lifelongLearning.openMindedness.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.criticalThinking,
        get title() {
            return m['boostContent.subskills.lifelongLearning.criticalThinking.title']();
        },
        get description() {
            return m['boostContent.subskills.lifelongLearning.criticalThinking.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.selfDirectedLearning,
        get title() {
            return m['boostContent.subskills.lifelongLearning.selfDirectedLearning.title']();
        },
        get description() {
            return m['boostContent.subskills.lifelongLearning.selfDirectedLearning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.knowledgeRetention,
        get title() {
            return m['boostContent.subskills.lifelongLearning.knowledgeRetention.title']();
        },
        get description() {
            return m['boostContent.subskills.lifelongLearning.knowledgeRetention.description']();
        },
    },
    // STEM > Mathematics
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.algebra,
        get title() {
            return m['boostContent.subskills.mathematics.algebra.title']();
        },
        get description() {
            return m['boostContent.subskills.mathematics.algebra.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.geometry,
        get title() {
            return m['boostContent.subskills.mathematics.geometry.title']();
        },
        get description() {
            return m['boostContent.subskills.mathematics.geometry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.trigonometry,
        get title() {
            return m['boostContent.subskills.mathematics.trigonometry.title']();
        },
        get description() {
            return m['boostContent.subskills.mathematics.trigonometry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.calculus,
        get title() {
            return m['boostContent.subskills.mathematics.calculus.title']();
        },
        get description() {
            return m['boostContent.subskills.mathematics.calculus.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.statistics,
        get title() {
            return m['boostContent.subskills.mathematics.statistics.title']();
        },
        get description() {
            return m['boostContent.subskills.mathematics.statistics.description']();
        },
    },

    // STEM > Science
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.physics,
        get title() {
            return m['boostContent.subskills.science.physics.title']();
        },
        get description() {
            return m['boostContent.subskills.science.physics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.chemistry,
        get title() {
            return m['boostContent.subskills.science.chemistry.title']();
        },
        get description() {
            return m['boostContent.subskills.science.chemistry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.biology,
        get title() {
            return m['boostContent.subskills.science.biology.title']();
        },
        get description() {
            return m['boostContent.subskills.science.biology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.earthScience,
        get title() {
            return m['boostContent.subskills.science.earthScience.title']();
        },
        get description() {
            return m['boostContent.subskills.science.earthScience.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.environmentalScience,
        get title() {
            return m['boostContent.subskills.science.environmentalScience.title']();
        },
        get description() {
            return m['boostContent.subskills.science.environmentalScience.description']();
        },
    },

    // STEM > Technology
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.coding,
        get title() {
            return m['boostContent.subskills.technology.coding.title']();
        },
        get description() {
            return m['boostContent.subskills.technology.coding.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.softwareDevelopment,
        get title() {
            return m['boostContent.subskills.technology.softwareDevelopment.title']();
        },
        get description() {
            return m['boostContent.subskills.technology.softwareDevelopment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.dataAnalysis,
        get title() {
            return m['boostContent.subskills.technology.dataAnalysis.title']();
        },
        get description() {
            return m['boostContent.subskills.technology.dataAnalysis.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.robotics,
        get title() {
            return m['boostContent.subskills.technology.robotics.title']();
        },
        get description() {
            return m['boostContent.subskills.technology.robotics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.cybersecurity,
        get title() {
            return m['boostContent.subskills.technology.cybersecurity.title']();
        },
        get description() {
            return m['boostContent.subskills.technology.cybersecurity.description']();
        },
    },

    // STEM > Engineering
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.mechanicalEngineering,
        get title() {
            return m['boostContent.subskills.engineering.mechanicalEngineering.title']();
        },
        get description() {
            return m['boostContent.subskills.engineering.mechanicalEngineering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.electricalEngineering,
        get title() {
            return m['boostContent.subskills.engineering.electricalEngineering.title']();
        },
        get description() {
            return m['boostContent.subskills.engineering.electricalEngineering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.civilEngineering,
        get title() {
            return m['boostContent.subskills.engineering.civilEngineering.title']();
        },
        get description() {
            return m['boostContent.subskills.engineering.civilEngineering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.chemicalEngineering,
        get title() {
            return m['boostContent.subskills.engineering.chemicalEngineering.title']();
        },
        get description() {
            return m['boostContent.subskills.engineering.chemicalEngineering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.computerEngineering,
        get title() {
            return m['boostContent.subskills.engineering.computerEngineering.title']();
        },
        get description() {
            return m['boostContent.subskills.engineering.computerEngineering.description']();
        },
    },

    // STEM > Research
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.hypothesisDevelopment,
        get title() {
            return m['boostContent.subskills.research.hypothesisDevelopment.title']();
        },
        get description() {
            return m['boostContent.subskills.research.hypothesisDevelopment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.experimentalDesign,
        get title() {
            return m['boostContent.subskills.research.experimentalDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.research.experimentalDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.dataCollection,
        get title() {
            return m['boostContent.subskills.research.dataCollection.title']();
        },
        get description() {
            return m['boostContent.subskills.research.dataCollection.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.analysis,
        get title() {
            return m['boostContent.subskills.research.analysis.title']();
        },
        get description() {
            return m['boostContent.subskills.research.analysis.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.presentation,
        get title() {
            return m['boostContent.subskills.research.presentation.title']();
        },
        get description() {
            return m['boostContent.subskills.research.presentation.description']();
        },
    },

    // Athletic > Sport Specific Skills
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.ballHandling,
        get title() {
            return m['boostContent.subskills.sportSpecificSkills.ballHandling.title']();
        },
        get description() {
            return m['boostContent.subskills.sportSpecificSkills.ballHandling.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.runningTechnique,
        get title() {
            return m['boostContent.subskills.sportSpecificSkills.runningTechnique.title']();
        },
        get description() {
            return m['boostContent.subskills.sportSpecificSkills.runningTechnique.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.swingMechanics,
        get title() {
            return m['boostContent.subskills.sportSpecificSkills.swingMechanics.title']();
        },
        get description() {
            return m['boostContent.subskills.sportSpecificSkills.swingMechanics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.tackling,
        get title() {
            return m['boostContent.subskills.sportSpecificSkills.tackling.title']();
        },
        get description() {
            return m['boostContent.subskills.sportSpecificSkills.tackling.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.swimmingStrokes,
        get title() {
            return m['boostContent.subskills.sportSpecificSkills.swimmingStrokes.title']();
        },
        get description() {
            return m['boostContent.subskills.sportSpecificSkills.swimmingStrokes.description']();
        },
    },

    // Athletic > Strength and Conditioning
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.weightLifting,
        get title() {
            return m['boostContent.subskills.strengthAndConditioning.weightLifting.title']();
        },
        get description() {
            return m['boostContent.subskills.strengthAndConditioning.weightLifting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.speedTraining,
        get title() {
            return m['boostContent.subskills.strengthAndConditioning.speedTraining.title']();
        },
        get description() {
            return m['boostContent.subskills.strengthAndConditioning.speedTraining.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.agility,
        get title() {
            return m['boostContent.subskills.strengthAndConditioning.agility.title']();
        },
        get description() {
            return m['boostContent.subskills.strengthAndConditioning.agility.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.lexibility,
        get title() {
            return m['boostContent.subskills.strengthAndConditioning.lexibility.title']();
        },
        get description() {
            return m['boostContent.subskills.strengthAndConditioning.lexibility.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.injuryPrevention,
        get title() {
            return m['boostContent.subskills.strengthAndConditioning.injuryPrevention.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.strengthAndConditioning.injuryPrevention.description'
            ]();
        },
    },

    // Athletic > Coordination
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.handEyeCoordination,
        get title() {
            return m['boostContent.subskills.coordination.handEyeCoordination.title']();
        },
        get description() {
            return m['boostContent.subskills.coordination.handEyeCoordination.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.footwork,
        get title() {
            return m['boostContent.subskills.coordination.footwork.title']();
        },
        get description() {
            return m['boostContent.subskills.coordination.footwork.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.balance,
        get title() {
            return m['boostContent.subskills.coordination.balance.title']();
        },
        get description() {
            return m['boostContent.subskills.coordination.balance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.reactionTime,
        get title() {
            return m['boostContent.subskills.coordination.reactionTime.title']();
        },
        get description() {
            return m['boostContent.subskills.coordination.reactionTime.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.spatialAwareness,
        get title() {
            return m['boostContent.subskills.coordination.spatialAwareness.title']();
        },
        get description() {
            return m['boostContent.subskills.coordination.spatialAwareness.description']();
        },
    },

    // Athletic > Mental Focus
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.visualization,
        get title() {
            return m['boostContent.subskills.mentalFocus.visualization.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalFocus.visualization.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.goalSetting,
        get title() {
            return m['boostContent.subskills.mentalFocus.goalSetting.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalFocus.goalSetting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.competitiveness,
        get title() {
            return m['boostContent.subskills.mentalFocus.competitiveness.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalFocus.competitiveness.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.resilience,
        get title() {
            return m['boostContent.subskills.mentalFocus.resilience.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalFocus.resilience.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.handlingPressure,
        get title() {
            return m['boostContent.subskills.mentalFocus.handlingPressure.title']();
        },
        get description() {
            return m['boostContent.subskills.mentalFocus.handlingPressure.description']();
        },
    },

    // Athletic > Teamwork
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.communication,
        get title() {
            return m['boostContent.subskills.teamwork.communication.title']();
        },
        get description() {
            return m['boostContent.subskills.teamwork.communication.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.cooperation,
        get title() {
            return m['boostContent.subskills.teamwork.cooperation.title']();
        },
        get description() {
            return m['boostContent.subskills.teamwork.cooperation.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.roleUnderstanding,
        get title() {
            return m['boostContent.subskills.teamwork.roleUnderstanding.title']();
        },
        get description() {
            return m['boostContent.subskills.teamwork.roleUnderstanding.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.strategy,
        get title() {
            return m['boostContent.subskills.teamwork.strategy.title']();
        },
        get description() {
            return m['boostContent.subskills.teamwork.strategy.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.sportsmanship,
        get title() {
            return m['boostContent.subskills.teamwork.sportsmanship.title']();
        },
        get description() {
            return m['boostContent.subskills.teamwork.sportsmanship.description']();
        },
    },
    // Creative > Visual Arts
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.drawing,
        get title() {
            return m['boostContent.subskills.visualArts.drawing.title']();
        },
        get description() {
            return m['boostContent.subskills.visualArts.drawing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.painting,
        get title() {
            return m['boostContent.subskills.visualArts.painting.title']();
        },
        get description() {
            return m['boostContent.subskills.visualArts.painting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.sculpture,
        get title() {
            return m['boostContent.subskills.visualArts.sculpture.title']();
        },
        get description() {
            return m['boostContent.subskills.visualArts.sculpture.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.graphicDesign,
        get title() {
            return m['boostContent.subskills.visualArts.graphicDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.visualArts.graphicDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.photography,
        get title() {
            return m['boostContent.subskills.visualArts.photography.title']();
        },
        get description() {
            return m['boostContent.subskills.visualArts.photography.description']();
        },
    },

    // Creative > Performing Arts
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.acting,
        get title() {
            return m['boostContent.subskills.performingArts.acting.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.acting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.dance,
        get title() {
            return m['boostContent.subskills.performingArts.dance.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.dance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.singing,
        get title() {
            return m['boostContent.subskills.performingArts.singing.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.singing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.instrumental,
        get title() {
            return m['boostContent.subskills.performingArts.instrumental.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.instrumental.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.theaterProduction,
        get title() {
            return m['boostContent.subskills.performingArts.theaterProduction.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.theaterProduction.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.costumeDesign,
        get title() {
            return m['boostContent.subskills.performingArts.costumeDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.costumeDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.directing,
        get title() {
            return m['boostContent.subskills.performingArts.directing.title']();
        },
        get description() {
            return m['boostContent.subskills.performingArts.directing.description']();
        },
    },

    // Creative > Writing
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.poetry,
        get title() {
            return m['boostContent.subskills.writing.poetry.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.poetry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.fiction,
        get title() {
            return m['boostContent.subskills.writing.fiction.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.fiction.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.nonfiction,
        get title() {
            return m['boostContent.subskills.writing.nonfiction.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.nonfiction.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.scriptWriting,
        get title() {
            return m['boostContent.subskills.writing.scriptWriting.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.scriptWriting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.copyWriting,
        get title() {
            return m['boostContent.subskills.writing.copyWriting.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.copyWriting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.journalism,
        get title() {
            return m['boostContent.subskills.writing.journalism.title']();
        },
        get description() {
            return m['boostContent.subskills.writing.journalism.description']();
        },
    },

    // Creative > Design
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.fashionDesign,
        get title() {
            return m['boostContent.subskills.design.fashionDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.design.fashionDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.interiorDesign,
        get title() {
            return m['boostContent.subskills.design.interiorDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.design.interiorDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.webDesign,
        get title() {
            return m['boostContent.subskills.design.webDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.design.webDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.productDesign,
        get title() {
            return m['boostContent.subskills.design.productDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.design.productDesign.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.gameDesign,
        get title() {
            return m['boostContent.subskills.design.gameDesign.title']();
        },
        get description() {
            return m['boostContent.subskills.design.gameDesign.description']();
        },
    },

    // Creative > Ideation
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.brainstorming,
        get title() {
            return m['boostContent.subskills.ideation.brainstorming.title']();
        },
        get description() {
            return m['boostContent.subskills.ideation.brainstorming.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.conceptDevelopment,
        get title() {
            return m['boostContent.subskills.ideation.conceptDevelopment.title']();
        },
        get description() {
            return m['boostContent.subskills.ideation.conceptDevelopment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.innovation,
        get title() {
            return m['boostContent.subskills.ideation.innovation.title']();
        },
        get description() {
            return m['boostContent.subskills.ideation.innovation.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.outOfTheBoxThinking,
        get title() {
            return m['boostContent.subskills.ideation.outOfTheBoxThinking.title']();
        },
        get description() {
            return m['boostContent.subskills.ideation.outOfTheBoxThinking.description']();
        },
    },

    // Business > Management
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.leadership,
        get title() {
            return m['boostContent.subskills.management.leadership.title']();
        },
        get description() {
            return m['boostContent.subskills.management.leadership.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.strategicPlanning,
        get title() {
            return m['boostContent.subskills.management.strategicPlanning.title']();
        },
        get description() {
            return m['boostContent.subskills.management.strategicPlanning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.teamBuilding,
        get title() {
            return m['boostContent.subskills.management.teamBuilding.title']();
        },
        get description() {
            return m['boostContent.subskills.management.teamBuilding.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.delegation,
        get title() {
            return m['boostContent.subskills.management.delegation.title']();
        },
        get description() {
            return m['boostContent.subskills.management.delegation.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.conflictResolution,
        get title() {
            return m['boostContent.subskills.management.conflictResolution.title']();
        },
        get description() {
            return m['boostContent.subskills.management.conflictResolution.description']();
        },
    },

    // Business > Finance
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.accounting,
        get title() {
            return m['boostContent.subskills.finance.accounting.title']();
        },
        get description() {
            return m['boostContent.subskills.finance.accounting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.budgeting,
        get title() {
            return m['boostContent.subskills.finance.budgeting.title']();
        },
        get description() {
            return m['boostContent.subskills.finance.budgeting.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.financialAnalysis,
        get title() {
            return m['boostContent.subskills.finance.financialAnalysis.title']();
        },
        get description() {
            return m['boostContent.subskills.finance.financialAnalysis.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.investment,
        get title() {
            return m['boostContent.subskills.finance.investment.title']();
        },
        get description() {
            return m['boostContent.subskills.finance.investment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.riskManagement,
        get title() {
            return m['boostContent.subskills.finance.riskManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.finance.riskManagement.description']();
        },
    },

    // Business > Marketing
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.marketResearch,
        get title() {
            return m['boostContent.subskills.marketing.marketResearch.title']();
        },
        get description() {
            return m['boostContent.subskills.marketing.marketResearch.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.branding,
        get title() {
            return m['boostContent.subskills.marketing.branding.title']();
        },
        get description() {
            return m['boostContent.subskills.marketing.branding.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.advertising,
        get title() {
            return m['boostContent.subskills.marketing.advertising.title']();
        },
        get description() {
            return m['boostContent.subskills.marketing.advertising.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.sales,
        get title() {
            return m['boostContent.subskills.marketing.sales.title']();
        },
        get description() {
            return m['boostContent.subskills.marketing.sales.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.customerRelationshipManagement,
        get title() {
            return m['boostContent.subskills.marketing.customerRelationshipManagement.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.marketing.customerRelationshipManagement.description'
            ]();
        },
    },

    // Business > Operations
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.logistics,
        get title() {
            return m['boostContent.subskills.operations.logistics.title']();
        },
        get description() {
            return m['boostContent.subskills.operations.logistics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.supplyChainManagement,
        get title() {
            return m['boostContent.subskills.operations.supplyChainManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.operations.supplyChainManagement.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.processImprovement,
        get title() {
            return m['boostContent.subskills.operations.processImprovement.title']();
        },
        get description() {
            return m['boostContent.subskills.operations.processImprovement.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.projectManagement,
        get title() {
            return m['boostContent.subskills.operations.projectManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.operations.projectManagement.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.qualityControl,
        get title() {
            return m['boostContent.subskills.operations.qualityControl.title']();
        },
        get description() {
            return m['boostContent.subskills.operations.qualityControl.description']();
        },
    },

    // Business > Entrepreneurship
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.opportunityRecognition,
        get title() {
            return m['boostContent.subskills.entrepreneurship.opportunityRecognition.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.entrepreneurship.opportunityRecognition.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.businessPlanning,
        get title() {
            return m['boostContent.subskills.entrepreneurship.businessPlanning.title']();
        },
        get description() {
            return m['boostContent.subskills.entrepreneurship.businessPlanning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.fundraising,
        get title() {
            return m['boostContent.subskills.entrepreneurship.fundraising.title']();
        },
        get description() {
            return m['boostContent.subskills.entrepreneurship.fundraising.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.networking,
        get title() {
            return m['boostContent.subskills.entrepreneurship.networking.title']();
        },
        get description() {
            return m['boostContent.subskills.entrepreneurship.networking.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.decisionMaking,
        get title() {
            return m['boostContent.subskills.entrepreneurship.decisionMaking.title']();
        },
        get description() {
            return m['boostContent.subskills.entrepreneurship.decisionMaking.description']();
        },
    },

    // Trade > Construction
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.carpentry,
        get title() {
            return m['boostContent.subskills.construction.carpentry.title']();
        },
        get description() {
            return m['boostContent.subskills.construction.carpentry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.electricalWork,
        get title() {
            return m['boostContent.subskills.construction.electricalWork.title']();
        },
        get description() {
            return m['boostContent.subskills.construction.electricalWork.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.plumbing,
        get title() {
            return m['boostContent.subskills.construction.plumbing.title']();
        },
        get description() {
            return m['boostContent.subskills.construction.plumbing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.masonry,
        get title() {
            return m['boostContent.subskills.construction.masonry.title']();
        },
        get description() {
            return m['boostContent.subskills.construction.masonry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.HVAC,
        get title() {
            return m['boostContent.subskills.construction.hVAC.title']();
        },
        get description() {
            return m['boostContent.subskills.construction.hVAC.description']();
        },
    },

    // Trade > Mechanics
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.automotiveRepair,
        get title() {
            return m['boostContent.subskills.mechanics.automotiveRepair.title']();
        },
        get description() {
            return m['boostContent.subskills.mechanics.automotiveRepair.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.dieselEngineRepair,
        get title() {
            return m['boostContent.subskills.mechanics.dieselEngineRepair.title']();
        },
        get description() {
            return m['boostContent.subskills.mechanics.dieselEngineRepair.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.smallEngineRepair,
        get title() {
            return m['boostContent.subskills.mechanics.smallEngineRepair.title']();
        },
        get description() {
            return m['boostContent.subskills.mechanics.smallEngineRepair.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.aircraftMaintenance,
        get title() {
            return m['boostContent.subskills.mechanics.aircraftMaintenance.title']();
        },
        get description() {
            return m['boostContent.subskills.mechanics.aircraftMaintenance.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.heavyEquipmentOperation,
        get title() {
            return m['boostContent.subskills.mechanics.heavyEquipmentOperation.title']();
        },
        get description() {
            return m['boostContent.subskills.mechanics.heavyEquipmentOperation.description']();
        },
    },

    // Trade > Manufacturing
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.welding,
        get title() {
            return m['boostContent.subskills.manufacturing.welding.title']();
        },
        get description() {
            return m['boostContent.subskills.manufacturing.welding.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.machining,
        get title() {
            return m['boostContent.subskills.manufacturing.machining.title']();
        },
        get description() {
            return m['boostContent.subskills.manufacturing.machining.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.assembly,
        get title() {
            return m['boostContent.subskills.manufacturing.assembly.title']();
        },
        get description() {
            return m['boostContent.subskills.manufacturing.assembly.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.fabrication,
        get title() {
            return m['boostContent.subskills.manufacturing.fabrication.title']();
        },
        get description() {
            return m['boostContent.subskills.manufacturing.fabrication.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.qualityAssurance,
        get title() {
            return m['boostContent.subskills.manufacturing.qualityAssurance.title']();
        },
        get description() {
            return m['boostContent.subskills.manufacturing.qualityAssurance.description']();
        },
    },

    // Trade > Cosmetology
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.hairstyling,
        get title() {
            return m['boostContent.subskills.cosmetology.hairstyling.title']();
        },
        get description() {
            return m['boostContent.subskills.cosmetology.hairstyling.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.barbering,
        get title() {
            return m['boostContent.subskills.cosmetology.barbering.title']();
        },
        get description() {
            return m['boostContent.subskills.cosmetology.barbering.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.nailTechnology,
        get title() {
            return m['boostContent.subskills.cosmetology.nailTechnology.title']();
        },
        get description() {
            return m['boostContent.subskills.cosmetology.nailTechnology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.makeupArtistry,
        get title() {
            return m['boostContent.subskills.cosmetology.makeupArtistry.title']();
        },
        get description() {
            return m['boostContent.subskills.cosmetology.makeupArtistry.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.esthetics,
        get title() {
            return m['boostContent.subskills.cosmetology.esthetics.title']();
        },
        get description() {
            return m['boostContent.subskills.cosmetology.esthetics.description']();
        },
    },
    // Social > History
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.researchMethods,
        get title() {
            return m['boostContent.subskills.history.researchMethods.title']();
        },
        get description() {
            return m['boostContent.subskills.history.researchMethods.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.analysisOfPrimarySources,
        get title() {
            return m['boostContent.subskills.history.analysisOfPrimarySources.title']();
        },
        get description() {
            return m['boostContent.subskills.history.analysisOfPrimarySources.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.chronologicalReasoning,
        get title() {
            return m['boostContent.subskills.history.chronologicalReasoning.title']();
        },
        get description() {
            return m['boostContent.subskills.history.chronologicalReasoning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.comparativeHistory,
        get title() {
            return m['boostContent.subskills.history.comparativeHistory.title']();
        },
        get description() {
            return m['boostContent.subskills.history.comparativeHistory.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.historiography,
        get title() {
            return m['boostContent.subskills.history.historiography.title']();
        },
        get description() {
            return m['boostContent.subskills.history.historiography.description']();
        },
    },

    // Social > Psychology
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.cognitivePsychology,
        get title() {
            return m['boostContent.subskills.psychology.cognitivePsychology.title']();
        },
        get description() {
            return m['boostContent.subskills.psychology.cognitivePsychology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.developmentalPsychology,
        get title() {
            return m['boostContent.subskills.psychology.developmentalPsychology.title']();
        },
        get description() {
            return m['boostContent.subskills.psychology.developmentalPsychology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.socialPsychology,
        get title() {
            return m['boostContent.subskills.psychology.socialPsychology.title']();
        },
        get description() {
            return m['boostContent.subskills.psychology.socialPsychology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.experimentalMethods,
        get title() {
            return m['boostContent.subskills.psychology.experimentalMethods.title']();
        },
        get description() {
            return m['boostContent.subskills.psychology.experimentalMethods.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.clinicalPsychology,
        get title() {
            return m['boostContent.subskills.psychology.clinicalPsychology.title']();
        },
        get description() {
            return m['boostContent.subskills.psychology.clinicalPsychology.description']();
        },
    },

    // Social > Sociology
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialInequality,
        get title() {
            return m['boostContent.subskills.sociology.socialInequality.title']();
        },
        get description() {
            return m['boostContent.subskills.sociology.socialInequality.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialInstitutions,
        get title() {
            return m['boostContent.subskills.sociology.socialInstitutions.title']();
        },
        get description() {
            return m['boostContent.subskills.sociology.socialInstitutions.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialChange,
        get title() {
            return m['boostContent.subskills.sociology.socialChange.title']();
        },
        get description() {
            return m['boostContent.subskills.sociology.socialChange.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialMovements,
        get title() {
            return m['boostContent.subskills.sociology.socialMovements.title']();
        },
        get description() {
            return m['boostContent.subskills.sociology.socialMovements.description']();
        },
    },

    // Social > Economics
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.microeconomics,
        get title() {
            return m['boostContent.subskills.economics.microeconomics.title']();
        },
        get description() {
            return m['boostContent.subskills.economics.microeconomics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.macroeconomics,
        get title() {
            return m['boostContent.subskills.economics.macroeconomics.title']();
        },
        get description() {
            return m['boostContent.subskills.economics.macroeconomics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.econometrics,
        get title() {
            return m['boostContent.subskills.economics.econometrics.title']();
        },
        get description() {
            return m['boostContent.subskills.economics.econometrics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.economicPolicy,
        get title() {
            return m['boostContent.subskills.economics.economicPolicy.title']();
        },
        get description() {
            return m['boostContent.subskills.economics.economicPolicy.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.internationalEconomics,
        get title() {
            return m['boostContent.subskills.economics.internationalEconomics.title']();
        },
        get description() {
            return m['boostContent.subskills.economics.internationalEconomics.description']();
        },
    },

    // Social > Political Science
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.governmentSystems,
        get title() {
            return m['boostContent.subskills.politicalScience.governmentSystems.title']();
        },
        get description() {
            return m['boostContent.subskills.politicalScience.governmentSystems.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.politicalTheory,
        get title() {
            return m['boostContent.subskills.politicalScience.politicalTheory.title']();
        },
        get description() {
            return m['boostContent.subskills.politicalScience.politicalTheory.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.internationalRelations,
        get title() {
            return m['boostContent.subskills.politicalScience.internationalRelations.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.politicalScience.internationalRelations.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.comparativePolitics,
        get title() {
            return m['boostContent.subskills.politicalScience.comparativePolitics.title']();
        },
        get description() {
            return m['boostContent.subskills.politicalScience.comparativePolitics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.publicPolicy,
        get title() {
            return m['boostContent.subskills.politicalScience.publicPolicy.title']();
        },
        get description() {
            return m['boostContent.subskills.politicalScience.publicPolicy.description']();
        },
    },

    // Digital > Basic Computer Skills
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.typing,
        get title() {
            return m['boostContent.subskills.basicComputerSkills.typing.title']();
        },
        get description() {
            return m['boostContent.subskills.basicComputerSkills.typing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.fileManagement,
        get title() {
            return m['boostContent.subskills.basicComputerSkills.fileManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.basicComputerSkills.fileManagement.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.internetNavigation,
        get title() {
            return m['boostContent.subskills.basicComputerSkills.internetNavigation.title']();
        },
        get description() {
            return m['boostContent.subskills.basicComputerSkills.internetNavigation.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.email,
        get title() {
            return m['boostContent.subskills.basicComputerSkills.email.title']();
        },
        get description() {
            return m['boostContent.subskills.basicComputerSkills.email.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.wordProcessing,
        get title() {
            return m['boostContent.subskills.basicComputerSkills.wordProcessing.title']();
        },
        get description() {
            return m['boostContent.subskills.basicComputerSkills.wordProcessing.description']();
        },
    },

    // Digital > Information Literacy
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.searchEngineProficiency,
        get title() {
            return m['boostContent.subskills.informationLiteracy.searchEngineProficiency.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.informationLiteracy.searchEngineProficiency.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.evaluatingSources,
        get title() {
            return m['boostContent.subskills.informationLiteracy.evaluatingSources.title']();
        },
        get description() {
            return m['boostContent.subskills.informationLiteracy.evaluatingSources.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.factChecking,
        get title() {
            return m['boostContent.subskills.informationLiteracy.factChecking.title']();
        },
        get description() {
            return m['boostContent.subskills.informationLiteracy.factChecking.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.criticalMediaAnalysis,
        get title() {
            return m['boostContent.subskills.informationLiteracy.criticalMediaAnalysis.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.informationLiteracy.criticalMediaAnalysis.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.understandingBias,
        get title() {
            return m['boostContent.subskills.informationLiteracy.understandingBias.title']();
        },
        get description() {
            return m['boostContent.subskills.informationLiteracy.understandingBias.description']();
        },
    },

    // Digital > Software Proficiency
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.productivitySuites,
        get title() {
            return m['boostContent.subskills.softwareProficiency.productivitySuites.title']();
        },
        get description() {
            return m['boostContent.subskills.softwareProficiency.productivitySuites.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.specializedSoftware,
        get title() {
            return m['boostContent.subskills.softwareProficiency.specializedSoftware.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.softwareProficiency.specializedSoftware.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.designSoftware,
        get title() {
            return m['boostContent.subskills.softwareProficiency.designSoftware.title']();
        },
        get description() {
            return m['boostContent.subskills.softwareProficiency.designSoftware.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.programmingBasics,
        get title() {
            return m['boostContent.subskills.softwareProficiency.programmingBasics.title']();
        },
        get description() {
            return m['boostContent.subskills.softwareProficiency.programmingBasics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.dataVisualizationTools,
        get title() {
            return m['boostContent.subskills.softwareProficiency.dataVisualizationTools.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.softwareProficiency.dataVisualizationTools.description'
            ]();
        },
    },

    // Digital > Online Communication
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.netiquette,
        get title() {
            return m['boostContent.subskills.onlineCommunication.netiquette.title']();
        },
        get description() {
            return m['boostContent.subskills.onlineCommunication.netiquette.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.effectiveEmailAndMessaging,
        get title() {
            return m[
                'boostContent.subskills.onlineCommunication.effectiveEmailAndMessaging.title'
            ]();
        },
        get description() {
            return m[
                'boostContent.subskills.onlineCommunication.effectiveEmailAndMessaging.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.socialMediaPlatforms,
        get title() {
            return m['boostContent.subskills.onlineCommunication.socialMediaPlatforms.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.onlineCommunication.socialMediaPlatforms.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.videoConferencing,
        get title() {
            return m['boostContent.subskills.onlineCommunication.videoConferencing.title']();
        },
        get description() {
            return m['boostContent.subskills.onlineCommunication.videoConferencing.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.collaborationTools,
        get title() {
            return m['boostContent.subskills.onlineCommunication.collaborationTools.title']();
        },
        get description() {
            return m['boostContent.subskills.onlineCommunication.collaborationTools.description']();
        },
    },

    // Digital > Cyber Security
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.passwordManagement,
        get title() {
            return m['boostContent.subskills.cybersecurity.passwordManagement.title']();
        },
        get description() {
            return m['boostContent.subskills.cybersecurity.passwordManagement.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.phishingAwareness,
        get title() {
            return m['boostContent.subskills.cybersecurity.phishingAwareness.title']();
        },
        get description() {
            return m['boostContent.subskills.cybersecurity.phishingAwareness.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.dataPrivacy,
        get title() {
            return m['boostContent.subskills.cybersecurity.dataPrivacy.title']();
        },
        get description() {
            return m['boostContent.subskills.cybersecurity.dataPrivacy.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.safeOnlinePractices,
        get title() {
            return m['boostContent.subskills.cybersecurity.safeOnlinePractices.title']();
        },
        get description() {
            return m['boostContent.subskills.cybersecurity.safeOnlinePractices.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.protectingDevices,
        get title() {
            return m['boostContent.subskills.cybersecurity.protectingDevices.title']();
        },
        get description() {
            return m['boostContent.subskills.cybersecurity.protectingDevices.description']();
        },
    },

    // Medical > Clinical Skills
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.patientAssessment,
        get title() {
            return m['boostContent.subskills.clinicalSkills.patientAssessment.title']();
        },
        get description() {
            return m['boostContent.subskills.clinicalSkills.patientAssessment.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.diagnosticProcedures,
        get title() {
            return m['boostContent.subskills.clinicalSkills.diagnosticProcedures.title']();
        },
        get description() {
            return m['boostContent.subskills.clinicalSkills.diagnosticProcedures.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.medicationAdministration,
        get title() {
            return m['boostContent.subskills.clinicalSkills.medicationAdministration.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.clinicalSkills.medicationAdministration.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.woundCare,
        get title() {
            return m['boostContent.subskills.clinicalSkills.woundCare.title']();
        },
        get description() {
            return m['boostContent.subskills.clinicalSkills.woundCare.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.basicLifeSupport,
        get title() {
            return m['boostContent.subskills.clinicalSkills.basicLifeSupport.title']();
        },
        get description() {
            return m['boostContent.subskills.clinicalSkills.basicLifeSupport.description']();
        },
    },

    // Medical > Anatomy and Physiology
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.bodySystems,
        get title() {
            return m['boostContent.subskills.anatomyAndPhysiology.bodySystems.title']();
        },
        get description() {
            return m['boostContent.subskills.anatomyAndPhysiology.bodySystems.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.medicalTerminology,
        get title() {
            return m['boostContent.subskills.anatomyAndPhysiology.medicalTerminology.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.anatomyAndPhysiology.medicalTerminology.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.diseaseProcesses,
        get title() {
            return m['boostContent.subskills.anatomyAndPhysiology.diseaseProcesses.title']();
        },
        get description() {
            return m['boostContent.subskills.anatomyAndPhysiology.diseaseProcesses.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.pharmacology,
        get title() {
            return m['boostContent.subskills.anatomyAndPhysiology.pharmacology.title']();
        },
        get description() {
            return m['boostContent.subskills.anatomyAndPhysiology.pharmacology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.pathophysiology,
        get title() {
            return m['boostContent.subskills.anatomyAndPhysiology.pathophysiology.title']();
        },
        get description() {
            return m['boostContent.subskills.anatomyAndPhysiology.pathophysiology.description']();
        },
    },

    // Medical > Patient Care
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.bedsideManner,
        get title() {
            return m['boostContent.subskills.patientCare.bedsideManner.title']();
        },
        get description() {
            return m['boostContent.subskills.patientCare.bedsideManner.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.empathy,
        get title() {
            return m['boostContent.subskills.patientCare.empathy.title']();
        },
        get description() {
            return m['boostContent.subskills.patientCare.empathy.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.culturalSensitivity,
        get title() {
            return m['boostContent.subskills.patientCare.culturalSensitivity.title']();
        },
        get description() {
            return m['boostContent.subskills.patientCare.culturalSensitivity.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.ethics,
        get title() {
            return m['boostContent.subskills.patientCare.ethics.title']();
        },
        get description() {
            return m['boostContent.subskills.patientCare.ethics.description']();
        },
    },

    // Medical > Medical Specialties
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.surgery,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.surgery.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.surgery.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.emergencyMedicine,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.emergencyMedicine.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.emergencyMedicine.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.pediatrics,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.pediatrics.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.pediatrics.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.radiology,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.radiology.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.radiology.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.diagnosticReasoning,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.diagnosticReasoning.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.diagnosticReasoning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.treatmentPlanning,
        get title() {
            return m['boostContent.subskills.medicalSpecialties.treatmentPlanning.title']();
        },
        get description() {
            return m['boostContent.subskills.medicalSpecialties.treatmentPlanning.description']();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.interdisciplinaryCollaboration,
        get title() {
            return m[
                'boostContent.subskills.medicalSpecialties.interdisciplinaryCollaboration.title'
            ]();
        },
        get description() {
            return m[
                'boostContent.subskills.medicalSpecialties.interdisciplinaryCollaboration.description'
            ]();
        },
    },

    // Medical > Healthcare Administration
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.insuranceAndBilling,
        get title() {
            return m['boostContent.subskills.healthcareAdministration.insuranceAndBilling.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.healthcareAdministration.insuranceAndBilling.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.medicalRecords,
        get title() {
            return m['boostContent.subskills.healthcareAdministration.medicalRecords.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.healthcareAdministration.medicalRecords.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.patientScheduling,
        get title() {
            return m['boostContent.subskills.healthcareAdministration.patientScheduling.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.healthcareAdministration.patientScheduling.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.regulatoryCompliance,
        get title() {
            return m[
                'boostContent.subskills.healthcareAdministration.regulatoryCompliance.title'
            ]();
        },
        get description() {
            return m[
                'boostContent.subskills.healthcareAdministration.regulatoryCompliance.description'
            ]();
        },
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.facilityManagement,
        get title() {
            return m['boostContent.subskills.healthcareAdministration.facilityManagement.title']();
        },
        get description() {
            return m[
                'boostContent.subskills.healthcareAdministration.facilityManagement.description'
            ]();
        },
    },
];
