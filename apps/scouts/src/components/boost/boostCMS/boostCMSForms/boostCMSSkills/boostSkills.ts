import Athletics from '../../../../../assets/images/athletics.png';
import Business from '../../../../../assets/images/business.png';
import Creative from '../../../../../assets/images/creative.png';
import Digital from '../../../../../assets/images/digital.png';
import Durable from '../../../../../assets/images/durable.png';
import Medical from '../../../../../assets/images/medical.png';
import Social from '../../../../../assets/images/social.png';
import Stem from '../../../../../assets/images/stem.png';
import Trade from '../../../../../assets/images/trade.png';

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

export const CATEGORY_TO_SKILLS = {
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
            title: 'Focus',
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
            title: 'Optimism',
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
            title: 'Presentation',
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
            title: 'Evaluating sources',
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
        title: 'Adaptability',
        description: 'Ability to adjust to new conditions and environments.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.Perseverance,
        title: 'Perseverance',
        description: 'Persistent effort in spite of obstacles or discouragement.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.MentalToughness,
        title: 'Mental Toughness',
        description: 'Strength of mind to endure challenges and pressure.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.PhysicalEndurance,
        title: 'Physical Endurance',
        description: 'Capacity to sustain prolonged physical effort.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        type: BoostCMSCategorySkillEnum.LifelongLearning,
        title: 'Lifelong Learning',
        description: 'Ongoing pursuit and improvement of knowledge and skills.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Mathematics,
        title: 'Mathematics',
        description: 'Understanding and working with numbers, equations, and formulas.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Science,
        title: 'Science',
        description: 'Exploration and understanding of the natural and physical world.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Technology,
        title: 'Technology',
        description: 'Use of tools, machines, and systems to solve problems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Engineering,
        title: 'Engineering',
        description:
            'Application of science and math to design and build structures, systems, and devices.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        type: BoostCMSCategorySkillEnum.Research,
        title: 'Research',
        description: 'Systematic investigation to establish facts and reach new conclusions.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.SportSpecificSkills,
        title: 'Sport Specific Skills',
        description: 'Techniques and abilities unique to a particular sport.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        title: 'Strength and Conditioning',
        description: 'Training to improve muscular strength and physical fitness.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.Coordination,
        title: 'Coordination',
        description: 'Ability to use different parts of the body smoothly and efficiently.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.MentalFocus,
        title: 'Mental Focus',
        description: 'Concentration and mental clarity during performance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        type: BoostCMSCategorySkillEnum.Teamwork,
        title: 'Teamwork',
        description: 'Collaborative effort to achieve common goals.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.VisualArts,
        title: 'Visual Arts',
        description:
            'Creative expression through visual media like drawing, painting, and sculpture.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.PerformingArts,
        title: 'Performing Arts',
        description: 'Art forms such as music, dance, and theater performed live.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Writing,
        title: 'Writing',
        description: 'Creative and technical composition of text.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Design,
        title: 'Design',
        description: 'Planning and creating visual and functional solutions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        type: BoostCMSCategorySkillEnum.Ideation,
        title: 'Ideation',
        description: 'Generation and development of new ideas.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Management,
        title: 'Management',
        description: 'Planning, organizing, and supervising resources to achieve objectives.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Finance,
        title: 'Finance',
        description: 'Management of money, investments, and financial planning.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Marketing,
        title: 'Marketing',
        description: 'Promotion and selling of products or services.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Operations,
        title: 'Operations',
        description: 'Efficient execution of business processes and workflows.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        type: BoostCMSCategorySkillEnum.Entrepreneurship,
        title: 'Entrepreneurship',
        description: 'Initiating and growing new business ventures.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Construction,
        title: 'Construction',
        description: 'Building structures and infrastructure.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Mechanics,
        title: 'Mechanics',
        description: 'Maintenance and repair of machines and vehicles.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Manufacturing,
        title: 'Manufacturing',
        description: 'Production of goods using machinery and labor.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.Cosmetology,
        title: 'Cosmetology',
        description: 'Art and science of beauty treatments.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        type: BoostCMSCategorySkillEnum.CulinaryArts,
        title: 'Culinary Arts',
        description: 'Preparation and presentation of food.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.History,
        title: 'History',
        description: 'Study of past events and societies.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Psychology,
        title: 'Psychology',
        description: 'Science of mind and behavior.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Sociology,
        title: 'Sociology',
        description: 'Study of social behavior and institutions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.Economics,
        title: 'Economics',
        description: 'Study of production, consumption, and distribution of goods.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        type: BoostCMSCategorySkillEnum.PoliticalScience,
        title: 'Political Science',
        description: 'Study of governments, policies, and political behavior.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.BasicComputerSkills,
        title: 'Basic Computer Skills',
        description: 'Fundamental use of computers and software applications.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.InformationLiteracy,
        title: 'Information Literacy',
        description: 'Ability to locate, evaluate, and use information effectively.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.SoftwareProficiency,
        title: 'Software Proficiency',
        description: 'Skillful use of specialized software tools.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.OnlineCommunication,
        title: 'Online Communication',
        description: 'Effective digital interaction and collaboration.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        type: BoostCMSCategorySkillEnum.Cybersecurity,
        title: 'Cybersecurity',
        description: 'Protection of systems and data from digital threats.',
    },

    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.ClinicalSkills,
        title: 'Clinical Skills',
        description: 'Practical skills for patient assessment and care.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        title: 'Anatomy and Physiology',
        description: 'Study of body structures and functions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.PatientCare,
        title: 'Patient Care',
        description: 'Compassionate and ethical support for patients.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.MedicalSpecialties,
        title: 'Medical Specialties',
        description: 'Expertise in specific areas of medicine.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        type: BoostCMSCategorySkillEnum.HealthcareAdministration,
        title: 'Healthcare Administration',
        description: 'Management of healthcare facilities and systems.',
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
        title: 'Flexibility',
        description:
            'The ability to adjust to new conditions and environments with ease and grace.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.resilience,
        title: 'Resilience',
        description: 'The capacity to recover quickly from difficulties and bounce back stronger.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.problemSolving,
        title: 'Problem Solving',
        description: 'Identifying, analyzing, and resolving issues efficiently and effectively.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.resourcefulness,
        title: 'Resourcefulness',
        description:
            'Finding quick and clever ways to overcome challenges using available resources.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Adaptability,
        type: BoostCMSSubSkillEnum.stressManagement,
        title: 'Stress Management',
        description:
            'Maintaining composure and effectiveness under pressure or challenging situations.',
    },

    // Durable > Perseverance
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.discipline,
        title: 'Discipline',
        description: 'Consistently applying effort and focus toward goals over time.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.focus,
        title: 'Focus',
        description: 'The ability to concentrate on tasks without getting distracted.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.commitment,
        title: 'Commitment',
        description: 'Staying dedicated to goals or responsibilities despite difficulties.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.grit,
        title: 'Grit',
        description:
            'Sustained effort and passion for long-term goals, especially in the face of adversity.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.Perseverance,
        type: BoostCMSSubSkillEnum.tenacity,
        title: 'Tenacity',
        description: 'Persistent determination in achieving objectives, no matter the obstacles.',
    },

    // Durable > Mental Toughness
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.optimism,
        title: 'Optimism',
        description: 'Maintaining a positive outlook and expecting good outcomes.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.selfConfidence,
        title: 'Self Confidence',
        description: 'Trust in one’s abilities and judgment, even under stress or criticism.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.emotionalRegulation,
        title: 'Emotional Regulation',
        description: 'Managing emotions to stay calm and effective in various situations.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.growthMindset,
        title: 'Growth Mindset',
        description:
            'Belief in the ability to develop skills and intelligence through effort and learning.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.MentalToughness,
        type: BoostCMSSubSkillEnum.positiveSelfTalk,
        title: 'Positive Self-Talk',
        description:
            'Encouraging and constructive internal dialogue that boosts confidence and motivation.',
    },

    // Durable > Physical Endurance
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.strength,
        title: 'Strength',
        description: 'Physical power and capability to perform demanding tasks or movements.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.stamina,
        title: 'Stamina',
        description: 'The ability to sustain prolonged physical or mental effort.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.cardiovascularFitness,
        title: 'Cardiovascular Fitness',
        description: 'Efficiency of the heart and lungs in delivering oxygen during activity.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.painTolerance,
        title: 'Pain Tolerance',
        description: 'The ability to endure discomfort or pain while continuing to function.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.PhysicalEndurance,
        type: BoostCMSSubSkillEnum.injuryPrevention,
        title: 'Injury Prevention',
        description: 'Practices that reduce the risk of harm during physical activity or effort.',
    },

    // Durable > Lifelong Learning
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.curiosity,
        title: 'Curiosity',
        description: 'A strong desire to explore, learn, and understand new things.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.openMindedness,
        title: 'Open Mindedness',
        description: 'Willingness to consider different ideas, perspectives, and experiences.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.criticalThinking,
        title: 'Critical Thinking',
        description: 'Analyzing facts and forming reasoned judgments with clarity and logic.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.selfDirectedLearning,
        title: 'Self-Directed Learning',
        description: 'Taking initiative in identifying and pursuing learning opportunities.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Durable,
        skill: BoostCMSCategorySkillEnum.LifelongLearning,
        type: BoostCMSSubSkillEnum.knowledgeRetention,
        title: 'Knowledge Retention',
        description: 'Effectively storing and recalling information over time.',
    },
    // STEM > Mathematics
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.algebra,
        title: 'Algebra',
        description:
            'Manipulating symbols and solving equations involving variables and constants.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.geometry,
        title: 'Geometry',
        description: 'Studying shapes, sizes, and the properties of space and position.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.trigonometry,
        title: 'Trigonometry',
        description: 'Exploring the relationships between the angles and sides of triangles.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.calculus,
        title: 'Calculus',
        description: 'Analyzing change through derivatives and integrals of functions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Mathematics,
        type: BoostCMSSubSkillEnum.statistics,
        title: 'Statistics',
        description: 'Collecting, analyzing, and interpreting data to draw conclusions.',
    },

    // STEM > Science
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.physics,
        title: 'Physics',
        description: 'Understanding the fundamental principles of matter, energy, and motion.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.chemistry,
        title: 'Chemistry',
        description: 'Investigating the properties, composition, and reactions of substances.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.biology,
        title: 'Biology',
        description: 'Studying living organisms, their structure, function, and interactions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.earthScience,
        title: 'Earth Science',
        description: 'Exploring Earth’s physical structure, processes, and systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Science,
        type: BoostCMSSubSkillEnum.environmentalScience,
        title: 'Environmental Science',
        description: 'Examining human impact on ecosystems and ways to protect natural resources.',
    },

    // STEM > Technology
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.coding,
        title: 'Coding',
        description: 'Writing and understanding instructions that computers can execute.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.softwareDevelopment,
        title: 'Software Development',
        description: 'Designing, building, and maintaining applications and systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.dataAnalysis,
        title: 'Data Analysis',
        description:
            'Extracting insights and patterns from datasets using statistical and computational tools.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.robotics,
        title: 'Robotics',
        description:
            'Designing, building, and programming machines that perform tasks autonomously.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Technology,
        type: BoostCMSSubSkillEnum.cybersecurity,
        title: 'Cybersecurity',
        description:
            'Protecting systems and networks from digital attacks and unauthorized access.',
    },

    // STEM > Engineering
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.mechanicalEngineering,
        title: 'Mechanical Engineering',
        description: 'Applying physics and materials science to design mechanical systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.electricalEngineering,
        title: 'Electrical Engineering',
        description: 'Designing and working with electrical systems, circuits, and devices.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.civilEngineering,
        title: 'Civil Engineering',
        description:
            'Planning, designing, and constructing infrastructure such as roads and bridges.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.chemicalEngineering,
        title: 'Chemical Engineering',
        description:
            'Combining chemistry and engineering to develop processes for producing materials.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Engineering,
        type: BoostCMSSubSkillEnum.computerEngineering,
        title: 'Computer Engineering',
        description: 'Developing computer hardware and integrating it with software systems.',
    },

    // STEM > Research
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.hypothesisDevelopment,
        title: 'Hypothesis Development',
        description: 'Formulating testable explanations based on observations and prior knowledge.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.experimentalDesign,
        title: 'Experimental Design',
        description: 'Creating structured methods to investigate scientific questions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.dataCollection,
        title: 'Data Collection',
        description: 'Gathering accurate information for analysis through various methods.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.analysis,
        title: 'Analysis',
        description: 'Interpreting collected data to find meaning, trends, or results.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Stem,
        skill: BoostCMSCategorySkillEnum.Research,
        type: BoostCMSSubSkillEnum.presentation,
        title: 'Presentation',
        description: 'Communicating research findings clearly and effectively to others.',
    },

    // Athletic > Sport Specific Skills
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.ballHandling,
        title: 'Ball Handling',
        description: 'Controlling, dribbling, and maneuvering a ball effectively during gameplay.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.runningTechnique,
        title: 'Running Technique',
        description: 'Using efficient form and movement patterns to improve speed and endurance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.swingMechanics,
        title: 'Swing Mechanics',
        description:
            'Optimizing movement for powerful and accurate swings in sports like baseball, golf, or tennis.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.tackling,
        title: 'Tackling',
        description: 'Safely and effectively stopping an opponent’s progress in contact sports.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.SportSpecificSkills,
        type: BoostCMSSubSkillEnum.swimmingStrokes,
        title: 'Swimming Strokes',
        description:
            'Executing different stroke techniques such as freestyle, backstroke, breaststroke, and butterfly.',
    },

    // Athletic > Strength and Conditioning
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.weightLifting,
        title: 'Weight Lifting',
        description: 'Building muscle strength and endurance through resistance training.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.speedTraining,
        title: 'Speed Training',
        description:
            'Improving acceleration, stride length, and stride frequency for faster performance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.agility,
        title: 'Agility',
        description: 'Moving quickly and easily while maintaining balance and control.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.lexibility,
        title: 'Flexibility',
        description:
            'Enhancing range of motion in muscles and joints to improve performance and prevent injury.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.StrengthAndConditioning,
        type: BoostCMSSubSkillEnum.injuryPrevention,
        title: 'Injury Prevention',
        description:
            'Developing safe training habits and strengthening key areas to reduce risk of injury.',
    },

    // Athletic > Coordination
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.handEyeCoordination,
        title: 'Hand-Eye Coordination',
        description: 'Synchronizing hand movement with visual input to perform tasks effectively.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.footwork,
        title: 'Footwork',
        description:
            'Executing precise and efficient foot movements to enhance positioning and performance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.balance,
        title: 'Balance',
        description: 'Maintaining body control and stability in dynamic or static positions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.reactionTime,
        title: 'Reaction Time',
        description: 'Responding quickly and appropriately to external stimuli during play.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Coordination,
        type: BoostCMSSubSkillEnum.spatialAwareness,
        title: 'Spatial Awareness',
        description:
            'Understanding and navigating the space around oneself relative to others and objects.',
    },

    // Athletic > Mental Focus
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.visualization,
        title: 'Visualization',
        description:
            'Mentally rehearsing movements and outcomes to improve confidence and execution.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.goalSetting,
        title: 'Goal Setting',
        description:
            'Creating specific and measurable targets to drive motivation and improvement.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.competitiveness,
        title: 'Competitiveness',
        description:
            'Channeling the desire to excel and outperform others in a healthy and focused way.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.resilience,
        title: 'Resilience',
        description:
            'Maintaining mental toughness and bouncing back from setbacks in training or competition.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.MentalFocus,
        type: BoostCMSSubSkillEnum.handlingPressure,
        title: 'Handling Pressure',
        description: 'Performing effectively under high-stress, high-stakes scenarios.',
    },

    // Athletic > Teamwork
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.communication,
        title: 'Communication',
        description: 'Clearly sharing ideas, strategies, and feedback with teammates.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.cooperation,
        title: 'Cooperation',
        description: 'Working collaboratively with others to achieve team objectives.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.roleUnderstanding,
        title: 'Role Understanding',
        description: 'Knowing and fulfilling one’s responsibilities within a team structure.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.strategy,
        title: 'Strategy',
        description: 'Planning and executing coordinated tactics to achieve victory or success.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Athletic,
        skill: BoostCMSCategorySkillEnum.Teamwork,
        type: BoostCMSSubSkillEnum.sportsmanship,
        title: 'Sportsmanship',
        description: 'Demonstrating fairness, respect, and gracious behavior in competition.',
    },
    // Creative > Visual Arts
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.drawing,
        title: 'Drawing',
        description:
            'The art or skill of making marks on a surface to represent objects, actions, or ideas.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.painting,
        title: 'Painting',
        description:
            'Applying pigment to a surface to create an expressive or representational image.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.sculpture,
        title: 'Sculpture',
        description: 'Creating three-dimensional forms by shaping or combining materials.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.graphicDesign,
        title: 'Graphic Design',
        description:
            'Visual communication using typography, imagery, and layout to convey messages.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.VisualArts,
        type: BoostCMSSubSkillEnum.photography,
        title: 'Photography',
        description: 'Capturing images through cameras to express ideas or document moments.',
    },

    // Creative > Performing Arts
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.acting,
        title: 'Acting',
        description:
            'Performing roles in plays, films, or other productions to portray characters.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.dance,
        title: 'Dance',
        description:
            'Artistic movement of the body, often set to music, to express emotions or tell stories.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.singing,
        title: 'Singing',
        description:
            'Producing musical tones with the voice to perform songs or vocal compositions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.instrumental,
        title: 'Instrumental',
        description: 'Performing music using instruments, either solo or in ensembles.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.theaterProduction,
        title: 'Theater Production',
        description:
            'Coordinating and managing stage performances, including sets, lighting, and direction.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.costumeDesign,
        title: 'Costume Design',
        description: 'Creating clothing and outfits for characters in performances.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.PerformingArts,
        type: BoostCMSSubSkillEnum.directing,
        title: 'Directing',
        description: 'Overseeing the creative vision and execution of a performance or production.',
    },

    // Creative > Writing
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.poetry,
        title: 'Poetry',
        description: 'Writing that emphasizes the aesthetic and rhythmic qualities of language.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.fiction,
        title: 'Fiction',
        description: 'Creating imaginative stories that are not based on real events.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.nonfiction,
        title: 'Nonfiction',
        description: 'Writing based on factual information and real events.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.scriptWriting,
        title: 'Script Writing',
        description:
            'Creating scripts for plays, films, or broadcasts including dialogue and directions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.copyWriting,
        title: 'Copy Writing',
        description: 'Crafting persuasive and engaging content for marketing or advertising.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Writing,
        type: BoostCMSSubSkillEnum.journalism,
        title: 'Journalism',
        description: 'Reporting and writing news stories for media outlets.',
    },

    // Creative > Design
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.fashionDesign,
        title: 'Fashion Design',
        description:
            'Creating clothing and accessories with attention to style, color, and trends.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.interiorDesign,
        title: 'Interior Design',
        description: 'Planning and designing functional and aesthetic indoor spaces.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.webDesign,
        title: 'Web Design',
        description: 'Creating user-friendly and visually appealing websites.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.productDesign,
        title: 'Product Design',
        description: 'Designing functional and marketable physical or digital products.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Design,
        type: BoostCMSSubSkillEnum.gameDesign,
        title: 'Game Design',
        description: 'Creating rules, structure, and content for video or physical games.',
    },

    // Creative > Ideation
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.brainstorming,
        title: 'Brainstorming',
        description:
            'Generating a large number of ideas to solve a problem or explore opportunities.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.conceptDevelopment,
        title: 'Concept Development',
        description: 'Refining and building out ideas into viable projects or products.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.innovation,
        title: 'Innovation',
        description: 'Creating and implementing new and effective solutions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Creative,
        skill: BoostCMSCategorySkillEnum.Ideation,
        type: BoostCMSSubSkillEnum.outOfTheBoxThinking,
        title: 'Out-of-the-Box Thinking',
        description: 'Approaching problems in unconventional and creative ways.',
    },

    // Business > Management
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.leadership,
        title: 'Leadership',
        description: 'Inspiring and guiding individuals or teams toward a shared goal or vision.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.strategicPlanning,
        title: 'Strategic Planning',
        description: 'Developing long-term objectives and actionable steps for business growth.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.teamBuilding,
        title: 'Team Building',
        description: 'Creating a cohesive, collaborative team through trust and shared goals.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.delegation,
        title: 'Delegation',
        description:
            'Assigning responsibilities effectively based on individual strengths and roles.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Management,
        type: BoostCMSSubSkillEnum.conflictResolution,
        title: 'Conflict Resolution',
        description:
            'Addressing and resolving disagreements to maintain a productive work environment.',
    },

    // Business > Finance
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.accounting,
        title: 'Accounting',
        description: 'Tracking and reporting financial transactions for budgeting and compliance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.budgeting,
        title: 'Budgeting',
        description: 'Planning and managing financial resources to meet organizational goals.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.financialAnalysis,
        title: 'Financial Analysis',
        description:
            'Interpreting financial data to assess performance and inform decision-making.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.investment,
        title: 'Investment',
        description: 'Allocating resources to assets or ventures for potential returns.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Finance,
        type: BoostCMSSubSkillEnum.riskManagement,
        title: 'Risk Management',
        description: 'Identifying and mitigating potential financial or operational risks.',
    },

    // Business > Marketing
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.marketResearch,
        title: 'Market Research',
        description: 'Gathering insights on customer needs, trends, and competitors.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.branding,
        title: 'Branding',
        description: 'Shaping the identity and perception of a business or product.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.advertising,
        title: 'Advertising',
        description: 'Promoting products or services through various media channels.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.sales,
        title: 'Sales',
        description: 'Converting leads into customers by understanding and meeting their needs.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Marketing,
        type: BoostCMSSubSkillEnum.customerRelationshipManagement,
        title: 'Customer Relationship Management',
        description: 'Building and maintaining strong relationships with clients or customers.',
    },

    // Business > Operations
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.logistics,
        title: 'Logistics',
        description: 'Coordinating the movement of goods, services, and information efficiently.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.supplyChainManagement,
        title: 'Supply Chain Management',
        description: 'Overseeing all steps in sourcing, production, and delivery processes.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.processImprovement,
        title: 'Process Improvement',
        description: 'Streamlining operations to boost productivity and reduce waste.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.projectManagement,
        title: 'Project Management',
        description: 'Planning, executing, and closing projects to meet defined goals.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Operations,
        type: BoostCMSSubSkillEnum.qualityControl,
        title: 'Quality Control',
        description: 'Ensuring products and services meet standards and specifications.',
    },

    // Business > Entrepreneurship
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.opportunityRecognition,
        title: 'Opportunity Recognition',
        description: 'Identifying unmet needs or gaps in the market for innovation.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.businessPlanning,
        title: 'Business Planning',
        description:
            'Outlining strategies, goals, and resources for starting or growing a business.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.fundraising,
        title: 'Fundraising',
        description: 'Securing capital or investments to finance business operations or expansion.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.networking,
        title: 'Networking',
        description:
            'Building professional relationships to support business growth and opportunities.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Business,
        skill: BoostCMSCategorySkillEnum.Entrepreneurship,
        type: BoostCMSSubSkillEnum.decisionMaking,
        title: 'Decision Making',
        description: 'Evaluating options and making informed choices under uncertainty.',
    },

    // Trade > Construction
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.carpentry,
        title: 'Carpentry',
        description:
            'Building and repairing structures and frameworks using wood and other materials.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.electricalWork,
        title: 'Electrical Work',
        description: 'Installing, maintaining, and repairing electrical systems and wiring.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.plumbing,
        title: 'Plumbing',
        description: 'Installing and repairing water supply, drainage, and piping systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.masonry,
        title: 'Masonry',
        description: 'Constructing structures using brick, stone, or concrete blocks.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Construction,
        type: BoostCMSSubSkillEnum.HVAC,
        title: 'HVAC',
        description: 'Installing and servicing heating, ventilation, and air conditioning systems.',
    },

    // Trade > Mechanics
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.automotiveRepair,
        title: 'Automotive Repair',
        description: 'Diagnosing and fixing issues in cars and other vehicles.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.dieselEngineRepair,
        title: 'Diesel Engine Repair',
        description:
            'Servicing and maintaining diesel engines used in trucks, buses, and equipment.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.smallEngineRepair,
        title: 'Small Engine Repair',
        description: 'Repairing engines found in lawnmowers, generators, and similar equipment.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.aircraftMaintenance,
        title: 'Aircraft Maintenance',
        description: 'Inspecting and repairing airplane mechanical and electronic systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Mechanics,
        type: BoostCMSSubSkillEnum.heavyEquipmentOperation,
        title: 'Heavy Equipment Operation',
        description:
            'Operating large machinery like bulldozers and excavators safely and efficiently.',
    },

    // Trade > Manufacturing
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.welding,
        title: 'Welding',
        description: 'Joining metal parts together using heat and pressure.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.machining,
        title: 'Machining',
        description: 'Shaping parts using lathes, mills, and other cutting tools.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.assembly,
        title: 'Assembly',
        description: 'Putting together components to create finished products or systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.fabrication,
        title: 'Fabrication',
        description:
            'Constructing metal structures through cutting, bending, and assembling processes.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Manufacturing,
        type: BoostCMSSubSkillEnum.qualityAssurance,
        title: 'Quality Assurance',
        description: 'Ensuring manufactured goods meet required standards and specifications.',
    },

    // Trade > Cosmetology
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.hairstyling,
        title: 'Hairstyling',
        description: 'Cutting, coloring, and styling hair to enhance appearance.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.barbering,
        title: 'Barbering',
        description: 'Providing grooming services including haircuts, shaving, and beard care.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.nailTechnology,
        title: 'Nail Technology',
        description: 'Performing manicures, pedicures, and nail art treatments.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.makeupArtistry,
        title: 'Makeup Artistry',
        description: 'Applying makeup to enhance or transform appearance for various occasions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Trade,
        skill: BoostCMSCategorySkillEnum.Cosmetology,
        type: BoostCMSSubSkillEnum.esthetics,
        title: 'Esthetics',
        description:
            'Caring for the skin through treatments like facials, waxing, and exfoliation.',
    },
    // Social > History
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.researchMethods,
        title: 'Research Methods',
        description: 'Using scholarly techniques to gather and evaluate historical information.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.analysisOfPrimarySources,
        title: 'Analysis of Primary Sources',
        description:
            'Interpreting original historical documents and artifacts to understand the past.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.chronologicalReasoning,
        title: 'Chronological Reasoning',
        description: 'Understanding cause and effect through the sequence of historical events.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.comparativeHistory,
        title: 'Comparative History',
        description:
            'Analyzing similarities and differences across historical contexts or cultures.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.History,
        type: BoostCMSSubSkillEnum.historiography,
        title: 'Historiography',
        description: 'Studying how history is written and interpreted over time.',
    },

    // Social > Psychology
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.cognitivePsychology,
        title: 'Cognitive Psychology',
        description: 'Exploring mental processes such as memory, perception, and decision-making.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.developmentalPsychology,
        title: 'Developmental Psychology',
        description: 'Studying psychological growth and changes across the lifespan.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.socialPsychology,
        title: 'Social Psychology',
        description: 'Examining how individuals think, feel, and behave in social contexts.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.experimentalMethods,
        title: 'Experimental Methods',
        description: 'Designing and conducting psychological experiments to test hypotheses.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Psychology,
        type: BoostCMSSubSkillEnum.clinicalPsychology,
        title: 'Clinical Psychology',
        description: 'Assessing and treating mental, emotional, and behavioral disorders.',
    },

    // Social > Sociology
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialInequality,
        title: 'Social Inequality',
        description: 'Understanding disparities in wealth, status, and power across social groups.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialInstitutions,
        title: 'Social Institutions',
        description: 'Studying structures like family, religion, and education that shape society.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialChange,
        title: 'Social Change',
        description: 'Analyzing shifts in societal norms, values, and behaviors over time.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Sociology,
        type: BoostCMSSubSkillEnum.socialMovements,
        title: 'Social Movements',
        description: 'Exploring collective efforts to promote or resist social change.',
    },

    // Social > Economics
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.microeconomics,
        title: 'Microeconomics',
        description: 'Studying individual economic units like consumers and businesses.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.macroeconomics,
        title: 'Macroeconomics',
        description: 'Analyzing economy-wide phenomena like inflation, GDP, and unemployment.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.econometrics,
        title: 'Econometrics',
        description: 'Applying statistical methods to test economic theories and forecasts.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.economicPolicy,
        title: 'Economic Policy',
        description: 'Formulating and analyzing decisions that influence a nation’s economy.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.Economics,
        type: BoostCMSSubSkillEnum.internationalEconomics,
        title: 'International Economics',
        description: 'Examining trade, finance, and economic interactions between countries.',
    },

    // Social > Political Science
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.governmentSystems,
        title: 'Government Systems',
        description: 'Understanding how different forms of government function and operate.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.politicalTheory,
        title: 'Political Theory',
        description: 'Exploring ideas about power, governance, justice, and rights.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.internationalRelations,
        title: 'International Relations',
        description: 'Analyzing political relationships and diplomacy between nations.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.comparativePolitics,
        title: 'Comparative Politics',
        description: 'Comparing political systems and institutions across different countries.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Social,
        skill: BoostCMSCategorySkillEnum.PoliticalScience,
        type: BoostCMSSubSkillEnum.publicPolicy,
        title: 'Public Policy',
        description: 'Developing and evaluating laws and regulations to address public issues.',
    },

    // Digital > Basic Computer Skills
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.typing,
        title: 'Typing',
        description: 'Entering text efficiently using a keyboard with speed and accuracy.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.fileManagement,
        title: 'File Management',
        description: 'Organizing, storing, and retrieving digital files and folders effectively.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.internetNavigation,
        title: 'Internet Navigation',
        description: 'Using web browsers and online tools to find and interact with websites.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.email,
        title: 'Email',
        description: 'Using email platforms to send, receive, and manage electronic communication.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.BasicComputerSkills,
        type: BoostCMSSubSkillEnum.wordProcessing,
        title: 'Word Processing',
        description: 'Creating and editing text documents using word processing software.',
    },

    // Digital > Information Literacy
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.searchEngineProficiency,
        title: 'Search Engine Proficiency',
        description:
            'Using search engines effectively to locate accurate and relevant information.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.evaluatingSources,
        title: 'Evaluating Sources',
        description: 'Assessing the reliability and credibility of online content and information.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.factChecking,
        title: 'Fact Checking',
        description: 'Verifying the truthfulness and accuracy of information before accepting it.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.criticalMediaAnalysis,
        title: 'Critical Media Analysis',
        description: 'Understanding and analyzing media messages and their impact on society.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.InformationLiteracy,
        type: BoostCMSSubSkillEnum.understandingBias,
        title: 'Understanding Bias',
        description: 'Recognizing and accounting for bias in media and information sources.',
    },

    // Digital > Software Proficiency
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.productivitySuites,
        title: 'Productivity Suites',
        description: 'Using software like Microsoft Office or Google Workspace to complete tasks.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.specializedSoftware,
        title: 'Specialized Software',
        description:
            'Using industry-specific programs tailored to particular job functions or fields.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.designSoftware,
        title: 'Design Software',
        description: 'Utilizing tools like Adobe Creative Suite or Figma for visual design work.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.programmingBasics,
        title: 'Programming Basics',
        description: 'Understanding fundamental coding concepts and writing basic code.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.SoftwareProficiency,
        type: BoostCMSSubSkillEnum.dataVisualizationTools,
        title: 'Data Visualization Tools',
        description:
            'Creating visual representations of data using software like Tableau or Excel.',
    },

    // Digital > Online Communication
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.netiquette,
        title: 'Netiquette',
        description: 'Demonstrating respectful and appropriate behavior in digital communication.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.effectiveEmailAndMessaging,
        title: 'Effective Email and Messaging',
        description: 'Communicating clearly and professionally through email and chat platforms.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.socialMediaPlatforms,
        title: 'Social Media Platforms',
        description:
            'Using platforms like Twitter, Instagram, or LinkedIn for communication and networking.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.videoConferencing,
        title: 'Video Conferencing',
        description:
            'Participating in and hosting virtual meetings using tools like Zoom or Teams.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.OnlineCommunication,
        type: BoostCMSSubSkillEnum.collaborationTools,
        title: 'Collaboration Tools',
        description: 'Using apps like Slack, Trello, or Notion for teamwork and coordination.',
    },

    // Digital > Cyber Security
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.passwordManagement,
        title: 'Password Management',
        description: 'Creating and storing strong, secure passwords to protect online accounts.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.phishingAwareness,
        title: 'Phishing Awareness',
        description: 'Recognizing and avoiding scams that try to steal personal information.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.dataPrivacy,
        title: 'Data Privacy',
        description: 'Protecting sensitive personal and organizational information online.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.safeOnlinePractices,
        title: 'Safe Online Practices',
        description: 'Following behaviors that reduce risk while using the internet.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Digital,
        skill: BoostCMSCategorySkillEnum.Cybersecurity,
        type: BoostCMSSubSkillEnum.protectingDevices,
        title: 'Protecting Devices',
        description: 'Securing computers and mobile devices against threats and malware.',
    },

    // Medical > Clinical Skills
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.patientAssessment,
        title: 'Patient Assessment',
        description:
            'Evaluating a patient’s physical and emotional condition to inform care decisions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.diagnosticProcedures,
        title: 'Diagnostic Procedures',
        description: 'Conducting tests to identify diseases or medical conditions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.medicationAdministration,
        title: 'Medication Administration',
        description: 'Safely delivering prescribed medications to patients via appropriate routes.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.woundCare,
        title: 'Wound Care',
        description: 'Treating and managing open wounds to promote healing and prevent infection.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.ClinicalSkills,
        type: BoostCMSSubSkillEnum.basicLifeSupport,
        title: 'Basic Life Support',
        description: 'Providing immediate care in life-threatening emergencies, including CPR.',
    },

    // Medical > Anatomy and Physiology
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.bodySystems,
        title: 'Body Systems',
        description: 'Understanding the structure and function of the human body systems.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.medicalTerminology,
        title: 'Medical Terminology',
        description: 'Using the language of medicine to accurately describe patient conditions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.diseaseProcesses,
        title: 'Disease Processes',
        description: 'Studying how diseases develop and affect the body.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.pharmacology,
        title: 'Pharmacology',
        description: 'Learning how drugs affect biological systems to treat conditions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.AnatomyAndPhysiology,
        type: BoostCMSSubSkillEnum.pathophysiology,
        title: 'Pathophysiology',
        description: 'Understanding the altered physiological processes associated with disease.',
    },

    // Medical > Patient Care
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.bedsideManner,
        title: 'Bedside Manner',
        description: 'Demonstrating empathy and professionalism in patient interactions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.empathy,
        title: 'Empathy',
        description:
            'Understanding and sharing the feelings of patients to provide compassionate care.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.culturalSensitivity,
        title: 'Cultural Sensitivity',
        description: 'Respecting diverse cultural backgrounds and practices in medical care.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.PatientCare,
        type: BoostCMSSubSkillEnum.ethics,
        title: 'Ethics',
        description: 'Applying moral principles to medical decision-making and patient treatment.',
    },

    // Medical > Medical Specialties
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.surgery,
        title: 'Surgery',
        description: 'Performing operative procedures to treat injuries, diseases, or deformities.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.emergencyMedicine,
        title: 'Emergency Medicine',
        description: 'Providing immediate medical care for acute illnesses and injuries.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.pediatrics,
        title: 'Pediatrics',
        description: 'Specializing in medical care for infants, children, and adolescents.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.radiology,
        title: 'Radiology',
        description: 'Using imaging technologies to diagnose and monitor medical conditions.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.diagnosticReasoning,
        title: 'Diagnostic Reasoning',
        description: 'Synthesizing clinical data to identify the most likely medical diagnosis.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.treatmentPlanning,
        title: 'Treatment Planning',
        description: 'Developing personalized care strategies to address patient needs.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.MedicalSpecialties,
        type: BoostCMSSubSkillEnum.interdisciplinaryCollaboration,
        title: 'Interdisciplinary Collaboration',
        description: 'Working with professionals across specialties to provide comprehensive care.',
    },

    // Medical > Healthcare Administration
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.insuranceAndBilling,
        title: 'Insurance and Billing',
        description:
            'Managing financial processes related to patient insurance and medical services.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.medicalRecords,
        title: 'Medical Records',
        description: 'Documenting and maintaining accurate and confidential patient information.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.patientScheduling,
        title: 'Patient Scheduling',
        description: 'Coordinating appointments and procedures to ensure timely care.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.regulatoryCompliance,
        title: 'Regulatory Compliance',
        description: 'Following healthcare laws, policies, and ethical standards.',
    },
    {
        category: BoostCMSSKillsCategoryEnum.Medical,
        skill: BoostCMSCategorySkillEnum.HealthcareAdministration,
        type: BoostCMSSubSkillEnum.facilityManagement,
        title: 'Facility Management',
        description: 'Overseeing the operations and maintenance of medical facilities.',
    },
];
