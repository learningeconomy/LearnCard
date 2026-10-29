export enum BoostCategoryOptionsEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    qualifications = 'Qualifications',
    course = 'Course',
    job = 'Job', // not in CredentialCategory
    id = 'ID',
    workHistory = 'Work History',
    learningHistory = 'Learning History', // -> Courses
    skill = 'Skill',
    membership = 'Membership',

    // LCA specific
    family = 'Family',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',

    // AI
    //  (Not truly boost types, really these are just here for metadata structure purposes)
    aiSummary = 'AI Summary',
    aiTopic = 'AI Topic',
    aiPathway = 'AI Pathway',
    aiInsight = 'AI Insight',
    aiAssessment = 'AI Assessment',

    // general
    all = 'All',

    // Scouts
    meritBadge = 'Merit Badge',
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',

    // obsolete / unused / future
    currency = 'Currency',
    relationship = 'Relationship',
    events = 'Events',
    goals = 'Goals',
    describe = 'Describe',
}

// Used in the actual index for credentials (see: IndexMetadata in learn-card-base/src/types/credentials.ts)
export enum CredentialCategoryEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    qualifications = 'Qualifications',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',
    workHistory = 'Work History',
    resume = 'Resume',
    experience = 'Experience',
    learningHistory = 'Learning History',
    course = 'Course',

    skill = 'Skill',

    events = 'Events',
    family = 'Family',
    relationship = 'Relationship',

    meritBadge = 'Merit Badge',
    troops = 'Membership',

    // troops 2.0 ID categories
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',

    // AI
    aiSummary = 'AI Summary',
    aiTopic = 'AI Topic',
    aiPathway = 'AI Pathway',
    aiInsight = 'AI Insight',
    aiAssessment = 'AI Assessment',

    goals = 'Goals',
    professionalTitle = 'Professional Title',
    roleExperience = 'Role Experience',
    workExperience = 'Work Experience',
    payRate = 'Pay Rate',
    workLifeBalance = 'Work Life Balance',
    jobStability = 'Job Stability',
    selfAssignedSkills = 'Self-Assigned Skills',

    verifiableData = 'VerifiableData',

    // todo
    membership = 'Membership',

    // deprecated
    id = 'ID',
    currency = 'Currency',
}
