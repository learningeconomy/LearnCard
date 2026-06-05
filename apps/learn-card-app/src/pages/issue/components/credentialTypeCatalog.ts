import type React from 'react';
import {
    Award,
    ScrollText,
    GraduationCap,
    Sparkles,
    Shield,
    Users,
    Zap,
    BadgeCheck,
    Heart,
    HandHeart,
    ClipboardCheck,
    PencilRuler,
    Microscope,
    Briefcase,
    BookOpen,
    Stamp,
    Trophy,
    School,
    Hammer,
    FileBadge,
} from 'lucide-react';

import type { SimpleCredentialType } from '../../../components/simple-send/simpleSend.helpers';

export type CredentialFamily =
    | 'recognition'
    | 'learning'
    | 'degrees'
    | 'professional'
    | 'belonging';

export type ActivityField =
    | 'completionDate'
    | 'startDate'
    | 'score'
    | 'creditsEarned'
    | 'creditHours'
    | 'licenseNumber'
    | 'expiryDate'
    | 'memberId'
    | 'role'
    | 'term';

export interface CredentialTypeEntry {
    obv3Type: string;
    label: string;
    Icon: React.FC<{ className?: string }>;
    family: CredentialFamily;
    pickWhen: string;
    baseSimpleType: SimpleCredentialType;
    activityFields: ActivityField[];
    common?: boolean;
}

export interface CredentialFamilyMeta {
    id: CredentialFamily;
    label: string;
    blurb: string;
}

export const CREDENTIAL_FAMILIES: CredentialFamilyMeta[] = [
    {
        id: 'recognition',
        label: 'Recognition',
        blurb: 'Honor an accomplishment, contribution, or moment.',
    },
    {
        id: 'learning',
        label: 'Learning',
        blurb: 'Someone completed a course, program, or skill.',
    },
    {
        id: 'degrees',
        label: 'Degrees & Diplomas',
        blurb: 'A formal academic degree or diploma.',
    },
    {
        id: 'professional',
        label: 'Professional',
        blurb: 'Licensure, certification, or a trade credential.',
    },
    {
        id: 'belonging',
        label: 'Belonging',
        blurb: 'Membership in an organization or program.',
    },
];

export const CREDENTIAL_TYPES: CredentialTypeEntry[] = [
    {
        obv3Type: 'Badge',
        label: 'Badge',
        Icon: Award,
        family: 'recognition',
        pickWhen: 'A digital badge for an achievement or skill.',
        baseSimpleType: 'badge',
        activityFields: [],
        common: true,
    },
    {
        obv3Type: 'Certificate',
        label: 'Certificate',
        Icon: ScrollText,
        family: 'professional',
        pickWhen: 'A formal certificate recognizing an achievement.',
        baseSimpleType: 'certificate',
        activityFields: ['expiryDate'],
        common: true,
    },
    {
        obv3Type: 'Course',
        label: 'Course',
        Icon: GraduationCap,
        family: 'learning',
        pickWhen: 'Someone completed a course or training.',
        baseSimpleType: 'course',
        activityFields: ['completionDate', 'score'],
        common: true,
    },
    {
        obv3Type: 'Competency',
        label: 'Skill',
        Icon: Sparkles,
        family: 'learning',
        pickWhen: 'Verify a specific skill or competency.',
        baseSimpleType: 'skill',
        activityFields: ['score'],
        common: true,
    },
    {
        obv3Type: 'License',
        label: 'License',
        Icon: Shield,
        family: 'professional',
        pickWhen: 'A professional or occupational license.',
        baseSimpleType: 'license',
        activityFields: ['licenseNumber', 'expiryDate'],
        common: true,
    },
    {
        obv3Type: 'Membership',
        label: 'Membership',
        Icon: Users,
        family: 'belonging',
        pickWhen: 'Membership in an organization or program.',
        baseSimpleType: 'membership',
        activityFields: ['memberId', 'role'],
        common: true,
    },
    {
        obv3Type: 'MicroCredential',
        label: 'Micro-Credential',
        Icon: Zap,
        family: 'learning',
        pickWhen: 'Short-form recognition for focused learning.',
        baseSimpleType: 'micro-credential',
        activityFields: ['creditHours'],
        common: true,
    },

    {
        obv3Type: 'Achievement',
        label: 'Achievement',
        Icon: Trophy,
        family: 'recognition',
        pickWhen: 'A general accomplishment that fits no other type.',
        baseSimpleType: 'badge',
        activityFields: [],
    },
    {
        obv3Type: 'Award',
        label: 'Award',
        Icon: Trophy,
        family: 'recognition',
        pickWhen: 'An honor or prize given for excellence.',
        baseSimpleType: 'badge',
        activityFields: [],
    },
    {
        obv3Type: 'CommunityService',
        label: 'Community Service',
        Icon: HandHeart,
        family: 'recognition',
        pickWhen: 'Recognize volunteer or community work.',
        baseSimpleType: 'badge',
        activityFields: ['startDate', 'completionDate'],
    },
    {
        obv3Type: 'CoCurricular',
        label: 'Co-Curricular',
        Icon: Heart,
        family: 'recognition',
        pickWhen: 'Activity alongside formal study (clubs, sports).',
        baseSimpleType: 'badge',
        activityFields: ['startDate', 'completionDate'],
    },

    {
        obv3Type: 'CertificateOfCompletion',
        label: 'Certificate of Completion',
        Icon: FileBadge,
        family: 'learning',
        pickWhen: 'Confirms someone finished a program.',
        baseSimpleType: 'course',
        activityFields: ['completionDate'],
    },
    {
        obv3Type: 'LearningProgram',
        label: 'Learning Program',
        Icon: BookOpen,
        family: 'learning',
        pickWhen: 'A structured multi-part learning program.',
        baseSimpleType: 'course',
        activityFields: ['startDate', 'completionDate', 'creditsEarned'],
    },
    {
        obv3Type: 'Assessment',
        label: 'Assessment',
        Icon: ClipboardCheck,
        family: 'learning',
        pickWhen: 'Results of a test or evaluation.',
        baseSimpleType: 'course',
        activityFields: ['completionDate', 'score'],
    },
    {
        obv3Type: 'Assignment',
        label: 'Assignment',
        Icon: PencilRuler,
        family: 'learning',
        pickWhen: 'A completed piece of coursework.',
        baseSimpleType: 'course',
        activityFields: ['completionDate', 'score'],
    },
    {
        obv3Type: 'Fieldwork',
        label: 'Fieldwork',
        Icon: Microscope,
        family: 'learning',
        pickWhen: 'Hands-on practical or field experience.',
        baseSimpleType: 'course',
        activityFields: ['startDate', 'completionDate'],
    },

    {
        obv3Type: 'Degree',
        label: 'Degree',
        Icon: School,
        family: 'degrees',
        pickWhen: 'A general academic degree.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'creditsEarned', 'term'],
    },
    {
        obv3Type: 'AssociateDegree',
        label: 'Associate Degree',
        Icon: School,
        family: 'degrees',
        pickWhen: 'A two-year associate degree.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'creditsEarned', 'term'],
    },
    {
        obv3Type: 'BachelorDegree',
        label: "Bachelor's Degree",
        Icon: School,
        family: 'degrees',
        pickWhen: 'A four-year undergraduate degree.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'creditsEarned', 'term'],
    },
    {
        obv3Type: 'MasterDegree',
        label: "Master's Degree",
        Icon: School,
        family: 'degrees',
        pickWhen: 'A graduate-level master’s degree.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'creditsEarned', 'term'],
    },
    {
        obv3Type: 'DoctoralDegree',
        label: 'Doctoral Degree',
        Icon: School,
        family: 'degrees',
        pickWhen: 'A doctoral degree (PhD or equivalent).',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'term'],
    },
    {
        obv3Type: 'ResearchDoctorate',
        label: 'Research Doctorate',
        Icon: School,
        family: 'degrees',
        pickWhen: 'A research-focused doctorate.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'term'],
    },
    {
        obv3Type: 'ProfessionalDoctorate',
        label: 'Professional Doctorate',
        Icon: School,
        family: 'degrees',
        pickWhen: 'A practice-oriented doctorate.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate', 'term'],
    },
    {
        obv3Type: 'Diploma',
        label: 'Diploma',
        Icon: ScrollText,
        family: 'degrees',
        pickWhen: 'A diploma for completed study.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate'],
    },
    {
        obv3Type: 'SecondarySchoolDiploma',
        label: 'High School Diploma',
        Icon: ScrollText,
        family: 'degrees',
        pickWhen: 'A secondary / high-school diploma.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate'],
    },
    {
        obv3Type: 'GeneralEducationDevelopment',
        label: 'GED',
        Icon: ScrollText,
        family: 'degrees',
        pickWhen: 'A high-school equivalency (GED).',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate'],
    },

    {
        obv3Type: 'Certification',
        label: 'Certification',
        Icon: BadgeCheck,
        family: 'professional',
        pickWhen: 'An industry or professional certification.',
        baseSimpleType: 'certificate',
        activityFields: ['expiryDate'],
    },
    {
        obv3Type: 'ApprenticeshipCertificate',
        label: 'Apprenticeship',
        Icon: Hammer,
        family: 'professional',
        pickWhen: 'Completion of an apprenticeship.',
        baseSimpleType: 'certificate',
        activityFields: ['startDate', 'completionDate'],
    },
    {
        obv3Type: 'JourneymanCertificate',
        label: 'Journeyman',
        Icon: Hammer,
        family: 'professional',
        pickWhen: 'A journeyman-level trade credential.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate'],
    },
    {
        obv3Type: 'MasterCertificate',
        label: 'Master Certificate',
        Icon: Stamp,
        family: 'professional',
        pickWhen: 'A master-level trade credential.',
        baseSimpleType: 'certificate',
        activityFields: ['completionDate'],
    },
    {
        obv3Type: 'QualityAssuranceCredential',
        label: 'Quality Assurance',
        Icon: Briefcase,
        family: 'professional',
        pickWhen: 'A quality-assurance or compliance credential.',
        baseSimpleType: 'certificate',
        activityFields: ['expiryDate'],
    },
];

export const COMMON_TYPES = CREDENTIAL_TYPES.filter(t => t.common);

export const getTypeByObv3 = (obv3Type: string): CredentialTypeEntry | undefined =>
    CREDENTIAL_TYPES.find(t => t.obv3Type === obv3Type);

export const getTypesForFamily = (family: CredentialFamily): CredentialTypeEntry[] =>
    CREDENTIAL_TYPES.filter(t => t.family === family);
