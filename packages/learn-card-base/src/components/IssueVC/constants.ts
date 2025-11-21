// obv3 achievementType spec -> https://1edtech.github.io/openbadges-specification/ob_v3p0.html#achievementtype-enumeration
// The type of achievement, for example 'Award' or 'Certification'.
// This is an extensible enumerated vocabulary. Extending the vocabulary makes use of a naming convention
// ! MUST ALIGN WITH -> learn-card-base/src/helpers -> credentialHelpers.ts -> { CATEGORY_MAP }
export const AchievementTypes = {
    Achievement: 'Achievement',
    ApprenticeshipCertificate: 'ApprenticeshipCertificate',
    Assessment: 'Assessment',
    Assignment: 'Assignment',
    AssociateDegree: 'AssociateDegree',
    Award: 'Award',
    Badge: 'Badge',
    BachelorDegree: 'BachelorDegree',
    Certificate: 'Certificate',
    CertificateOfCompletion: 'CertificateOfCompletion',
    Certification: 'Certification',
    CommunityService: 'CommunityService', // duplicate
    Competency: 'Competency',
    Course: 'Course',
    CoCurricular: 'CoCurricular',
    Degree: 'Degree',
    Diploma: 'Diploma',
    DoctoralDegree: 'DoctoralDegree',
    Fieldwork: 'Fieldwork',
    GeneralEducationDevelopment: 'GeneralEducationDevelopment',
    JourneymanCertificate: 'JourneymanCertificate',
    LearningProgram: 'LearningProgram',
    License: 'License',
    Membership: 'Membership',
    ProfessionalDoctorate: 'ProfessionalDoctorate',
    QualityAssuranceCredential: 'QualityAssuranceCredential',
    MasterCertificate: 'MasterCertificate',
    MasterDegree: 'MasterDegree',
    MicroCredential: 'MicroCredential',
    ResearchDoctorate: 'ResearchDoctorate',
    SecondarySchoolDiploma: 'SecondarySchoolDiploma',

    // This enumeration can be extended with new, proprietary terms.
    // The new terms must start with the substring 'ext:'

    // extending ( ID ) category
    StudentID: 'ext:StudentID',
    MemberID: 'ext:MemberID',
    MemberNFTID: 'ext:MemberNFTID',
    DriversLicense: 'ext:DriversLicense',
    StateOrNationalID: 'ext:StateOrNationalID',
    Passport: 'ext:Passport',

    EmployerID: 'ext:EmployerID',
    SchoolID: 'ext:SchoolID',
    CollegeID: 'ext:CollegeID',
    UniversityID: 'ext:UniversityID',
    ClubID: 'ext:ClubID',
    AssociationID: 'ext:AssociationID',
    LibraryCard: 'ext:LibraryCard',
    TaskforceID: 'ext:TaskforceID',
    CommunityOfPracticeID: 'ext:CommunityOfPracticeID',
    EventID: 'ext:EventID',

    // extending ( SocialBadges ) category
    Opportunist: 'ext:Opportunist',
    CoolCat: 'ext:CoolCat',
    RiskTaker: 'ext:Risktaker',
    Tastemaker: 'ext:Tastemaker',
    Trailblazer: 'ext:Trailblazer',
    Influencer: 'ext:Influencer',
    Connector: 'ext:Connector',
    Maven: 'ext:Maven',
    Trendsetter: 'ext:Trendsetter',
    Organizer: 'ext:Organizer',
    Moderator: 'ext:Moderator',
    Leader: 'ext:Leader',
    Catalyst: 'ext:Catalyst',
    Expert: 'ext:Expert',
    Enthusiast: 'ext:Enthusiast',
    Ambassador: 'ext:Ambassador',
    Aficionado: 'ext:Aficionado',
    Psychic: 'ext:Psychic',
    Magician: 'ext:Magician',
    Charmer: 'ext:Charmer',
    Cowboy: 'ext:Cowboy',
    Perfectionist: 'ext:Perfectionist',
    Enabler: 'ext:Enabler',
    Maverick: 'ext:Maverick',
    Informer: 'ext:Informer',
    Wanderer: 'ext:Wanderer',
    Propagator: 'ext:Propagator',
    HotShot: 'ext:HotShot',
    Sage: 'ext:Sage',
    ChangeMaker: 'ext:ChangeMaker',
    Challenger: 'ext:Challenger',
    TeamPlayer: 'ext:TeamPlayer',
    Star: 'ext:Star',
    PartyAnimal: 'ext:PartyAnimal',
    TroubleMaker: 'ext:TroubleMaker',
    PartyPlanner: 'ext:PartyPlanner',
    ChallengeMaker: 'ext:ChallengeMaker',
    Promoter: 'ext:Promoter',
    Doer: 'ext:Doer',
    Entertainer: 'ext:Entertainer',
    Connoisseur: 'ext:Connoisseur',

    // ScoutPass official Badges
    Adventurer: 'ext:Adventurer',
    Unifier: 'ext:Unifier',
    Protector: 'ext:Protector',
    Jester: 'ext:Jester',
    Survivor: 'ext:Survivor',
    KnotMaster: 'ext:KnotMaster',
    // ChangeMaker: 'ext:ChangeMaker', // duplicate
    Diplomat: 'ext:Diplomat',
    Optimist: 'ext:Optimist',
    MosquitoMagnet: 'ext:MosquitoMagnet',
    Resilient: 'ext:Resilient',
    Stylist: 'ext:Stylist',
    Samaritan: 'ext:Samaritan',
    Innovator: 'ext:Innovator',
    Prankster: 'ext:Prankster',
    Inspirer: 'ext:Inspirer',
    // Organizer: 'ext:Organizer', // duplicate
    Supporter: 'ext:Supporter',
    Rested: 'ext:Rested',
    Celebrator: 'ext:Celebrator',
    Trustworthy: 'ext:Trustworthy',
    KStar: 'ext:KStar', // ! deprecated
    // Connector: 'ext:Connector', // duplicate
    Polyglot: 'ext:Polyglot',
    Trader: 'ext:Trader',
    Bouncy: 'ext:Bouncy', // ! deprecated -> ext:Resiliant
    FunMaker: 'ext:FunMaker',
    TentMate: 'ext:TentMate',
    PackMaster: 'ext:PackMaster',
    LaterBird: 'ext:LaterBird',
    Snoozer: 'ext:Snoozer',
    SubHero: 'ext:SubHero', // ! deprecated
    // Connoisseur: 'ext:Connoisseur', // duplicate
    SnoreMaster: 'ext:SnoreMaster',
    Insomniac: 'ext:Insomniac',
    EarlyBird: 'ext:EarlyBird',
    Chef: 'ext:Chef',
    Griller: 'ext:Griller',
    Foodie: 'ext:Foodie', // ! deprecated
    Hydrator: 'ext:Hydrator',
    Rescuer: 'ext:Rescuer',
    ScoutInfluencer: 'ext:ScoutInfluencer',
    SnapchatScout: 'ext:SnapchatScout',
    InstaGuru: 'ext:InstaGuru',
    TickTrendSetter: 'ext:TickTrendSetter',

    // extending ( Achievement ) category
    CourseCompletion: 'ext:CourseCompletion',
    Attendance: 'ext:Attendance',
    DeansList: 'ext:DeansList',
    HonorsAward: 'ext:HonorsAward',
    ResearchPublication: 'ext:ResearchPublication',
    ProfessionalCertification: 'ext:ProfessionalCertification',
    LanguageProficiency: 'ext:LanguageProficiency',

    Credential: 'ext:Credential',
    Language: 'ext:Language',
    Upskilling: 'ext:Upskilling',

    // extending ( Learning History ) category
    Class: 'ext:Class',
    Module: 'ext:Module',
    Program: 'ext:Program',
    Study: 'ext:Study',
    Training: 'ext:Training',
    Workshop: 'ext:Workshop',
    Seminar: 'ext:Seminar',
    Webinar: 'ext:Webinar',
    Lecture: 'ext:Lecture',
    Bootcamp: 'ext:Bootcamp',
    StudyGroup: 'ext:StudyGroup',
    TutoringSession: 'ext:TutoringSession',
    Laboratory: 'ext:Laboratory',

    ReportCard: 'ext:ReportCard',
    MicroDegree: 'ext:MicroDegree',

    // extending { Work History } category
    Job: 'ext:Job',
    Club: 'ext:Club',
    Internship: 'ext:Internship',
    Event: 'ext:Event',
    Volunteering: 'ext:Volunteering',
    Freelance: 'ext:Freelance',
    ResearchProject: 'ext:ResearchProject',
    StudyAbroad: 'ext:Study Abroad',
    Apprenticeship: 'ext:Apprenticeship',
    Assistantship: 'ext:Assistantship',
    Conference: 'ext:Conference',
    SportsTeam: 'ext:SportsTeam',
    ArtExhibition: 'ext:ArtExhibition',
    Production: 'ext:Production',

    Volunteer: 'ext:Volunteer',
    Fellowship: 'ext:Fellowship',
    Board: 'ext:Board',

    // extending ( Membership ) category
    Group: 'ext:Group',
    // Project: 'ext:Project', // duplicate
    // Class: 'ext:Class', // duplicate
    School: 'ext:School',
    College: 'ext:College',
    University: 'ext:University',
    Association: 'ext:Association',
    Team: 'ext:Team',
    Workgroup: 'ext:Workgroup',
    Taskforce: 'ext:Taskforce',
    Agency: 'ext:Agency',
    Company: 'ext:Company',
    Organization: 'ext:Organization',
    NGO: 'ext:NGO',
    Legislative: 'ext:Legislative',
    DAO: 'ext:DAO',
    Community: 'ext:Community',
    Movement: 'ext:Movement',
    // Club: 'ext:Club', // duplicate

    // Troops 2.0
    Global: 'ext:GlobalID',
    Network: 'ext:NetworkID',
    Troop: 'ext:TroopID',
    ScoutMember: 'ext:ScoutID',
    // Troops 2.0

    // extending { Accomplishment } category
    Accomplishment: 'ext:Accomplishment',
    Homework: 'ext:Homework',
    Presentation: 'ext:Presentation',
    Content: 'ext:Content',
    Practice: 'ext:Practice',
    Hacks: 'ext:Hacks',
    Ideas: 'ext:Ideas',
    Project: 'ext:Project',
    Thesis: 'ext:Thesis',
    Artwork: 'ext:Artwork',
    Software: 'ext:Software',
    BusinessPlan: 'ext:BusinessPlan',

    // extending { Accommodation } category
    Disability: 'ext:Disability',
    MedicalRecord: 'ext:MedicalRecord',
    PermissionSlip: 'ext:PermissionSlip',
    DietaryRequirements: 'ext:DietaryRequirements',
    AllergyInformation: 'ext:AllergyInformation',
    MobilityAssistance: 'ext:MobilityAssistance',
    ExamAdjustments: 'ext:ExamAdjustments',
    SpecialEquipment: 'ext:SpecialEquipment',
    NoteTakingServices: 'ext:NoteTakingServices',
    SignLanguageInterpreter: 'ext:SignLanguageInterpreter',
    ExtendedDeadline: 'ext:ExtendedDeadline',
    HousingArrangement: 'ext:HousingArrangement',
    TransportationServices: 'ext:TransportationServices',

    // extending { Merit Badge } category
    Archery: 'ext:Archery',
    Astronomy: 'ext:Astronomy',
    Chess: 'ext:Chess',
    DogCare: 'ext:DogCare',
    Engineering: 'ext:Engineering',
    Music: 'ext:Music',
    NuclearScience: 'ext:NuclearScience',
    Programming: 'ext:Programming',
    SpaceExploration: 'ext:SpaceExploration',
    WildernessSurvival: 'ext:WildernessSurvival',

    // extending { Family } category
    Family: 'ext:Family',
};

export const ACHIEVEMENT_CATEGORIES = {
    Achievement: 'Achievement',
    Skill: 'Skill',
    ID: 'ID',
    LearningHistory: 'Learning History',
    WorkHistory: 'Work History',
    SocialBadges: 'Social Badges',
    Membership: 'Membership',
    Achievements: 'Achievements',

    Accomplishment: 'Accomplishment',
    Experiences: 'Experiences',
    Accommodation: 'Accommodation',

    MeritBadges: 'MeritBadges',
    Family: 'Family',
};

export const CATEGORY_TO_TEMPLATE_LIST = {
    [ACHIEVEMENT_CATEGORIES.Achievement]: [
        {
            title: 'Degree',
            type: AchievementTypes.Degree,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.Certificate,
        },
        {
            title: 'Course Completion',
            type: AchievementTypes.CourseCompletion,
        },
        {
            title: 'Attendance',
            type: AchievementTypes.Attendance,
        },
        {
            title: "Dean's List",
            type: AchievementTypes.DeansList,
        },
        {
            title: 'Honors Award',
            type: AchievementTypes.HonorsAward,
        },
        {
            title: 'Research Publication',
            type: AchievementTypes.ResearchPublication,
        },
        {
            title: 'Certification',
            type: AchievementTypes.ProfessionalCertification,
        },
        {
            title: 'Fellowship',
            type: AchievementTypes.Fellowship,
        },
        {
            title: 'Language Proficiency',
            type: AchievementTypes.LanguageProficiency,
        },

        {
            title: 'Generic Achievement',
            type: AchievementTypes.Achievement,
        },
        {
            title: 'Formal Award',
            type: AchievementTypes.Award,
        },
        {
            title: 'Online Badge',
            type: AchievementTypes.Badge,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.ID]: [
        {
            title: 'School ID',
            type: AchievementTypes.SchoolID,
        },
        {
            title: 'Employer ID',
            type: AchievementTypes.EmployerID,
        },
        {
            title: 'College ID',
            type: AchievementTypes.CollegeID,
        },
        {
            title: 'University ID',
            type: AchievementTypes.UniversityID,
        },
        {
            title: 'Association ID',
            type: AchievementTypes.AssociationID,
        },
        {
            title: 'Library Card',
            type: AchievementTypes.LibraryCard,
        },
        {
            title: 'Taskforce ID',
            type: AchievementTypes.TaskforceID,
        },

        {
            title: 'EventID',
            type: AchievementTypes.EventID,
        },

        {
            title: 'License',
            type: AchievementTypes.License,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.Skill]: [
        {
            title: 'Assessment',
            type: AchievementTypes.Assessment,
        },
        {
            title: 'Certification',
            type: AchievementTypes.Certification,
        },
        {
            title: 'Competency',
            type: AchievementTypes.Competency,
        },
        {
            title: 'MicroCredential',
            type: AchievementTypes.MicroCredential,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.LearningHistory]: [
        {
            title: 'Course',
            type: AchievementTypes.Course,
        },
        {
            title: 'Class',
            type: AchievementTypes.Class,
        },
        {
            title: 'Module',
            type: AchievementTypes.Module,
        },
        {
            title: 'Program',
            type: AchievementTypes.Program,
        },
        {
            title: 'Study',
            type: AchievementTypes.Study,
        },
        {
            title: 'Seminar',
            type: AchievementTypes.Seminar,
        },
        {
            title: 'Webinar',
            type: AchievementTypes.Webinar,
        },
        {
            title: 'Lecture',
            type: AchievementTypes.Lecture,
        },
        {
            title: 'Bootcamp',
            type: AchievementTypes.Bootcamp,
        },
        {
            title: 'Study Group',
            type: AchievementTypes.StudyGroup,
        },
        {
            title: 'Tutoring Session',
            type: AchievementTypes.TutoringSession,
        },
        {
            title: 'Laboratory',
            type: AchievementTypes.Laboratory,
        },
        {
            title: 'Fieldwork',
            type: AchievementTypes.Fieldwork,
        },

        {
            title: 'Assignment',
            type: AchievementTypes.Assignment,
        },
        {
            title: 'Associate Degree',
            type: AchievementTypes.AssociateDegree,
        },
        {
            title: 'Bachelor Degree',
            type: AchievementTypes.BachelorDegree,
        },
        {
            title: 'Certificate Of Completion',
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            title: 'Co-Curricular',
            type: AchievementTypes.CoCurricular,
        },
        {
            title: 'Research Doctorate',
            type: AchievementTypes.ResearchDoctorate,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.WorkHistory]: [
        {
            title: 'Job',
            type: AchievementTypes.Job,
        },
        {
            title: 'Club',
            type: AchievementTypes.Club,
        },
        {
            title: 'Internship',
            type: AchievementTypes.Internship,
        },
        {
            title: 'Event',
            type: AchievementTypes.Event,
        },
        {
            title: 'Volunteering',
            type: AchievementTypes.Volunteering,
        },
        {
            title: 'Freelance',
            type: AchievementTypes.Freelance,
        },
        {
            title: 'Research Project',
            type: AchievementTypes.ResearchProject,
        },
        {
            title: 'Study Abroad',
            type: AchievementTypes.StudyAbroad,
        },
        {
            title: 'Apprenticeship',
            type: AchievementTypes.Apprenticeship,
        },
        {
            title: 'Conference',
            type: AchievementTypes.Conference,
        },
        {
            title: 'Sports Team',
            type: AchievementTypes.SportsTeam,
        },
        {
            title: 'Art Exhibition',
            type: AchievementTypes.ArtExhibition,
        },
        {
            title: 'Production',
            type: AchievementTypes.Production,
        },

        {
            title: 'Community Service',
            type: AchievementTypes.CommunityService,
        },
        {
            title: 'Apprenticeship Certificate',
            type: AchievementTypes.ApprenticeshipCertificate,
        },

        {
            title: 'Journeyman Certificate',
            type: AchievementTypes.JourneymanCertificate,
        },
        {
            title: 'Master Certificate',
            type: AchievementTypes.MasterCertificate,
        },
    ],

    [ACHIEVEMENT_CATEGORIES.Accomplishment]: [
        {
            title: 'Homework',
            type: AchievementTypes.Homework,
        },
        {
            title: 'Presentation',
            type: AchievementTypes.Presentation,
        },
        {
            title: 'Content',
            type: AchievementTypes.Content,
        },
        {
            title: 'Practice',
            type: AchievementTypes.Practice,
        },
        {
            title: 'Hacks',
            type: AchievementTypes.Hacks,
        },
        {
            title: 'Ideas',
            type: AchievementTypes.Ideas,
        },
        {
            title: 'Project',
            type: AchievementTypes.Project,
        },
        {
            title: 'Thesis',
            type: AchievementTypes.Thesis,
        },
        {
            title: 'Artwork',
            type: AchievementTypes.Artwork,
        },
        {
            title: 'Software',
            type: AchievementTypes.Software,
        },
        {
            title: 'BusinessPlan',
            type: AchievementTypes.BusinessPlan,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.Accommodation]: [
        {
            title: 'Disability',
            type: AchievementTypes.Disability,
        },
        {
            title: 'Medical Record',
            type: AchievementTypes.MedicalRecord,
        },
        {
            title: 'PermissionSlip',
            type: AchievementTypes.PermissionSlip,
        },
        {
            title: 'DietaryRequirements',
            type: AchievementTypes.DietaryRequirements,
        },
        {
            title: 'Allergy Information',
            type: AchievementTypes.AllergyInformation,
        },
        {
            title: 'Mobility Assistance',
            type: AchievementTypes.MobilityAssistance,
        },
        {
            title: 'Exam Adjustments',
            type: AchievementTypes.ExamAdjustments,
        },
        {
            title: 'Special Equipment',
            type: AchievementTypes.SpecialEquipment,
        },
        {
            title: 'Note-Taking Services',
            type: AchievementTypes.NoteTakingServices,
        },
        {
            title: 'Sign Language',
            type: AchievementTypes.SignLanguageInterpreter,
        },
        {
            title: 'Extended Deadline',
            type: AchievementTypes.ExtendedDeadline,
        },
        {
            title: 'Housing Arrangement',
            type: AchievementTypes.HousingArrangement,
        },
        {
            title: 'Transportation Services',
            type: AchievementTypes.TransportationServices,
        },
    ],
    [ACHIEVEMENT_CATEGORIES.Family]: [
        {
            title: 'Family',
            type: AchievementTypes.Family,
        },
    ],
};

// ! MUST ALIGN WITH { AchievementTypes } above
export const SocialBadgesCategoryTypes = [
    AchievementTypes.Opportunist,
    AchievementTypes.RiskTaker,
    AchievementTypes.CoolCat,
    AchievementTypes.Tastemaker,
    AchievementTypes.Trailblazer,
    AchievementTypes.Influencer,
    AchievementTypes.Connector,
    AchievementTypes.Maven,
    AchievementTypes.Trendsetter,
    AchievementTypes.Organizer,
    AchievementTypes.Moderator,
    AchievementTypes.Leader,
    AchievementTypes.Catalyst,
    AchievementTypes.Expert,
    AchievementTypes.Enthusiast,
    AchievementTypes.Ambassador,
    AchievementTypes.Aficionado,
    AchievementTypes.Psychic,
    AchievementTypes.Magician,
    AchievementTypes.Charmer,
    AchievementTypes.Cowboy,
    AchievementTypes.Perfectionist,
    AchievementTypes.Enabler,
    AchievementTypes.Maverick,
    AchievementTypes.Informer,
    AchievementTypes.Wanderer,
    AchievementTypes.Propagator,
    AchievementTypes.HotShot,
    AchievementTypes.Sage,
    AchievementTypes.ChangeMaker,
    AchievementTypes.Challenger,
    AchievementTypes.TeamPlayer,
    AchievementTypes.Star,
    AchievementTypes.PartyAnimal,
    AchievementTypes.TroubleMaker,
    AchievementTypes.PartyPlanner,
    AchievementTypes.ChallengeMaker,
    AchievementTypes.Promoter,
    AchievementTypes.Doer,
    AchievementTypes.Entertainer,
    AchievementTypes.Connoisseur,

    // ScoutPass official Badges
    AchievementTypes.Adventurer,
    AchievementTypes.Unifier,
    AchievementTypes.Protector,
    AchievementTypes.Jester,
    AchievementTypes.Survivor,
    AchievementTypes.KnotMaster,
    AchievementTypes.ChangeMaker,
    AchievementTypes.Diplomat,
    AchievementTypes.Optimist,
    AchievementTypes.MosquitoMagnet,
    AchievementTypes.Resilient,
    AchievementTypes.Stylist,
    AchievementTypes.Samaritan,
    AchievementTypes.Innovator,
    AchievementTypes.Prankster,
    AchievementTypes.Inspirer,
    AchievementTypes.Organizer,
    AchievementTypes.Supporter,
    AchievementTypes.Rested,
    AchievementTypes.Celebrator,
    AchievementTypes.Trustworthy,
    AchievementTypes.KStar,
    AchievementTypes.Connector,
    AchievementTypes.Polyglot,
    AchievementTypes.Trader,
    AchievementTypes.Bouncy,
    AchievementTypes.FunMaker,
    AchievementTypes.TentMate,
    AchievementTypes.PackMaster,
    AchievementTypes.LaterBird,
    AchievementTypes.Snoozer,
    AchievementTypes.SubHero,
    AchievementTypes.Connoisseur,
    AchievementTypes.SnoreMaster,
    AchievementTypes.Insomniac,
    AchievementTypes.EarlyBird,
    AchievementTypes.Chef,
    AchievementTypes.Griller,
    AchievementTypes.Foodie,
    AchievementTypes.Hydrator,
    AchievementTypes.Rescuer,
    AchievementTypes.ScoutInfluencer,
    AchievementTypes.SnapchatScout,
    AchievementTypes.InstaGuru,
    AchievementTypes.TickTrendSetter,
];

export const MeritBadgesCategoryTypes = [
    AchievementTypes.Archery,
    AchievementTypes.Astronomy,
    AchievementTypes.Chess,
    AchievementTypes.DogCare,
    AchievementTypes.Engineering,
    AchievementTypes.Music,
    AchievementTypes.Nature,
    AchievementTypes.NuclearScience,
    AchievementTypes.Programming,
    AchievementTypes.SpaceExploration,
    AchievementTypes.WildernessSurvival,
];

export const AchievementCategoryTypes = [
    AchievementTypes.Degree,
    AchievementTypes.Certificate,
    AchievementTypes.CourseCompletion,
    AchievementTypes.Attendance,
    AchievementTypes.DeansList,
    AchievementTypes.HonorsAward,
    AchievementTypes.ResearchPublication,
    AchievementTypes.ProfessionalCertification,
    AchievementTypes.Fellowship,
    AchievementTypes.LanguageProficiency,

    AchievementTypes.Achievement,
    AchievementTypes.Award,
    AchievementTypes.Badge,
    AchievementTypes.CommunityService,

    // extended ( Achievement ) category types
    AchievementTypes.Credential,
    AchievementTypes.Language,
    AchievementTypes.Upskilling,
];
export const IdCategoryTypes = [
    AchievementTypes.EmployerID,
    AchievementTypes.SchoolID,
    AchievementTypes.CollegeID,
    AchievementTypes.UniversityID,
    AchievementTypes.ClubID,
    AchievementTypes.AssociationID,
    AchievementTypes.LibraryCard,
    AchievementTypes.TaskforceID,
    AchievementTypes.CommunityOfPracticeID,
    AchievementTypes.EventID,

    AchievementTypes.License,

    // extended ( ID ) category types
    AchievementTypes.StudentID,
    AchievementTypes.MemberID,
    AchievementTypes.MemberNFTID,
    AchievementTypes.DriversLicense,
    AchievementTypes.StateOrNationalID,
    AchievementTypes.Passport,
];
export const SkillCategroyTypes = [
    AchievementTypes.Assessment,
    AchievementTypes.Certification,
    AchievementTypes.Competency,
    AchievementTypes.MicroCredential,
];
export const LearnHistoryCategoryTypes = [
    AchievementTypes.Course,
    AchievementTypes.Class,
    AchievementTypes.Module,
    AchievementTypes.Program,
    AchievementTypes.Study,
    AchievementTypes.Training,
    AchievementTypes.Workshop,
    AchievementTypes.Webinar,
    AchievementTypes.Lecture,
    AchievementTypes.Bootcamp,
    AchievementTypes.StudyGroup,
    AchievementTypes.TutoringSession,
    AchievementTypes.Laboratory,
    AchievementTypes.Fieldwork,

    AchievementTypes.Assignment,
    AchievementTypes.AssociateDegree,
    AchievementTypes.BachelorDegree,
    AchievementTypes.CertificateOfCompletion,
    AchievementTypes.CoCurricular,
    AchievementTypes.ResearchDoctorate,

    // extended ( Learning History ) category types
    AchievementTypes.ReportCard,
    AchievementTypes.MicroDegree,
];
export const WorkHistoryCategoryTypes = [
    AchievementTypes.Job,
    AchievementTypes.Club,
    AchievementTypes.Internship,
    AchievementTypes.Event,
    AchievementTypes.Volunteering,
    AchievementTypes.Freelance,
    AchievementTypes.ResearchProject,
    AchievementTypes.StudyAbroad,
    AchievementTypes.Apprenticeship,
    AchievementTypes.Assistantship,
    AchievementTypes.CommunityService,
    AchievementTypes.Conference,
    AchievementTypes.SportsTeam,
    AchievementTypes.ArtExhibition,
    AchievementTypes.Production,

    // extended ( Work History ) category types
    AchievementTypes.Internship,
    AchievementTypes.Volunteer,
    AchievementTypes.Board,

    AchievementTypes.ApprenticeshipCertificate,
    AchievementTypes.JourneymanCertificate,
    AchievementTypes.MasterCertificate,
];
export const MembershipCategoryTypes = [
    AchievementTypes.Group,
    AchievementTypes.Troop,
    AchievementTypes.School,
    AchievementTypes.College,
    AchievementTypes.University,
    AchievementTypes.Association,
    AchievementTypes.Team,
    AchievementTypes.Workgroup,
    AchievementTypes.Taskforce,
    AchievementTypes.Agency,
    AchievementTypes.Company,
    AchievementTypes.Organization,
    AchievementTypes.NGO,
    AchievementTypes.Legislative,
    AchievementTypes.DAO,
    AchievementTypes.Community,
    AchievementTypes.Movement,
    AchievementTypes.Club,
    AchievementTypes.Network,
];

export const AccomplishmentsCategoryTypes = [
    AchievementTypes.Homework,
    AchievementTypes.Presentation,
    AchievementTypes.Content,
    AchievementTypes.Practice,
    AchievementTypes.Hacks,
    AchievementTypes.Ideas,
    AchievementTypes.Project,
    AchievementTypes.Artwork,
    AchievementTypes.Software,
    AchievementTypes.BusinessPlan,
];
export const AccommodationsCategoryTypes = [
    AchievementTypes.Disability,
    AchievementTypes.MedicalRecord,
    AchievementTypes.PermissionSlip,
    AchievementTypes.DietaryRequirements,
    AchievementTypes.AllergyInformation,
    AchievementTypes.MobilityAssistance,
    AchievementTypes.ExamAdjustments,
    AchievementTypes.SpecialEquipment,
    AchievementTypes.NoteTakingServices,
    AchievementTypes.SignLanguageInterpreter,
    AchievementTypes.ExtendedDeadline,
    AchievementTypes.HousingArrangement,
    AchievementTypes.TransportationServices,
];
export const FamilyCategoryTypes = [AchievementTypes.Family];
