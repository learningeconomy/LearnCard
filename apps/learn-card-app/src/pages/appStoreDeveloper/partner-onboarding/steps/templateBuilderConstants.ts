/**
 * Constants for TemplateBuilderStep
 * Extracted for better code splitting and maintainability
 */

export const TEMPLATE_META_VERSION = '2.0.0';

// Default fields for new templates
export const DEFAULT_FIELDS = [
    { id: 'recipient_name', name: 'Recipient Name', type: 'text' as const, required: true, variableName: 'recipient_name' },
    { id: 'issue_date', name: 'Issue Date', type: 'date' as const, required: true, variableName: 'issue_date' },
];

// Comprehensive OBv3 field options for mapping CSV columns
// Based on Open Badges v3 JSON-LD context: https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json
export const CATALOG_FIELD_OPTIONS = [
    // Skip option
    { id: 'skip', label: '— Skip this column —', description: 'Do not include in credential', group: 'skip' },

    // Credential-level fields
    { id: 'credential.name', label: 'Credential Name', description: 'Display name of the credential', group: 'credential', required: true },
    { id: 'credential.description', label: 'Credential Description', description: 'Description of the credential', group: 'credential' },
    { id: 'credential.image', label: 'Credential Image', description: 'URL to credential image', group: 'credential' },
    { id: 'credential.inLanguage', label: 'Language', description: 'Language of the credential (e.g., en, es)', group: 'credential' },

    // Achievement fields
    { id: 'achievement.name', label: 'Name', description: 'Name of the achievement', group: 'achievement', required: true },
    { id: 'achievement.description', label: 'Description', description: 'Description of the achievement', group: 'achievement' },
    { id: 'achievement.image', label: 'Image', description: 'URL to achievement badge image', group: 'achievement' },
    { id: 'achievement.achievementType', label: 'Type', description: 'Type: Course, Badge, Certificate, etc.', group: 'achievement' },
    { id: 'achievement.id', label: 'ID/URL', description: 'Unique identifier/URL for the achievement', group: 'achievement' },
    { id: 'achievement.humanCode', label: 'Human Code', description: 'Human-readable code (e.g., CS101)', group: 'achievement' },
    { id: 'achievement.fieldOfStudy', label: 'Field of Study', description: 'Field of study or discipline', group: 'achievement' },
    { id: 'achievement.specialization', label: 'Specialization', description: 'Area of specialization', group: 'achievement' },
    { id: 'achievement.creditsAvailable', label: 'Credits Available', description: 'Number of credits available', group: 'achievement' },
    { id: 'achievement.tag', label: 'Tags/Keywords', description: 'Keywords or tags for the achievement', group: 'achievement' },
    { id: 'achievement.version', label: 'Version', description: 'Version of the achievement', group: 'achievement' },
    { id: 'achievement.inLanguage', label: 'Language', description: 'Language of the achievement', group: 'achievement' },
    { id: 'achievement.criteria.narrative', label: 'Criteria (Narrative)', description: 'Criteria for earning this achievement', group: 'achievement' },

    // Achievement Subject fields (recipient-related but can be static)
    { id: 'subject.creditsEarned', label: 'Credits Earned', description: 'Number of credits earned by recipient', group: 'subject' },
    { id: 'subject.activityStartDate', label: 'Activity Start Date', description: 'When the activity started', group: 'subject' },
    { id: 'subject.activityEndDate', label: 'Activity End Date', description: 'When the activity ended', group: 'subject' },
    { id: 'subject.licenseNumber', label: 'License Number', description: 'License or certificate number', group: 'subject' },
    { id: 'subject.role', label: 'Role', description: 'Role of the recipient in the activity', group: 'subject' },
    { id: 'subject.term', label: 'Term', description: 'Academic term (e.g., Fall 2024)', group: 'subject' },

    // Alignment fields (for mapping to frameworks/standards)
    { id: 'alignment.targetName', label: 'Name', description: 'Name of aligned competency/standard', group: 'alignment' },
    { id: 'alignment.targetUrl', label: 'URL', description: 'URL to the aligned standard', group: 'alignment' },
    { id: 'alignment.targetDescription', label: 'Description', description: 'Description of the alignment', group: 'alignment' },
    { id: 'alignment.targetFramework', label: 'Framework', description: 'Name of the framework (e.g., CASE)', group: 'alignment' },
    { id: 'alignment.targetCode', label: 'Code', description: 'Code within the framework', group: 'alignment' },
    { id: 'alignment.targetType', label: 'Type', description: 'Type of alignment target', group: 'alignment' },

    // Evidence fields
    { id: 'evidence.name', label: 'Name', description: 'Name/title of evidence', group: 'evidence' },
    { id: 'evidence.description', label: 'Description', description: 'Description of the evidence', group: 'evidence' },
    { id: 'evidence.narrative', label: 'Narrative', description: 'Narrative about the evidence', group: 'evidence' },
    { id: 'evidence.genre', label: 'Genre', description: 'Type/genre of evidence', group: 'evidence' },
    { id: 'evidence.audience', label: 'Audience', description: 'Intended audience', group: 'evidence' },

    // Result fields (for scores, grades, etc.)
    { id: 'result.value', label: 'Value', description: 'Score, grade, or result value', group: 'result' },
    { id: 'result.status', label: 'Status', description: 'Result status (Completed, Passed, Failed)', group: 'result' },
    { id: 'result.achievedLevel', label: 'Achieved Level', description: 'Level achieved (URL to rubric level)', group: 'result' },

    // Related achievement
    { id: 'related.id', label: 'Related: ID/URL', description: 'URL of a related achievement', group: 'related' },
    { id: 'related.version', label: 'Related: Version', description: 'Version of the related achievement', group: 'related' },
    { id: 'related.inLanguage', label: 'Related: Language', description: 'Language of the related achievement', group: 'related' },
] as const;

// Group labels for the dropdown
export const FIELD_GROUPS: Record<string, string> = {
    skip: '',
    credential: 'Credential',
    achievement: 'Achievement',
    subject: 'Recipient/Subject',
    alignment: 'Alignment (Standards)',
    evidence: 'Evidence',
    result: 'Result',
    related: 'Related Achievement',
};

// Issuance-level fields - distinguished by type:
// - 'dynamic': Mustache variable that user provides at issuance time
// - 'system': Auto-injected by the system (recipient DID, etc.)
export const ISSUANCE_FIELDS = [
    { id: 'recipient_name', label: 'Recipient Name', description: 'Name of the credential recipient', type: 'dynamic' as const, required: true, defaultIncluded: true },
    { id: 'recipient_email', label: 'Recipient Email', description: 'Email for sending the credential (used for delivery, not in credential)', type: 'system' as const, required: true, defaultIncluded: true },
    { id: 'recipient_did', label: 'Recipient DID', description: 'Auto-injected recipient identifier', type: 'system' as const, required: false, defaultIncluded: true },
    { id: 'issue_date', label: 'Issue Date', description: 'Auto-set when credential is issued', type: 'system' as const, required: false, defaultIncluded: true },
    { id: 'completion_date', label: 'Completion Date', description: 'When the course was completed', type: 'dynamic' as const, required: false, defaultIncluded: false },
    { id: 'score', label: 'Score/Grade', description: 'Score or grade achieved', type: 'dynamic' as const, required: false, defaultIncluded: false },
    { id: 'expiration_date', label: 'Expiration Date', description: 'When the credential expires', type: 'dynamic' as const, required: false, defaultIncluded: false },
] as const;

// Pre-computed map for quick lookup
export const ISSUANCE_FIELD_MAP = ISSUANCE_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.id]: f }),
    {} as Record<string, typeof ISSUANCE_FIELDS[number]>
);

// Smart mapping suggestions for catalog columns (baked into each boost)
export const suggestCatalogFieldMapping = (columnName: string): string => {
    const lower = columnName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Course name / title → Achievement Name
    if (lower.includes('coursename') || lower.includes('title') || (lower.includes('name') && !lower.includes('student') && !lower.includes('instructor') && !lower.includes('framework'))) {
        return 'achievement.name';
    }

    // Description
    if (lower.includes('description') || lower.includes('desc') || lower.includes('summary') || lower.includes('overview')) {
        return 'achievement.description';
    }

    // Achievement type
    if (lower.includes('type') && (lower.includes('achievement') || lower.includes('credential') || lower.includes('badge'))) {
        return 'achievement.achievementType';
    }

    // Criteria
    if (lower.includes('criteria') || lower.includes('requirement') || lower.includes('objective') || lower.includes('learning outcome')) {
        return 'achievement.criteria.narrative';
    }

    // Image/Badge
    if (lower.includes('image') || lower.includes('badge') || lower.includes('icon') || lower.includes('logo')) {
        return 'achievement.image';
    }

    // Alignment fields
    if (lower.includes('standard') || lower.includes('competency') || lower.includes('skill') && !lower.includes('name')) {
        return 'alignment.targetName';
    }

    if (lower.includes('framework') && lower.includes('name')) {
        return 'alignment.targetFramework';
    }

    if (lower.includes('framework') && (lower.includes('url') || lower.includes('link'))) {
        return 'alignment.targetUrl';
    }

    if (lower.includes('frameworkcode') || (lower.includes('code') && lower.includes('standard'))) {
        return 'alignment.targetCode';
    }

    // Evidence
    if (lower.includes('evidence') && lower.includes('name')) {
        return 'evidence.name';
    }

    if (lower.includes('evidence') && lower.includes('desc')) {
        return 'evidence.description';
    }

    // Result/Score
    if (lower.includes('score') || lower.includes('grade') || lower.includes('result') || lower.includes('mark')) {
        return 'result.value';
    }

    if (lower.includes('pass') || lower.includes('fail') || lower.includes('status')) {
        return 'result.status';
    }

    // Course ID → Achievement ID
    if (lower.includes('courseid') || lower.includes('badgeid') || lower.includes('credentialid')) {
        return 'achievement.id';
    }

    // Skip fields that are clearly issuance-level or not useful
    if (lower.includes('student') || lower.includes('email') || lower.includes('enrolled') || 
        lower.includes('capacity') || lower.includes('room') || lower.includes('schedule') ||
        lower.includes('seat') || lower.includes('available') || lower.includes('prerequisite') ||
        lower.includes('instructor') || lower.includes('teacher') || lower.includes('professor')) {
        return 'skip';
    }

    // Default to skip for unmapped columns (no custom extensions)
    return 'skip';
};
