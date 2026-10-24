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
