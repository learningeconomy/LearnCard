import Athletics from '../assets/images/athletics.png';
import Business from '../assets/images/business.png';
import Creative from '../assets/images/creative.png';
import Digital from '../assets/images/digital.png';
import Durable from '../assets/images/durable.png';
import Medical from '../assets/images/medical.png';
import Social from '../assets/images/social.png';
import Stem from '../assets/images/stem.png';
import Trade from '../assets/images/trade.png';

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

// ! MUST ALIGN WITH -> learncardapp/src/components/boost/BoostCMS/boostCMSForms/boostCMSSkills/boostSkills.ts
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
        title: 'Durable',
        IconComponent: Durable,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Durable,
    },
    {
        id: 2,
        title: 'Stem',
        IconComponent: Stem,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Stem,
    },
    {
        id: 3,
        title: 'Athletic',
        IconComponent: Athletics,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Athletic,
    },
    {
        id: 4,
        title: 'Creative',
        IconComponent: Creative,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Creative,
    },
    {
        id: 5,
        title: 'Business',
        IconComponent: Business,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Business,
    },
    {
        id: 6,
        title: 'Trade',
        IconComponent: Trade,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Trade,
    },
    {
        id: 7,
        title: 'Social',
        IconComponent: Social,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Social,
    },
    {
        id: 8,
        title: 'Digital',
        IconComponent: Digital,
        iconClassName: 'text-white',
        iconCircleClass: 'bg-cyan-700',
        type: BoostCMSSKillsCategoryEnum.Digital,
    },
    {
        id: 9,
        title: 'Medical',
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

export const CATEGORY_TO_SKILLS: Record<
    BoostCMSSKillsCategoryEnum | string,
    {
        id: number;
        title: string;
        IconComponent: React.ReactNode | string;
        iconClassName: string;
        iconCircleClass: string;
        category: BoostCMSSKillsCategoryEnum | string;
        type: BoostCMSCategorySkillEnum | string;
    }[]
> = {
    [BoostCMSSKillsCategoryEnum.Durable]: [
        {
            id: 1,
            title: 'Adaptability',
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.Adaptability,
        },
        {
            id: 2,
            title: 'Perseverance',
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.Perseverance,
        },
        {
            id: 3,
            title: 'Mental Toughness',
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.MentalToughness,
        },
        {
            id: 4,
            title: 'Physical Endurance',
            IconComponent: Durable,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Durable,
            type: BoostCMSCategorySkillEnum.PhysicalEndurance,
        },
        {
            id: 5,
            title: 'Lifelong Learning',
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
            title: 'Mathematics',
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Mathematics,
        },
        {
            id: 2,
            title: 'Science',
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Science,
        },
        {
            id: 3,
            title: 'Technology',
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Technology,
        },
        {
            id: 4,
            title: 'Engineering',
            IconComponent: Stem,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Stem,
            type: BoostCMSCategorySkillEnum.Engineering,
        },
        {
            id: 5,
            title: 'Research',
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
            title: 'Sport specific skills',
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.SportSpecificSkills,
        },
        {
            id: 2,
            title: 'Strength and Conditioning',
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        },
        {
            id: 3,
            title: 'Coordination',
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.Coordination,
        },
        {
            id: 4,
            title: 'Mental Focus',
            IconComponent: Athletics,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Athletic,
            type: BoostCMSCategorySkillEnum.MentalFocus,
        },
        {
            id: 5,
            title: 'Team work',
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
            title: 'Visual Arts',
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.VisualArts,
        },
        {
            id: 2,
            title: 'Performing Arts',
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.PerformingArts,
        },
        {
            id: 3,
            title: 'Writing',
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.Writing,
        },
        {
            id: 4,
            title: 'Design',
            IconComponent: Creative,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Creative,
            type: BoostCMSCategorySkillEnum.Design,
        },
        {
            id: 5,
            title: 'Ideation',
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
            title: 'Management',
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Management,
        },
        {
            id: 2,
            title: 'Finance',
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Finance,
        },
        {
            id: 3,
            title: 'Marketing',
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Marketing,
        },
        {
            id: 4,
            title: 'Operations',
            IconComponent: Business,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Business,
            type: BoostCMSCategorySkillEnum.Operations,
        },
        {
            id: 5,
            title: 'Entrepreneurship',
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
            title: 'Construction',
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Construction,
        },
        {
            id: 2,
            title: 'Mechanics',
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Mechanics,
        },
        {
            id: 3,
            title: 'Manufacturing',
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Manufacturing,
        },
        {
            id: 4,
            title: 'Cosmetology',
            IconComponent: Trade,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Trade,
            type: BoostCMSCategorySkillEnum.Cosmetology,
        },
        {
            id: 5,
            title: 'Culinary Arts',
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
            title: 'History',
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.History,
        },
        {
            id: 2,
            title: 'Psychology',
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Psychology,
        },
        {
            id: 3,
            title: 'Sociology',
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Sociology,
        },
        {
            id: 4,
            title: 'Economics',
            IconComponent: Social,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Social,
            type: BoostCMSCategorySkillEnum.Economics,
        },
        {
            id: 5,
            title: 'Political Science',
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
            title: 'Basic Computer Skills',
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.BasicComputerSkills,
        },
        {
            id: 2,
            title: 'Information Literacy',
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.InformationLiteracy,
        },
        {
            id: 3,
            title: 'Software Proficiency',
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.SoftwareProficiency,
        },
        {
            id: 4,
            title: 'Online Communication',
            IconComponent: Digital,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Digital,
            type: BoostCMSCategorySkillEnum.OnlineCommunication,
        },
        {
            id: 5,
            title: 'Cybersecurity',
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
            title: 'Clinical Skills',
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.ClinicalSkills,
        },
        {
            id: 2,
            title: 'Anatomy and Physiology',
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        },
        {
            id: 3,
            title: 'Patient Care',
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.PatientCare,
        },
        {
            id: 4,
            title: 'Medical Specialties',
            IconComponent: Medical,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-700',
            category: BoostCMSSKillsCategoryEnum.Medical,
            type: BoostCMSCategorySkillEnum.MedicalSpecialties,
        },
        {
            id: 5,
            title: 'Healthcare Administration',
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
    // flexibility = 'flexibility', // ! duplicate
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

export const SKILLS_TO_SUBSKILLS: Record<
    BoostCMSCategorySkillEnum | string,
    {
        id: number;
        title: string;
        type: BoostCMSCategorySkillEnum | string;
    }[]
> = {
    // Durable
    [BoostCMSCategorySkillEnum.Adaptability]: [
        {
            id: 1,
            title: 'Flexibility',
            type: BoostCMSSubSkillEnum.flexibility,
        },
        {
            id: 2,
            title: 'Resilience',
            type: BoostCMSSubSkillEnum.resilience,
        },
        {
            id: 3,
            title: 'Problem Solving',
            type: BoostCMSSubSkillEnum.problemSolving,
        },
        {
            id: 4,
            title: 'Resourcefulness',
            type: BoostCMSSubSkillEnum.resourcefulness,
        },
        {
            id: 5,
            title: 'Stress management',
            type: BoostCMSSubSkillEnum.stressManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Perseverance]: [
        {
            id: 1,
            title: 'Discipline',
            type: BoostCMSSubSkillEnum.discipline,
        },
        {
            id: 2,
            title: 'focus',
            type: BoostCMSSubSkillEnum.focus,
        },
        {
            id: 3,
            title: 'Commitment',
            type: BoostCMSSubSkillEnum.commitment,
        },
        {
            id: 4,
            title: 'Grit',
            type: BoostCMSSubSkillEnum.grit,
        },
        {
            id: 5,
            title: 'Tenacity',
            type: BoostCMSSubSkillEnum.tenacity,
        },
    ],
    [BoostCMSCategorySkillEnum.MentalToughness]: [
        {
            id: 1,
            title: 'optimism',
            type: BoostCMSSubSkillEnum.optimism,
        },
        {
            id: 2,
            title: 'Self Confidence',
            type: BoostCMSSubSkillEnum.selfConfidence,
        },
        {
            id: 3,
            title: 'Emotional Regulation',
            type: BoostCMSSubSkillEnum.emotionalRegulation,
        },
        {
            id: 4,
            title: 'Growth Mindset',
            type: BoostCMSSubSkillEnum.growthMindset,
        },
        {
            id: 5,
            title: 'Positive Self-Talk',
            type: BoostCMSSubSkillEnum.positiveSelfTalk,
        },
    ],
    [BoostCMSCategorySkillEnum.PhysicalEndurance]: [
        {
            id: 1,
            title: 'Strength',
            type: BoostCMSSubSkillEnum.strength,
        },
        {
            id: 2,
            title: 'Stamina',
            type: BoostCMSSubSkillEnum.stamina,
        },
        {
            id: 3,
            title: 'Cardiovascular Fitness',
            type: BoostCMSSubSkillEnum.cardiovascularFitness,
        },
        {
            id: 4,
            title: 'Pain Tolerance',
            type: BoostCMSSubSkillEnum.painTolerance,
        },
        {
            id: 5,
            title: 'Injury Prevention',
            type: BoostCMSSubSkillEnum.injuryPrevention,
        },
    ],
    [BoostCMSCategorySkillEnum.LifelongLearning]: [
        {
            id: 1,
            title: 'Curiosity',
            type: BoostCMSSubSkillEnum.curiosity,
        },
        {
            id: 2,
            title: 'Open Mindedness',
            type: BoostCMSSubSkillEnum.openMindedness,
        },
        {
            id: 3,
            title: 'Critical Thinking',
            type: BoostCMSSubSkillEnum.criticalThinking,
        },
        {
            id: 4,
            title: 'Self-directed Learning',
            type: BoostCMSSubSkillEnum.selfDirectedLearning,
        },
        {
            id: 5,
            title: 'Knowledge Retention',
            type: BoostCMSSubSkillEnum.knowledgeRetention,
        },
    ],

    // STEM
    [BoostCMSCategorySkillEnum.Mathematics]: [
        {
            id: 1,
            title: 'Algebra',
            type: BoostCMSSubSkillEnum.algebra,
        },
        {
            id: 2,
            title: 'Geometry',
            type: BoostCMSSubSkillEnum.geometry,
        },
        {
            id: 3,
            title: 'Trigonometry',
            type: BoostCMSSubSkillEnum.trigonometry,
        },
        {
            id: 4,
            title: 'Calculus',
            type: BoostCMSSubSkillEnum.calculus,
        },
        {
            id: 5,
            title: 'Statistics',
            type: BoostCMSSubSkillEnum.statistics,
        },
    ],
    [BoostCMSCategorySkillEnum.Science]: [
        {
            id: 1,
            title: 'Physics',
            type: BoostCMSSubSkillEnum.physics,
        },
        {
            id: 2,
            title: 'Chemistry',
            type: BoostCMSSubSkillEnum.chemistry,
        },
        {
            id: 3,
            title: 'Biology',
            type: BoostCMSSubSkillEnum.biology,
        },
        {
            id: 4,
            title: 'Earth science',
            type: BoostCMSSubSkillEnum.earthScience,
        },
        {
            id: 5,
            title: 'Environmental science',
            type: BoostCMSSubSkillEnum.environmentalScience,
        },
    ],
    [BoostCMSCategorySkillEnum.Technology]: [
        {
            id: 1,
            title: 'Coding',
            type: BoostCMSSubSkillEnum.coding,
        },
        {
            id: 2,
            title: 'Software Development',
            type: BoostCMSSubSkillEnum.softwareDevelopment,
        },
        {
            id: 3,
            title: 'Data Analysis',
            type: BoostCMSSubSkillEnum.dataAnalysis,
        },
        {
            id: 4,
            title: 'Robotics',
            type: BoostCMSSubSkillEnum.robotics,
        },
        {
            id: 5,
            title: 'Cybersecurity',
            type: BoostCMSSubSkillEnum.cybersecurity,
        },
    ],
    [BoostCMSCategorySkillEnum.Engineering]: [
        {
            id: 1,
            title: 'Mechanical Engineering',
            type: BoostCMSSubSkillEnum.mechanicalEngineering,
        },
        {
            id: 2,
            title: 'Electrical Engineering',
            type: BoostCMSSubSkillEnum.electricalEngineering,
        },
        {
            id: 3,
            title: 'Civil Engineering',
            type: BoostCMSSubSkillEnum.civilEngineering,
        },
        {
            id: 4,
            title: 'Chemical Engineering',
            type: BoostCMSSubSkillEnum.chemicalEngineering,
        },
        {
            id: 5,
            title: 'Computer Engineering',
            type: BoostCMSSubSkillEnum.computerEngineering,
        },
    ],
    [BoostCMSCategorySkillEnum.Research]: [
        {
            id: 1,
            title: 'Hypothesis Development',
            type: BoostCMSSubSkillEnum.hypothesisDevelopment,
        },
        {
            id: 2,
            title: 'Experimental Design',
            type: BoostCMSSubSkillEnum.experimentalDesign,
        },
        {
            id: 3,
            title: 'Data Collection',
            type: BoostCMSSubSkillEnum.dataCollection,
        },
        {
            id: 4,
            title: 'Analysis',
            type: BoostCMSSubSkillEnum.analysis,
        },
        {
            id: 5,
            title: 'presentation',
            type: BoostCMSSubSkillEnum.presentation,
        },
    ],

    // athletic
    [BoostCMSCategorySkillEnum.SportSpecificSkills]: [
        {
            id: 1,
            title: 'Ball Handling',
            type: BoostCMSSubSkillEnum.ballHandling,
        },
        {
            id: 2,
            title: 'Running Technique',
            type: BoostCMSSubSkillEnum.runningTechnique,
        },
        {
            id: 3,
            title: 'Swing Mechanics',
            type: BoostCMSSubSkillEnum.swingMechanics,
        },
        {
            id: 4,
            title: 'Tackling',
            type: BoostCMSSubSkillEnum.tackling,
        },
        {
            id: 5,
            title: 'Swimming Strokes',
            type: BoostCMSSubSkillEnum.swimmingStrokes,
        },
    ],
    [BoostCMSCategorySkillEnum.StrengthAndConditioning]: [
        {
            id: 1,
            title: 'Weight Lifting',
            type: BoostCMSSubSkillEnum.weightLifting,
        },
        {
            id: 2,
            title: 'Speed Training',
            type: BoostCMSSubSkillEnum.speedTraining,
        },
        {
            id: 3,
            title: 'Agility',
            type: BoostCMSSubSkillEnum.agility,
        },
        {
            id: 4,
            title: 'Flexibility',
            type: BoostCMSSubSkillEnum.flexibility,
        },
        {
            id: 5,
            title: 'Injury Prevention',
            type: BoostCMSSubSkillEnum.injuryPrevention,
        },
    ],
    [BoostCMSCategorySkillEnum.Coordination]: [
        {
            id: 1,
            title: 'Hand Eye Coordination',
            type: BoostCMSSubSkillEnum.handEyeCoordination,
        },
        {
            id: 2,
            title: 'Footwork',
            type: BoostCMSSubSkillEnum.footwork,
        },
        {
            id: 3,
            title: 'Balance',
            type: BoostCMSSubSkillEnum.balance,
        },
        {
            id: 4,
            title: 'Reaction Time',
            type: BoostCMSSubSkillEnum.reactionTime,
        },
        {
            id: 5,
            title: 'Spatial Awareness',
            type: BoostCMSSubSkillEnum.spatialAwareness,
        },
    ],
    [BoostCMSCategorySkillEnum.MentalFocus]: [
        {
            id: 1,
            title: 'Visualization',
            type: BoostCMSSubSkillEnum.visualization,
        },
        {
            id: 2,
            title: 'Goal Setting',
            type: BoostCMSSubSkillEnum.goalSetting,
        },
        {
            id: 3,
            title: 'Competitiveness',
            type: BoostCMSSubSkillEnum.competitiveness,
        },
        {
            id: 4,
            title: 'Resilience',
            type: BoostCMSSubSkillEnum.resilience,
        },
        {
            id: 5,
            title: 'Handling pressure',
            type: BoostCMSSubSkillEnum.handlingPressure,
        },
    ],
    [BoostCMSCategorySkillEnum.Teamwork]: [
        {
            id: 1,
            title: 'Communication',
            type: BoostCMSSubSkillEnum.communication,
        },
        {
            id: 2,
            title: 'Cooperation',
            type: BoostCMSSubSkillEnum.cooperation,
        },
        {
            id: 3,
            title: 'Role Understanding',
            type: BoostCMSSubSkillEnum.roleUnderstanding,
        },
        {
            id: 4,
            title: 'Strategy',
            type: BoostCMSSubSkillEnum.strategy,
        },
        {
            id: 5,
            title: 'Sportsmanship',
            type: BoostCMSSubSkillEnum.sportsmanship,
        },
    ],

    // creative
    [BoostCMSCategorySkillEnum.VisualArts]: [
        {
            id: 1,
            title: 'Drawing',
            type: BoostCMSSubSkillEnum.drawing,
        },
        {
            id: 2,
            title: 'Painting',
            type: BoostCMSSubSkillEnum.painting,
        },
        {
            id: 3,
            title: 'Sculpture',
            type: BoostCMSSubSkillEnum.sculpture,
        },
        {
            id: 4,
            title: 'Graphic design',
            type: BoostCMSSubSkillEnum.graphicDesign,
        },
        {
            id: 5,
            title: 'Photography',
            type: BoostCMSSubSkillEnum.photography,
        },
    ],
    [BoostCMSCategorySkillEnum.PerformingArts]: [
        {
            id: 1,
            title: 'Acting',
            type: BoostCMSSubSkillEnum.acting,
        },
        {
            id: 2,
            title: 'Dance',
            type: BoostCMSSubSkillEnum.dance,
        },
        {
            id: 3,
            title: 'Singing',
            type: BoostCMSSubSkillEnum.singing,
        },
        {
            id: 4,
            title: 'Instrumental',
            type: BoostCMSSubSkillEnum.instrumental,
        },
        {
            id: 5,
            title: 'Theatre Production',
            type: BoostCMSSubSkillEnum.theaterProduction,
        },
        {
            id: 6,
            title: 'Costume Design',
            type: BoostCMSSubSkillEnum.costumeDesign,
        },
        {
            id: 7,
            title: 'Directing',
            type: BoostCMSSubSkillEnum.directing,
        },
    ],
    [BoostCMSCategorySkillEnum.Writing]: [
        {
            id: 1,
            title: 'Poetry',
            type: BoostCMSSubSkillEnum.poetry,
        },
        {
            id: 2,
            title: 'Fiction',
            type: BoostCMSSubSkillEnum.fiction,
        },
        {
            id: 3,
            title: 'Non fiction',
            type: BoostCMSSubSkillEnum.nonfiction,
        },
        {
            id: 4,
            title: 'Script Writing',
            type: BoostCMSSubSkillEnum.scriptWriting,
        },
        {
            id: 5,
            title: 'Copy Writing',
            type: BoostCMSSubSkillEnum.copyWriting,
        },
        {
            id: 6,
            title: 'Journalism',
            type: BoostCMSSubSkillEnum.journalism,
        },
    ],
    [BoostCMSCategorySkillEnum.Design]: [
        {
            id: 1,
            title: 'Fashion Design',
            type: BoostCMSSubSkillEnum.fashionDesign,
        },
        {
            id: 2,
            title: 'Interior Design',
            type: BoostCMSSubSkillEnum.interiorDesign,
        },
        {
            id: 3,
            title: 'Web Design',
            type: BoostCMSSubSkillEnum.webDesign,
        },
        {
            id: 4,
            title: 'Product Design',
            type: BoostCMSSubSkillEnum.productDesign,
        },
        {
            id: 5,
            title: 'Game Design',
            type: BoostCMSSubSkillEnum.gameDesign,
        },
    ],
    [BoostCMSCategorySkillEnum.Ideation]: [
        {
            id: 1,
            title: 'Brainstorming',
            type: BoostCMSSubSkillEnum.brainstorming,
        },
        {
            id: 2,
            title: 'Concept Development',
            type: BoostCMSSubSkillEnum.conceptDevelopment,
        },
        {
            id: 3,
            title: 'Innovation',
            type: BoostCMSSubSkillEnum.innovation,
        },
        {
            id: 4,
            title: 'Problem Solving',
            type: BoostCMSSubSkillEnum.problemSolving,
        },
        {
            id: 5,
            title: 'Out of the box thinking',
            type: BoostCMSSubSkillEnum.outOfTheBoxThinking,
        },
    ],

    // business
    [BoostCMSCategorySkillEnum.Management]: [
        {
            id: 1,
            title: 'Leadership',
            type: BoostCMSSubSkillEnum.leadership,
        },
        {
            id: 2,
            title: 'Strategic Planning',
            type: BoostCMSSubSkillEnum.strategicPlanning,
        },
        {
            id: 3,
            title: 'Team Building',
            type: BoostCMSSubSkillEnum.teamBuilding,
        },
        {
            id: 4,
            title: 'Delegation',
            type: BoostCMSSubSkillEnum.delegation,
        },
        {
            id: 5,
            title: 'Conflict Resolution',
            type: BoostCMSSubSkillEnum.conflictResolution,
        },
    ],
    [BoostCMSCategorySkillEnum.Finance]: [
        {
            id: 1,
            title: 'Accounting',
            type: BoostCMSSubSkillEnum.accounting,
        },
        {
            id: 2,
            title: 'Budgeting',
            type: BoostCMSSubSkillEnum.budgeting,
        },
        {
            id: 3,
            title: 'Financial Analysis',
            type: BoostCMSSubSkillEnum.financialAnalysis,
        },
        {
            id: 4,
            title: 'Investment',
            type: BoostCMSSubSkillEnum.investment,
        },
        {
            id: 5,
            title: 'Risk Management',
            type: BoostCMSSubSkillEnum.riskManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Marketing]: [
        {
            id: 1,
            title: 'Market Research',
            type: BoostCMSSubSkillEnum.marketResearch,
        },
        {
            id: 2,
            title: 'Branding',
            type: BoostCMSSubSkillEnum.branding,
        },
        {
            id: 3,
            title: 'Advertising',
            type: BoostCMSSubSkillEnum.advertising,
        },
        {
            id: 4,
            title: 'Sales',
            type: BoostCMSSubSkillEnum.sales,
        },
        {
            id: 5,
            title: 'Customer Relationship Management',
            type: BoostCMSSubSkillEnum.customerRelationshipManagement,
        },
    ],
    [BoostCMSCategorySkillEnum.Operations]: [
        {
            id: 1,
            title: 'Logistics',
            type: BoostCMSSubSkillEnum.logistics,
        },
        {
            id: 2,
            title: 'Supply Chain Management',
            type: BoostCMSSubSkillEnum.supplyChainManagement,
        },
        {
            id: 3,
            title: 'Process Improvement',
            type: BoostCMSSubSkillEnum.processImprovement,
        },
        {
            id: 4,
            title: 'Project Management',
            type: BoostCMSSubSkillEnum.projectManagement,
        },
        {
            id: 5,
            title: 'Quality Control',
            type: BoostCMSSubSkillEnum.qualityControl,
        },
    ],
    [BoostCMSCategorySkillEnum.Entrepreneurship]: [
        {
            id: 1,
            title: 'Opportunity Recognition',
            type: BoostCMSSubSkillEnum.opportunityRecognition,
        },
        {
            id: 2,
            title: 'Business Planning',
            type: BoostCMSSubSkillEnum.businessPlanning,
        },
        {
            id: 3,
            title: 'Fundraising',
            type: BoostCMSSubSkillEnum.fundraising,
        },
        {
            id: 4,
            title: 'Networking',
            type: BoostCMSSubSkillEnum.networking,
        },
        {
            id: 5,
            title: 'Decision-making',
            type: BoostCMSSubSkillEnum.decisionMaking,
        },
    ],

    // trade
    [BoostCMSCategorySkillEnum.Construction]: [
        {
            id: 1,
            title: 'Carpentry',
            type: BoostCMSSubSkillEnum.carpentry,
        },
        {
            id: 2,
            title: 'Electrical Work',
            type: BoostCMSSubSkillEnum.electricalWork,
        },
        {
            id: 3,
            title: 'Plumbing',
            type: BoostCMSSubSkillEnum.plumbing,
        },
        {
            id: 4,
            title: 'Masonry',
            type: BoostCMSSubSkillEnum.masonry,
        },
        {
            id: 5,
            title: 'HVAC',
            type: BoostCMSSubSkillEnum.HVAC,
        },
    ],
    [BoostCMSCategorySkillEnum.Mechanics]: [
        {
            id: 1,
            title: 'Automotive Repair',
            type: BoostCMSSubSkillEnum.automotiveRepair,
        },
        {
            id: 2,
            title: 'Diesel Engine Repair',
            type: BoostCMSSubSkillEnum.dieselEngineRepair,
        },
        {
            id: 3,
            title: 'Small Engine Repair',
            type: BoostCMSSubSkillEnum.smallEngineRepair,
        },
        {
            id: 4,
            title: 'Aircraft Maintenance',
            type: BoostCMSSubSkillEnum.aircraftMaintenance,
        },
        {
            id: 5,
            title: 'Heavy Equipment Operation',
            type: BoostCMSSubSkillEnum.heavyEquipmentOperation,
        },
    ],
    [BoostCMSCategorySkillEnum.Manufacturing]: [
        {
            id: 1,
            title: 'Welding',
            type: BoostCMSSubSkillEnum.welding,
        },
        {
            id: 2,
            title: 'Machining',
            type: BoostCMSSubSkillEnum.machining,
        },
        {
            id: 3,
            title: 'Assembly',
            type: BoostCMSSubSkillEnum.assembly,
        },
        {
            id: 4,
            title: 'Fabrication',
            type: BoostCMSSubSkillEnum.fabrication,
        },
        {
            id: 5,
            title: 'Quality Assurance',
            type: BoostCMSSubSkillEnum.qualityAssurance,
        },
    ],
    [BoostCMSCategorySkillEnum.Cosmetology]: [
        {
            id: 1,
            title: 'Hairstyling',
            type: BoostCMSSubSkillEnum.hairstyling,
        },
        {
            id: 2,
            title: 'Barbering',
            type: BoostCMSSubSkillEnum.barbering,
        },
        {
            id: 3,
            title: 'Nail Technology',
            type: BoostCMSSubSkillEnum.nailTechnology,
        },
        {
            id: 4,
            title: 'Makeup Artistry',
            type: BoostCMSSubSkillEnum.makeupArtistry,
        },
        {
            id: 5,
            title: 'Esthetics',
            type: BoostCMSSubSkillEnum.esthetics,
        },
    ],
    [BoostCMSCategorySkillEnum.CulinaryArts]: [
        {
            id: 1,
            title: 'Cooking Techniques',
            type: BoostCMSSubSkillEnum.cookingTechniques,
        },
        {
            id: 2,
            title: 'Baking',
            type: BoostCMSSubSkillEnum.baking,
        },
        {
            id: 3,
            title: 'Food Safety',
            type: BoostCMSSubSkillEnum.foodSafety,
        },
        {
            id: 4,
            title: 'Menu Planning',
            type: BoostCMSSubSkillEnum.menuPlanning,
        },
        {
            id: 5,
            title: 'Restaurant Management',
            type: BoostCMSSubSkillEnum.restaurantManagement,
        },
    ],

    // social
    [BoostCMSCategorySkillEnum.History]: [
        {
            id: 1,
            title: 'Research Methods',
            type: BoostCMSSubSkillEnum.researchMethods,
        },
        {
            id: 2,
            title: 'Analysis of Primary Sources',
            type: BoostCMSSubSkillEnum.analysisOfPrimarySources,
        },
        {
            id: 3,
            title: 'Chronological Reasoning',
            type: BoostCMSSubSkillEnum.chronologicalReasoning,
        },
        {
            id: 4,
            title: 'Comparative History',
            type: BoostCMSSubSkillEnum.comparativeHistory,
        },
        {
            id: 5,
            title: 'Historiography',
            type: BoostCMSSubSkillEnum.historiography,
        },
    ],
    [BoostCMSCategorySkillEnum.Psychology]: [
        {
            id: 1,
            title: 'Cognitive Psychology',
            type: BoostCMSSubSkillEnum.cognitivePsychology,
        },
        {
            id: 2,
            title: 'Developmental Psychology',
            type: BoostCMSSubSkillEnum.developmentalPsychology,
        },
        {
            id: 3,
            title: 'Social Psychology',
            type: BoostCMSSubSkillEnum.socialPsychology,
        },
        {
            id: 4,
            title: 'Experimental Methods',
            type: BoostCMSSubSkillEnum.experimentalMethods,
        },
        {
            id: 5,
            title: 'Clinical Psychology',
            type: BoostCMSSubSkillEnum.clinicalPsychology,
        },
    ],
    [BoostCMSCategorySkillEnum.Sociology]: [
        {
            id: 1,
            title: 'Social Inequality',
            type: BoostCMSSubSkillEnum.socialInequality,
        },
        {
            id: 2,
            title: 'Social Institutions',
            type: BoostCMSSubSkillEnum.socialInstitutions,
        },
        {
            id: 3,
            title: 'Research Methods',
            type: BoostCMSSubSkillEnum.researchMethods,
        },
        {
            id: 4,
            title: 'Social Change',
            type: BoostCMSSubSkillEnum.socialChange,
        },
        {
            id: 5,
            title: 'Social Movements',
            type: BoostCMSSubSkillEnum.socialMovements,
        },
    ],
    [BoostCMSCategorySkillEnum.Economics]: [
        {
            id: 1,
            title: 'Microeconomics',
            type: BoostCMSSubSkillEnum.microeconomics,
        },
        {
            id: 2,
            title: 'Macroeconomics',
            type: BoostCMSSubSkillEnum.macroeconomics,
        },
        {
            id: 3,
            title: 'Econometrics',
            type: BoostCMSSubSkillEnum.econometrics,
        },
        {
            id: 4,
            title: 'Economic Policy',
            type: BoostCMSSubSkillEnum.economicPolicy,
        },
        {
            id: 5,
            title: 'International Economics',
            type: BoostCMSSubSkillEnum.internationalEconomics,
        },
    ],
    [BoostCMSCategorySkillEnum.PoliticalScience]: [
        {
            id: 1,
            title: 'Government Systems',
            type: BoostCMSSubSkillEnum.governmentSystems,
        },
        {
            id: 2,
            title: 'Political Theory',
            type: BoostCMSSubSkillEnum.politicalTheory,
        },
        {
            id: 3,
            title: 'International Relations',
            type: BoostCMSSubSkillEnum.internationalRelations,
        },
        {
            id: 4,
            title: 'Comparative Politics',
            type: BoostCMSSubSkillEnum.comparativePolitics,
        },
        {
            id: 5,
            title: 'Public Policy',
            type: BoostCMSSubSkillEnum.publicPolicy,
        },
    ],

    // digital
    [BoostCMSCategorySkillEnum.BasicComputerSkills]: [
        {
            id: 1,
            title: 'Typing',
            type: BoostCMSSubSkillEnum.typing,
        },
        {
            id: 2,
            title: 'File Management',
            type: BoostCMSSubSkillEnum.fileManagement,
        },
        {
            id: 3,
            title: 'Internet Navigation',
            type: BoostCMSSubSkillEnum.internetNavigation,
        },
        {
            id: 4,
            title: 'Email',
            type: BoostCMSSubSkillEnum.email,
        },
        {
            id: 5,
            title: 'Word Processing',
            type: BoostCMSSubSkillEnum.wordProcessing,
        },
    ],
    [BoostCMSCategorySkillEnum.InformationLiteracy]: [
        {
            id: 1,
            title: 'Search Engine Proficiency',
            type: BoostCMSSubSkillEnum.searchEngineProficiency,
        },
        {
            id: 2,
            title: 'evaluating sources',
            type: BoostCMSSubSkillEnum.evaluatingSources,
        },
        {
            id: 3,
            title: 'Fact Checking',
            type: BoostCMSSubSkillEnum.factChecking,
        },
        {
            id: 4,
            title: 'Critical Media Analysis',
            type: BoostCMSSubSkillEnum.criticalMediaAnalysis,
        },
        {
            id: 5,
            title: 'Understanding Bias',
            type: BoostCMSSubSkillEnum.understandingBias,
        },
    ],
    [BoostCMSCategorySkillEnum.SoftwareProficiency]: [
        {
            id: 1,
            title: 'Productivity Suites',
            type: BoostCMSSubSkillEnum.productivitySuites,
        },
        {
            id: 2,
            title: 'Specialized Software',
            type: BoostCMSSubSkillEnum.specializedSoftware,
        },
        {
            id: 3,
            title: 'Design Software',
            type: BoostCMSSubSkillEnum.designSoftware,
        },
        {
            id: 4,
            title: 'Programming Basics',
            type: BoostCMSSubSkillEnum.programmingBasics,
        },
        {
            id: 5,
            title: 'Data Visualization Tools',
            type: BoostCMSSubSkillEnum.dataVisualizationTools,
        },
    ],
    [BoostCMSCategorySkillEnum.OnlineCommunication]: [
        {
            id: 1,
            title: 'Netiquette',
            type: BoostCMSSubSkillEnum.netiquette,
        },
        {
            id: 2,
            title: 'Effective Email and Messaging',
            type: BoostCMSSubSkillEnum.effectiveEmailAndMessaging,
        },
        {
            id: 3,
            title: 'Social Media Platforms',
            type: BoostCMSSubSkillEnum.socialMediaPlatforms,
        },
        {
            id: 4,
            title: 'Video Conferencing',
            type: BoostCMSSubSkillEnum.videoConferencing,
        },
        {
            id: 5,
            title: 'Collaboration Tools',
            type: BoostCMSSubSkillEnum.collaborationTools,
        },
    ],
    [BoostCMSCategorySkillEnum.Cybersecurity]: [
        {
            id: 1,
            title: 'Password Management',
            type: BoostCMSSubSkillEnum.passwordManagement,
        },
        {
            id: 2,
            title: 'Phishing Awareness',
            type: BoostCMSSubSkillEnum.phishingAwareness,
        },
        {
            id: 3,
            title: 'Data Privacy',
            type: BoostCMSSubSkillEnum.dataPrivacy,
        },
        {
            id: 4,
            title: 'Safe Online Practices',
            type: BoostCMSSubSkillEnum.safeOnlinePractices,
        },
        {
            id: 5,
            title: 'Protecting Devices',
            type: BoostCMSSubSkillEnum.protectingDevices,
        },
    ],

    // medical
    [BoostCMSCategorySkillEnum.ClinicalSkills]: [
        {
            id: 1,
            title: 'Patient Assessment',
            type: BoostCMSSubSkillEnum.patientAssessment,
        },
        {
            id: 2,
            title: 'Diagnostic Procedures',
            type: BoostCMSSubSkillEnum.diagnosticProcedures,
        },
        {
            id: 3,
            title: 'Medication Administration',
            type: BoostCMSSubSkillEnum.medicationAdministration,
        },
        {
            id: 4,
            title: 'Wound Care',
            type: BoostCMSSubSkillEnum.woundCare,
        },
        {
            id: 5,
            title: 'Basic Life Support',
            type: BoostCMSSubSkillEnum.basicLifeSupport,
        },
    ],
    [BoostCMSCategorySkillEnum.AnatomyAndPhysiology]: [
        {
            id: 1,
            title: 'Body Systems',
            type: BoostCMSSubSkillEnum.bodySystems,
        },
        {
            id: 2,
            title: 'Medical Terminology',
            type: BoostCMSSubSkillEnum.medicalTerminology,
        },
        {
            id: 3,
            title: 'Disease Processes',
            type: BoostCMSSubSkillEnum.diseaseProcesses,
        },
        {
            id: 4,
            title: 'Pharmacology',
            type: BoostCMSSubSkillEnum.pharmacology,
        },
        {
            id: 5,
            title: 'Pathophysiology',
            type: BoostCMSSubSkillEnum.pathophysiology,
        },
    ],
    [BoostCMSCategorySkillEnum.PatientCare]: [
        {
            id: 1,
            title: 'Bedside Manner',
            type: BoostCMSSubSkillEnum.bedsideManner,
        },
        {
            id: 2,
            title: 'Empathy',
            type: BoostCMSSubSkillEnum.empathy,
        },
        {
            id: 3,
            title: 'Communication',
            type: BoostCMSSubSkillEnum.communication,
        },
        {
            id: 4,
            title: 'Cultural Sensitivity',
            type: BoostCMSSubSkillEnum.culturalSensitivity,
        },
        {
            id: 5,
            title: 'Ethics',
            type: BoostCMSSubSkillEnum.ethics,
        },
    ],
    [BoostCMSCategorySkillEnum.MedicalSpecialties]: [
        {
            id: 1,
            title: 'Surgery',
            type: BoostCMSSubSkillEnum.surgery,
        },
        {
            id: 2,
            title: 'Emergency Medicine',
            type: BoostCMSSubSkillEnum.emergencyMedicine,
        },
        {
            id: 3,
            title: 'Pediatrics',
            type: BoostCMSSubSkillEnum.pediatrics,
        },
        {
            id: 4,
            title: 'Radiology',
            type: BoostCMSSubSkillEnum.radiology,
        },
        {
            id: 5,
            title: 'Diagnostic Reasoning',
            type: BoostCMSSubSkillEnum.diagnosticReasoning,
        },
        {
            id: 6,
            title: 'Treatment Planning',
            type: BoostCMSSubSkillEnum.treatmentPlanning,
        },
        {
            id: 7,
            title: 'Interdisciplinary Collaboration',
            type: BoostCMSSubSkillEnum.interdisciplinaryCollaboration,
        },
    ],
    [BoostCMSCategorySkillEnum.HealthcareAdministration]: [
        {
            id: 1,
            title: 'Insurance and Billing',
            type: BoostCMSSubSkillEnum.insuranceAndBilling,
        },
        {
            id: 2,
            title: 'Medical Records',
            type: BoostCMSSubSkillEnum.medicalRecords,
        },
        {
            id: 3,
            title: 'Patient Scheduling',
            type: BoostCMSSubSkillEnum.patientScheduling,
        },
        {
            id: 4,
            title: 'Regulatory Compliance',
            type: BoostCMSSubSkillEnum.regulatoryCompliance,
        },
        {
            id: 5,
            title: 'Facility Management',
            type: BoostCMSSubSkillEnum.facilityManagement,
        },
    ],
};
