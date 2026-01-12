import {
    UnsignedVC,
    VC,
    KnownAchievementType,
    AchievementCredentialValidator,
    UnsignedAchievementCredentialValidator,
    Image,
    Boost,
    Profile,
} from '@learncard/types';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { SortedCredentials } from 'learn-card-base/stores/selectedCredsStore';
import { SyncCredentialsVCs } from 'learn-card-base/stores/syncSchoolStore';
import { walletStore } from 'learn-card-base/stores/walletStore';
import {
    EntryVC,
    CourseMetaVC,
    CredentialCategory,
    IndexMetadata,
} from 'learn-card-base/types/credentials';
import { getSeason } from './dateHelpers';
import {
    getAchievementTypeFromCustomType,
    getCategoryTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
} from './boostCustomTypeHelpers';
import { CATEGORY_TO_SUBCATEGORY_LIST } from 'learn-card-base/components/boost/boostOptions/boostOptions';
import { LCN_DID_WEB_REGEX } from 'learn-card-base/constants/regexes';
import {
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
    boostCategoryMetadata,
} from 'learn-card-base';
import { VerifierState } from '@learncard/react';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { VERIFIER_STATES } from '@learncard/react';
import { BoostCMSMediaAttachment, BoostEvidenceSpec } from 'learn-card-base/components/boost/boost';
import { getVideoMetadata } from './video.helpers';
import { getFileMetadata } from './attachment.helpers';

type CredentialType = 'MovieTicketCredential' | 'AlumniCredential' | 'PermanentResidentCard';

type KnownCredentialType = KnownAchievementType | CredentialType;

const CREDENTIAL_TYPES = {
    MOVIE_TICKET: 'MovieTicketCredential',
    ALUMNI_OF: 'AlumniCredential',
    PERM_RESIDENT: 'PermanentResidentCard',
    CERTIFIED_BOOST: 'CertifiedBoostCredential',
    LEGACY_CRED: 'LegacyOpenBadgeCredential',
};

const CREDENTIAL_CONTEXTS = {
    ALUMNI_OF: 'https://playground.chapi.io/examples/alumni/alumni-v1.json',
    PERM_RESIDENT: 'https://w3id.org/citizenship/v1',
    MOVIE_TICKET: 'https://playground.chapi.io/examples/movieTicket/ticket-v1.json',
};

const otherCredentialTypes = [
    CREDENTIAL_TYPES.MOVIE_TICKET,
    CREDENTIAL_TYPES.ALUMNI_OF,
    CREDENTIAL_TYPES.PERM_RESIDENT,
];

// obv3 achievementType spec -> https://1edtech.github.io/openbadges-specification/ob_v3p0.html#achievementtype-enumeration
// The type of achievement, for example 'Award' or 'Certification'.
// This is an extensible enumerated vocabulary. Extending the vocabulary makes use of a naming convention
// ! MUST ALIGN WITH -> learn-card-base/src/components/issueVC -> constants.ts -> { AchievementTypes }
const CATEGORY_MAP: Record<
    KnownCredentialType | 'Student Buckcard' | `ext:${string}`,
    CredentialCategory
> = {
    Achievement: 'Achievement',
    Award: 'Achievement',
    Badge: 'Achievement',
    CommunityService: 'Achievement',
    MovieTicketCredential: 'Achievement',

    // extending ( Achievement ) category
    Degree: 'Achievement',
    Certificate: 'Achievement',
    'ext:CourseCompletion': 'Achievement',
    'ext:Attendance': 'Achievement',
    'ext:DeansList': 'Achievement',
    'ext:HonorsAward': 'Achievement',
    'ext:Research Publication': 'Achievement',
    'ext:ProfessionalCertification': 'Achievement',
    'ext:Fellowship': 'Achievement',
    'ext:LanguageProficiency': 'Achievement',

    'ext:Credential': 'Achievement',
    'ext:Language': 'Achievement',
    'ext:Upskilling': 'Achievement',

    License: 'ID',
    Membership: 'Membership',
    'Student Buckcard': 'ID',
    PermanentResidentCard: 'ID',
    AlumniCredential: 'ID',

    // extending ( ID ) category

    'ext:EmployerID': 'ID',
    'ext:SchoolID': 'ID',
    'ext:CollegeID': 'ID',
    'ext:UniversityID': 'ID',
    'ext:ClubID': 'ID',
    'ext:AssociationID': 'ID',
    'ext:LibraryCard': 'ID',
    'ext:TaskforceID': 'ID',
    'ext:CommunityOfPracticeID': 'ID',
    'ext:EventID': 'ID',

    'ext:StudentID': 'ID',
    'ext:MemberID': 'ID',
    'ext:MemberNFTID': 'ID',
    'ext:DriversLicense': 'ID',
    'ext:StateOrNationalID': 'ID',
    'ext:Passport': 'ID',

    ApprenticeshipCertificate: 'Work History',
    JourneymanCertificate: 'Work History',
    MasterCertificate: 'Work History',

    // extending { Work History } category
    'ext:Job': 'Work History',
    'ext:Club': 'Work History',
    'ext:Internship': 'Work History',
    'ext:Event': 'Work History',
    'ext:Volunteering': 'Work History',
    'ext:Freelance': 'Work History',
    'ext:ResearchProject': 'Work History',
    'ext:Study Abroad': 'Work History',
    'ext:Apprenticeship': 'Work History',
    'ext:Assistantship': 'Work History',
    'ext:Conference': 'Work History',
    'ext:SportsTeam': 'Work History',
    'ext:ArtExhibition': 'Work History',
    'ext:Production': 'Work History',

    'ext:Volunteer': 'Work History',
    'ext:Board': 'Work History',

    Assignment: 'Learning History',
    AssociateDegree: 'Learning History',
    BachelorDegree: 'Learning History',
    CertificateOfCompletion: 'Learning History',
    Course: 'Learning History',
    CoCurricular: 'Learning History',
    Diploma: 'Learning History',
    DoctoralDegree: 'Learning History',
    GeneralEducationDevelopment: 'Learning History',
    LearningProgram: 'Learning History',

    // extending ( Learning History ) category
    'ext:Class': 'Learning History',
    'ext:Module': 'Learning History',
    'ext:Program': 'Learning History',
    'ext:Study': 'Learning History',
    'ext:Training': 'Learning History',
    'ext:ReportCard': 'Learning History',
    'ext:MicroDegree': 'Learning History',
    'ext:Workshop': 'Learning History',
    'ext:Seminar': 'Learning History',
    'ext:Webinar': 'Learning History',
    'ext:Lecture': 'Learning History',
    'ext:Bootcamp': 'Learning History',
    'ext:StudyGroup': 'Learning History',
    'ext:TutoringSession': 'Learning History',
    'ext:Laboratory': 'Learning History',
    Fieldwork: 'Learning History',

    Competency: 'Achievement',
    Assessment: 'Achievement',
    Certification: 'Achievement',
    MicroCredential: 'Achievement',

    MasterDegree: 'Learning History',
    ProfessionalDoctorate: 'Learning History',
    QualityAssuranceCredential: 'Learning History',
    ResearchDoctorate: 'Learning History',
    SecondarySchoolDiploma: 'Learning History',

    // extending ( Social Badge ) category
    'ext:Opportunist': 'Social Badge',
    'ext:Risktaker': 'Social Badge',
    'ext:CoolCat': 'Social Badge',
    'ext:Tastemaker': 'Social Badge',
    'ext:Trailblazer': 'Social Badge',
    'ext:Influencer': 'Social Badge',
    'ext:Connector': 'Social Badge',
    'ext:Maven': 'Social Badge',
    'ext:Trendsetter': 'Social Badge',
    'ext:Organizer': 'Social Badge',
    'ext:Moderator': 'Social Badge',
    'ext:Leader': 'Social Badge',
    'ext:Catalyst': 'Social Badge',
    'ext:Expert': 'Social Badge',
    'ext:Enthusiast': 'Social Badge',
    'ext:Ambassador': 'Social Badge',
    'ext:Aficionado': 'Social Badge',
    'ext:Psychic': 'Social Badge',
    'ext:Magician': 'Social Badge',
    'ext:Charmer': 'Social Badge',
    'ext:Cowboy': 'Social Badge',
    'ext:Perfectionist': 'Social Badge',
    'ext:Enabler': 'Social Badge',
    'ext:Maverick': 'Social Badge',
    'ext:Informer': 'Social Badge',
    'ext:Wanderer': 'Social Badge',
    'ext:Propagator': 'Social Badge',
    'ext:HotShot': 'Social Badge',
    'ext:Sage': 'Social Badge',
    'ext:ChangeMaker': 'Social Badge',
    'ext:Challenger': 'Social Badge',
    'ext:TeamPlayer': 'Social Badge',
    'ext:Star': 'Social Badge',
    'ext:PartyAnimal': 'Social Badge',
    'ext:TroubleMaker': 'Social Badge',
    'ext:PartyPlanner': 'Social Badge',
    'ext:ChallengeMaker': 'Social Badge',
    'ext:Promoter': 'Social Badge',
    'ext:Doer': 'Social Badge',
    'ext:Entertainer': 'Social Badge',
    'ext:Connoisseur': 'Social Badge',

    // ScoutPass official Badges
    'ext:Adventurer': 'Social Badge',
    'ext:Unifier': 'Social Badge',
    'ext:Protector': 'Social Badge',
    'ext:Jester': 'Social Badge',
    'ext:Survivor': 'Social Badge',
    'ext:KnotMaster': 'Social Badge',
    // 'ext:ChangeMaker': 'Social Badge', // duplicate
    'ext:Diplomat': 'Social Badge',
    'ext:Optimist': 'Social Badge',
    'ext:MosquitoMagnet': 'Social Badge',
    'ext:Resilient': 'Social Badge',
    'ext:Stylist': 'Social Badge',
    'ext:Samaritan': 'Social Badge',
    'ext:Innovator': 'Social Badge',
    'ext:Prankster': 'Social Badge',
    'ext:Inspirer': 'Social Badge',
    // 'ext:Organizer': 'Social Badge', // duplicate
    'ext:Supporter': 'Social Badge',
    'ext:Rested': 'Social Badge',
    'ext:Celebrator': 'Social Badge',
    'ext:Trustworthy': 'Social Badge',
    'ext:KStar': 'Social Badge',
    // 'ext:Connector': 'Social Badge', // duplicate
    'ext:Polyglot': 'Social Badge',
    'ext:Trader': 'Social Badge',
    'ext:Bouncy': 'Social Badge', // ! deprecated
    'ext:FunMaker': 'Social Badge',
    'ext:TentMate': 'Social Badge',
    'ext:PackMaster': 'Social Badge',
    'ext:LaterBird': 'Social Badge',
    'ext:Snoozer': 'Social Badge',
    'ext:SubHero': 'Social Badge',
    // 'ext:Connoisseur': 'Social Badge', // duplicate
    'ext:SnoreMaster': 'Social Badge',
    'ext:Insomniac': 'Social Badge',
    'ext:EarlyBird': 'Social Badge',
    'ext:Chef': 'Social Badge',
    'ext:Griller': 'Social Badge',
    'ext:Foodie': 'Social Badge',
    'ext:Hydrator': 'Social Badge',
    'ext:Rescuer': 'Social Badge',
    'ext:ScoutInfluencer': 'Social Badge',
    'ext:SnapchatScout': 'Social Badge',
    'ext:InstaGuru': 'Social Badge',
    'ext:TickTrendSetter': 'Social Badge',

    // extending ( Social Badge ) category
    'ext:Group': 'Membership',
    // 'ext:Project': 'Membership', // duplicate
    // 'ext:Class': 'Membership', // duplicate
    'ext:School': 'Membership',
    'ext:College': 'Membership',
    'ext:University': 'Membership',
    'ext:Association': 'Membership',
    'ext:Team': 'Membership',
    'ext:Workgroup': 'Membership',
    'ext:Taskforce': 'Membership',
    'ext:Agency': 'Membership',
    'ext:Company': 'Membership',
    'ext:Organization': 'Membership',
    'ext:NGO': 'Membership',
    'ext:Legislative': 'Membership',
    'ext:DAO': 'Membership',
    'ext:Community': 'Membership',
    'ext:Movement': 'Membership',
    // 'ext:Club': 'Membership', // duplicate

    // troops 2.0 ID categories
    'ext:GlobalID': 'Global Admin ID',
    'ext:NetworkID': 'National Network Admin ID',
    'ext:TroopID': 'Troop Leader ID',
    'ext:ScoutID': 'Scout ID',
    // troops 2.0 ID categories

    // extending ( Accomplishment ) category
    'ext:Homework': 'Accomplishment',
    'ext:Presentation': 'Accomplishment',
    'ext:Content': 'Accomplishment',
    'ext:Practice': 'Accomplishment',
    'ext:Hacks': 'Accomplishment',
    'ext:Ideas': 'Accomplishment',
    'ext:Project': 'Accomplishment',
    'ext:Thesis': 'Accomplishment',
    'ext:Artwork': 'Accomplishment',
    'ext:Software': 'Accomplishment',
    'ext:BusinessPlan': 'Accomplishment',

    // extending ( Accommodation ) category
    'ext:Disability': 'Accommodation',
    'ext:MedicalRecord': 'Accommodation',
    'ext:PermissionSlip': 'Accommodation',
    'ext:DietaryRequirements': 'Accommodation',
    'ext:AllergyInformation': 'Accommodation',
    'ext:MobilityAssistance': 'Accommodation',
    'ext:ExamAdjustments': 'Accommodation',
    'ext:SpecialEquipment': 'Accommodation',
    'ext:NoteTakingServices': 'Accommodation',
    'ext:SignLanguageInterpreter': 'Accommodation',
    'ext:ExtendedDeadline': 'Accommodation',
    'ext:HousingArrangement': 'Accommodation',
    'ext:TransportationServices': 'Accommodation',

    // extending { Merit Badges } category
    'ext:Archery': 'Merit Badge',
    'ext:Astronomy': 'Merit Badge',
    'ext:Chess': 'Merit Badge',
    'ext:DogCare': 'Merit Badge',
    'ext:Engineering': 'Merit Badge',
    'ext:Music': 'Merit Badge',
    'ext:NuclearScience': 'Merit Badge',
    'ext:Programming': 'Merit Badge',
    'ext:SpaceExploration': 'Merit Badge',
    'ext:WildernessSurvival': 'Merit Badge',

    'ext:Family': 'Family',
};

// unwrapBoost helper returns inner vc of boost or if normal vc returns vc
export const unwrapBoostCredential = (vc?: VC | UnsignedVC) => {
    if (vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential) {
        return vc.boostCredential;
    } else {
        return vc;
    }
};

export const isBoostCredential = (vc: VC | UnsignedVC) => {
    if (vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential) {
        return true;
    } else {
        return false;
    }
};

export const isClrCredential = (vc: VC | UnsignedVC) => {
    return vc?.type?.includes('ClrCredential');
};
export const isEndorsementCredential = (vc: VC | UnsignedVC) => {
    return vc?.type?.includes('EndorsementCredential');
};

export const getClrLinkedCredentials = (vc: any) => {
    return vc?.credentialSubject?.verifiableCredential || [];
};

export const getClrLinkedCredentialCounts = (vc: any) => {
    return Array.isArray(vc?.credentialSubject?.verifiableCredential)
        ? vc?.credentialSubject?.verifiableCredential?.length
        : 0;
};

export const getIssuerImageNonBoost = (vc: VC | UnsignedVC) => {
    if (vc?.issuer?.image) return vc.issuer.image;

    return;
};

export const getIssuerNameNonBoost = (vc: VC | UnsignedVC) => {
    if (vc?.issuer?.name) {
        return vc.issuer.name;
    }
    if (vc?.issuer?.id) {
        return vc?.issuer?.id;
    }

    if (vc?.issuer?.url) {
        return vc?.issuer?.url;
    }
    return;
};

//copied from react/learncard as these helpers are not exported currrently

export const getImageFromImage = (image: Image): string => {
    if (typeof image === 'string') return image;

    return image.id ?? '';
};

//copied from react/learncard as these helpers are not exported currrently
export const getNameFromProfile = (profile: Profile): string => {
    if (typeof profile === 'string') return profile;

    return profile.name || profile.displayName || '';
};

//copied from react/learncard as these helpers are not exported currrently
export const getImageFromProfile = (profile: Profile): string => {
    if (typeof profile === 'string') return '';

    return getImageFromImage(profile.image ?? '');
};

export const getVerifierState = (credential: VC | UnsignedVC) => {
    const {
        // oxlint-disable-next-line no-unused-vars
        title = '',
        // oxlint-disable-next-line no-unused-vars
        createdAt,
        issuer: _issuer = '',
        issuee: _issuee = '',
        credentialSubject,
    } = getInfoFromCredential(credential as VC, 'MMM dd, yyyy', { uppercaseDate: false });
    const profileID =
        typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
    const { data: knownDIDRegistry } = useKnownDIDRegistry(profileID);

    const issuerDid =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;

    let verifierState: VerifierState;
    if (credentialSubject?.id === issuerDid && issuerDid && issuerDid !== 'did:example:123') {
        // the extra "&& issuerDid" is so that the credential preview doesn't say "Self Verified"
        // the did:example:123 condition is so that we don't show this status from the Manage Boosts tab
        verifierState = VERIFIER_STATES.selfVerified;
    } else {
        if (knownDIDRegistry?.source === 'trusted') {
            verifierState = VERIFIER_STATES.trustedVerifier;
        } else if (knownDIDRegistry?.source === 'untrusted') {
            verifierState = VERIFIER_STATES.untrustedVerifier;
        } else if (knownDIDRegistry?.source === 'unknown') {
            verifierState = VERIFIER_STATES.unknownVerifier;
        } else {
            verifierState = VERIFIER_STATES.unknownVerifier;
        }
    }

    return verifierState;
};

export const getDefaultCategoryForCredential = (
    credential: VC | UnsignedVC
): CredentialCategory => {
    const _credential = unwrapBoostCredential(credential);
    // course meta VC is a metaversity specific case for now
    if (isCourseMetaVC(_credential)) return 'Learning History';
    if (isEntryVC(_credential) && _credential.id.split('|')[0] === 'course') return 'Hidden';

    const verificationResult = UnsignedAchievementCredentialValidator.or(
        AchievementCredentialValidator
    ).safeParse(_credential);

    // Ai passport credentials
    try {
        if ('summaryInfo' in _credential) return 'AI Summary';
        if ('topicInfo' in _credential) return 'AI Topic';
        if ('learningPathway' in _credential) return 'AI Pathway';
        if ('assessment' in _credential) return 'AI Assessment';
    } catch (error) {
        console.log(error);
    }

    const _isClrCredential = isClrCredential(_credential);
    const verifiableCredential = _credential?.credentialSubject?.verifiableCredential;
    if (
        _isClrCredential &&
        Array.isArray(verifiableCredential) &&
        verifiableCredential.length === 1
    ) {
        return CATEGORY_MAP[
            verifiableCredential[0]?.credentialSubject?.achievement?.achievementType
        ];
    } else if (
        _isClrCredential &&
        Array.isArray(verifiableCredential) &&
        verifiableCredential.length > 1
    ) {
        return 'Learning History';
    }
    console.log(_credential, verificationResult);

    // Not OBv3 credential, default category to achievement
    if (!verificationResult.success) return 'Achievement';

    const vc = verificationResult.data;
    const achievementType = Array.isArray(vc?.credentialSubject)
        ? vc.credentialSubject[0]?.achievement?.achievementType
        : vc?.credentialSubject?.achievement?.achievementType;

    // if there is no achievementType, default to Achievement
    if (!achievementType) return 'Achievement';

    if (otherCredentialTypes.includes(vc?.type[1])) {
        return CATEGORY_MAP[vc?.type[1]];
    }

    // handles custom boost types
    if (isCustomBoostType(achievementType)) {
        const customBoostCategory = getCategoryTypeFromCustomType?.(achievementType);
        return customBoostCategory;
    }

    // handle mapping an achievementType to a category
    const mappedAchievementType = CATEGORY_MAP[achievementType];
    // if the achievementType was mapped correctly , return its category
    if (mappedAchievementType) return mappedAchievementType;
    // if there is no valid achievementType mapping, default to Achievement
    return 'Achievement';
};

export const getUrlFromImage = (image: Image): string => {
    if (typeof image === 'string') return image;

    return image?.id;
};

export const getAchievementType = (vc: VC | Boost) => {
    // if (!vc) throw new Error('VC is required');

    const credentialSubject = getCredentialSubject(vc);

    const achievementType = Array.isArray(credentialSubject)
        ? credentialSubject[0]?.achievement?.achievementType
        : credentialSubject?.achievement?.achievementType;

    return achievementType ?? 'Achievement';
};

export const getCredentialSubjectAchievement = (credential: UnsignedVC) => {
    const credentialSubject = getCredentialSubject(credential);
    const achievement = Array.isArray(credentialSubject?.achievement)
        ? credentialSubject?.achievement[0]
        : credentialSubject?.achievement;

    return achievement;
};

export const getCredentialSubject = (credential: UnsignedVC) => {
    if (!credential) return;
    if (credential.type?.includes(CREDENTIAL_TYPES.CERTIFIED_BOOST)) {
        credential = credential?.boostCredential;
    }
    const credentialSubject = Array.isArray(credential?.credentialSubject)
        ? credential?.credentialSubject[0]
        : credential?.credentialSubject;

    return credentialSubject;
};

export const getCredentialSubjectAchievementData = (credential: UnsignedVC) => {
    let description, criteria, alignment;
    if (credential?.type?.includes(CREDENTIAL_TYPES.LEGACY_CRED)) {
        description = credential?.legacyAssertion?.badge?.description;
        criteria = credential?.legacyAssertion?.badge?.narrative;
        alignment = credential?.legacyAssertion?.badge?.alignment;
    } else {
        const achievement = getCredentialSubjectAchievement(credential);
        description = achievement?.description;
        criteria = achievement?.criteria?.narrative;
        alignment = achievement?.alignment;
    }

    return {
        description,
        criteria,
        alignment,
    };
};

export const getSubjectImage = (credential: UnsignedVC) => {
    const subject = credential?.credentialSubject;

    if (!subject) return undefined;

    // handle array of subjects (rare but possible)
    const firstSubject = Array.isArray(subject) ? subject[0] : subject;

    if (typeof firstSubject?.image === 'string') {
        return firstSubject?.image;
    }

    if (typeof firstSubject?.image?.id === 'string') {
        return firstSubject?.image?.id;
    }

    return undefined;
};

export const getCredentialSubjectName = (credential: UnsignedVC) => {
    const credentialSubject = getCredentialSubject(credential);

    if (typeof credentialSubject?.name === 'string') return credentialSubject?.name;

    return credentialSubject?.id;
};

export const getIssuer = (credential: UnsignedVC) => {
    if (!credential) return;
    if (credential.type?.includes(CREDENTIAL_TYPES.CERTIFIED_BOOST)) {
        credential = credential.boostCredential;
    }

    return credential.issuer;
};

export const getIssuerDid = (credential: UnsignedVC) => {
    const issuer = getIssuer(credential);

    return typeof issuer === 'string' ? issuer : issuer?.id;
};

export const getIssuerName = (credential: UnsignedVC) => {
    const issuer = getIssuer(credential);

    return typeof issuer === 'string' ? issuer : issuer?.name;
};

export const getIssuerImage = (credential: UnsignedVC) => {
    const issuer = getIssuer(credential);
    if (typeof issuer !== 'string') {
        if (typeof issuer?.image === 'string') return issuer.image;
        if (typeof issuer?.image?.id === 'string') return issuer.image.id;
    }

    return undefined;
};

export const getProfileIdFromLCNDidWeb = (did?: string) => {
    return did?.match(LCN_DID_WEB_REGEX)?.[2];
};
const getFallBackImage = (credCategory: string) => {
    if (credCategory === 'Skill') return 'https://cdn.filestackcontent.com/pzfIWTKQTAuuzvLrySGX';
    if (credCategory === 'Experiences')
        return 'https://cdn.filestackcontent.com/5r2T383T0mic3wrSbi3W';
    if (credCategory === 'ID') return 'https://cdn.filestackcontent.com/6uMNvtjIQwG1MmLeL5dH';
    if (credCategory === 'Achievement')
        return 'https://cdn.filestackcontent.com/Y9DCbjt6Q0CccrCDX46I';
    if (credCategory === 'Work History')
        return 'https://cdn.filestackcontent.com/5r2T383T0mic3wrSbi3W';
    if (credCategory === 'Social Badge')
        return 'https://cdn.filestackcontent.com/ynPzjedXTn2JBUNQHeEm';
    if (credCategory === 'Learning History')
        return 'https://cdn.filestackcontent.com/OSTqZlxSCe6B62jwPm7O';
    if (credCategory === 'Accomplishment')
        return 'https://cdn.filestackcontent.com/F9yva92WQ0CPisIeQRmr';
    if (credCategory === 'Accommodation')
        return 'https://cdn.filestackcontent.com/cHt9WgJQdCMWMnLFFQh1';
    if (credCategory === 'Family') return 'https://cdn.filestackcontent.com/9HELycBJSKGEhQtiu9Is';
};

export const getImageUrlFromCredential = (
    credential: VC,
    credCategory?: string
): string | undefined => {
    const credSubject = getCredentialSubject(credential);

    // Try to get image from various sources in order of preference
    let imgSrc: string | undefined;

    if (credential?.type?.includes(CREDENTIAL_TYPES.LEGACY_CRED)) {
        const image = credential.legacyAssertion?.image;

        if (typeof image === 'string') return image;
        if (image?.id) return image.id;
        if (!image && credCategory) {
            return getFallBackImage(credCategory);
        }
        return '';
    }

    if (credential?.image) {
        imgSrc = credential.image;
    } else if (credSubject?.image) {
        imgSrc = credSubject.image;
    } else if (Array.isArray(credSubject?.achievement)) {
        imgSrc = credSubject.achievement[0]?.image;
    } else if (credSubject?.achievement?.image) {
        imgSrc = credSubject?.achievement?.image;
    } else if (credential?.issuer?.image) {
        imgSrc = credential?.issuer?.image;
    }

    // Convert the found image to URL if it exists
    const imgUrl = getUrlFromImage(imgSrc);

    // If no image URL was found and we have a category, use fallback
    if (!imgUrl && credCategory) {
        return getFallBackImage(credCategory);
    }

    return imgUrl;
};

export const getCredentialName = (credential: VC): string => {
    const credentialTypes = getCredentialType(credential);
    const name = getPotentialNameFieldsFromType(credentialTypes, credential);
    const credentialSubjectAchievementName = getCredentialSubject(credential)?.achievement?.name;
    // console.log(
    //     'GET CREDENTIAL NAME',
    //     credential,
    //     credentialTypes,
    //     name,
    //     credentialSubjectAchievementName
    // );
    return credential?.name || name || credentialSubjectAchievementName;
};

export const getCredentialType = (credential: VC) => {
    return credential?.type;
};

export const getPotentialNameFieldsFromType = (credentialTypes: string[], credential: VC) => {
    let name;
    const credentialSubject = getCredentialSubject(credential);
    if (credentialTypes?.includes(CREDENTIAL_TYPES.MOVIE_TICKET)) {
        name =
            // oxlint-disable-next-line no-constant-binary-expression
            `${credentialSubject?.owns?.type} ${credentialSubject?.owns?.ticketNumber}` ||
            credential?.description;
    }
    if (credentialTypes?.includes(CREDENTIAL_TYPES.CERTIFIED_BOOST)) {
        name = credentialSubject?.achievement?.name;
    }
    if (credentialTypes?.includes(CREDENTIAL_TYPES.LEGACY_CRED)) {
        name = credential?.legacyAssertion?.badge?.name || 'Open Badge';
    }
    return name;
};

export type DetailsFieldType = {
    fieldName: string;
    fieldValue: string;
};

const generateFieldDisplayObj = (
    fieldName: string,
    fieldValue: string
): DetailsFieldType | undefined => {
    if (!fieldName || !fieldValue) return;
    return {
        fieldName,
        fieldValue,
    };
};

// todo rewrite to use fields from a defined schema for these credential types
export const getDetailsFromCredential = (credential: VC) => {
    let detailFieldsData = <any>[];
    const credentialSubject = getCredentialSubject(credential);
    const _credentialTypes = getCredentialType(credential);
    const credentialContexts = credential?.['@context'];

    //default case
    const defaultDesc = generateFieldDisplayObj(
        'Description',
        credential?.details || credentialSubject?.achievement?.description
    );
    const defaultIssuer = generateFieldDisplayObj(
        'Issuer',
        credential?.issuer?.name || credential?.issuer?.id || credential?.issuer?.toString()
    );
    const defaultCriteria = generateFieldDisplayObj(
        'Criteria',
        credentialSubject?.achievement?.criteria?.narrative
    );
    detailFieldsData = [defaultDesc, defaultIssuer, defaultCriteria];

    // MOVIE TICKET
    if (credentialContexts?.includes(CREDENTIAL_CONTEXTS.MOVIE_TICKET)) {
        const description = generateFieldDisplayObj('Description', credential?.description);
        const ticketNumber = generateFieldDisplayObj(
            'Ticket Number',
            credentialSubject?.owns?.ticketNumber
        );
        const ticketDate = generateFieldDisplayObj(
            'Ticket Date',
            credentialSubject?.owns?.startDate
        );
        detailFieldsData = [description, ticketNumber, ticketDate, defaultIssuer];
    }

    // PERMANENT RESIDENT
    if (credentialContexts?.includes(CREDENTIAL_CONTEXTS.PERM_RESIDENT)) {
        const description = generateFieldDisplayObj('Description', credential?.description);
        const identifier = generateFieldDisplayObj('Identifier', credential?.identifier);
        const expirationDate = generateFieldDisplayObj(
            'Expiration Date',
            credential?.expirationDate
        );
        const subjectName = generateFieldDisplayObj(
            'Name',
            `${credentialSubject?.givenName} ${credentialSubject?.familyName}`
        );
        detailFieldsData = [identifier, description, expirationDate, subjectName];
    }

    // ALUMNI CREDENTIAL
    if (credentialContexts?.includes(CREDENTIAL_CONTEXTS.ALUMNI_OF)) {
        const description = generateFieldDisplayObj('Description', credential?.description);
        const issuanceDate = generateFieldDisplayObj('Issue Date', credential?.issuanceDate);
        const alumniOf = generateFieldDisplayObj(
            'Alumni Of',
            `${credentialSubject?.alumniOf?.name}`
        );
        detailFieldsData = [description, issuanceDate, alumniOf, defaultIssuer];
    }

    return detailFieldsData;
};

// used to reshape raw credential list into object
// with keys being achievement type with an array of those type vcs
// ** This has logic that's Metaversity specific
export const getSortedCredentials = async (credentials: VC[]) => {
    const sortedCredentials: SyncCredentialsVCs = {
        ids: [],
        courses: [],
        courseEntries: [],
        achievements: [],
        skills: [],
        socialBadges: [],
        workHistory: [],
        memberships: [],
        families: [],
    };

    if (credentials) {
        // sort credentials by credential category
        await Promise.all(
            credentials.map(async vc => {
                const category = getDefaultCategoryForCredential(vc);

                if (isCourseMetaVC(vc)) sortedCredentials.courses.push(vc);
                if (vc.id?.split('|')[0] === 'course' && isEntryVC(vc)) {
                    sortedCredentials.courseEntries.push(vc);
                }
                if (category === 'Skill') sortedCredentials.skills.push(vc);
                if (category === 'ID') sortedCredentials.ids.push(vc);
                if (category === 'Achievement') sortedCredentials.achievements.push(vc);
                if (category === 'Work History') sortedCredentials.workHistory.push(vc);
                if (category === 'Social Badge') sortedCredentials.socialBadges.push(vc);
                if (category === 'Membership') sortedCredentials.memberships.push(vc);
                if (category === 'Accomplishment') sortedCredentials.memberships.push(vc);
                if (category === 'Accommodation') sortedCredentials.memberships.push(vc);
                if (category === 'Family') sortedCredentials.families.push(vc);
            })
        );
    }

    return sortedCredentials;
};

export const getAllSortedCredentials = async (credentials: VC[]) => {
    const sortedCredentials: SortedCredentials = {
        ids: [],
        courses: [],
        workHistory: [],
        achievements: [],
        skills: [],
        socialBadges: [],
        memberships: [],
        families: [],
    };

    if (credentials) {
        // sort credentials by credential category
        await Promise.all(
            credentials.map(async vc => {
                const category = getDefaultCategoryForCredential(vc);

                if (category === 'Learning History') sortedCredentials.courses.push(vc);
                if (category === 'Work History') {
                    sortedCredentials.workHistory.push(vc);
                }
                if (category === 'Skill') sortedCredentials.skills.push(vc);
                if (category === 'ID') sortedCredentials.ids.push(vc);
                if (category === 'Achievement') sortedCredentials.achievements.push(vc);
                if (category === 'Social Badge') sortedCredentials.socialBadges.push(vc);
                if (category === 'Membership') sortedCredentials.memberships.push(vc);
                if (category === 'Accomplishment') sortedCredentials.memberships.push(vc);
                if (category === 'Accommodation') sortedCredentials.memberships.push(vc);
                if (category === 'Family') sortedCredentials.families.push(vc);
            })
        );
    }

    return sortedCredentials;
};

export const isCourseMetaVC = (vc: UnsignedVC): vc is CourseMetaVC => {
    if (!vc?.credentialSubject) return false;
    // oxlint-disable-next-line no-unsafe-optional-chaining
    return 'potentialVCs' in vc?.credentialSubject;
};

export const isEntryVC = (vc: UnsignedVC): vc is EntryVC => {
    if (isCourseMetaVC(vc)) return false;
    if (Array.isArray(vc?.credentialSubject)) return false;

    if (
        !UnsignedAchievementCredentialValidator.or(AchievementCredentialValidator).safeParse(vc)
            .success
    ) {
        return false;
    }

    if ((vc?.credentialSubject?.achievement?.alignment?.length ?? 0) !== 1) return false;

    const idParts = vc.id?.split('|');

    return idParts?.[1] === 'enrollment' || idParts?.[1] === 'completion';
};

export const getCourseIdFromEntryVC = (vc: VC): string | false => {
    if (!isEntryVC(vc)) return false;

    return vc?.credentialSubject?.achievement?.alignment?.[0]?.targetCode;
};

export const getEntriesForCourseMetaVC = async (
    vc: CourseMetaVC,
    wallet = walletStore.get.wallet()
): Promise<EntryVC[]> => {
    if (!wallet || !isCourseMetaVC(vc)) return [];

    const id = vc.id ?? '';

    if (!id) return [];

    const vcs = await wallet.index.all.get<IndexMetadata>();

    return (
        await Promise.all(
            vcs.filter(vc => vc.courseId === id).map(async vc => wallet.read.get(vc.uri))
        )
    ).filter(isEntryVC);
};

export const getBestCourseEntry = (entries: EntryVC[]): EntryVC | undefined => {
    return (
        entries.find(
            vc => vc.id?.split('|')[0] === 'course' && vc.id?.split('|')[1] === 'completion'
        ) ||
        entries.find(
            vc => vc.id?.split('|')[0] === 'course' && vc.id?.split('|')[1] === 'enrollment'
        )
    );
};

// TODO: Get term from CAPI
export const getEnrollmentStatus = (
    entries: EntryVC[]
): { status: 'Unenrolled' | 'Enrolled' | 'Completed'; term?: string } => {
    const completionVc = entries.find(
        vc => vc.id?.split('|')[0] === 'course' && vc.id?.split('|')[1] === 'completion'
    );

    if (completionVc) {
        const endDate = completionVc?.credentialSubject?.activityEndDate;

        return {
            status: 'Completed',
            ...(endDate
                ? { term: `${getSeason(endDate)} ${new Date(endDate).getFullYear()}` }
                : {}),
        };
    }

    const enrollmentVc = entries.find(
        vc => vc.id?.split('|')[0] === 'course' && vc.id?.split('|')[1] === 'enrollment'
    );

    if (enrollmentVc) {
        const startDate = enrollmentVc?.credentialSubject?.activityStartDate;

        return {
            status: 'Enrolled',
            ...(startDate
                ? { term: `${getSeason(startDate)} ${new Date(startDate).getFullYear()}` }
                : {}),
        };
    }

    return { status: 'Unenrolled' };
};

export const getSkillsForCourse = (entries: EntryVC[]): EntryVC[] => {
    return entries.filter(
        vc =>
            vc.id?.split('|')[0] === 'assessment' && getDefaultCategoryForCredential(vc) === 'Skill'
    );
};

export const getAchievementsForCourse = (entries: EntryVC[]): EntryVC[] => {
    return entries.filter(
        vc =>
            vc.id?.split('|')[0] === 'assessment' &&
            getDefaultCategoryForCredential(vc) === 'Achievement'
    );
};

export const getIssuanceDate = (credential?: VC): string | undefined => {
    if (credential?.boostCredential) {
        return credential?.boostCredential?.issuanceDate;
    }
    return credential?.issuanceDate;
};

export const getAchievementTypeDisplayText = (
    achievementType: string,
    boostType: BoostCategoryOptionsEnum,
    fallbackText: string = ''
) => {
    let displayText;

    if (isCustomBoostType(achievementType)) {
        displayText = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(achievementType)
        );
    } else {
        displayText =
            CATEGORY_TO_SUBCATEGORY_LIST?.[boostType]?.find(
                (options: { title: string; type: string }) => options?.type === achievementType
            )?.title ?? '';

        if (!achievementType && fallbackText) {
            displayText = fallbackText;
        }
    }

    if (!displayText) {
        // Fail safe
        // achievementType is probably in a form we don't expect (e.g. not "ext:Ambassador", might just be a plain string)
        //   (arbitrarily) default to boostType here, since it's at least generally accurate and properly formatted for display
        //   otherwise, just display whatever was passed in for achievementType.
        //   fallbackText if we need it
        const boostTypeDisplayText = boostCategoryMetadata?.[boostType]?.title;
        if (boostTypeDisplayText) displayText = boostTypeDisplayText;

        displayText = boostTypeDisplayText || achievementType || fallbackText;
    }

    return displayText;
};

export const getCategoryPrimaryColor = (category = CredentialCategoryEnum.achievement) => {
    switch (category) {
        case CredentialCategoryEnum.socialBadge:
            return 'cyan';
        case CredentialCategoryEnum.skill:
            return 'indigo';
        case CredentialCategoryEnum.achievement:
            return 'spice';
        case CredentialCategoryEnum.learningHistory:
            return 'emerald';
        case CredentialCategoryEnum.id:
            return 'yellow';
        case CredentialCategoryEnum.workHistory:
            return 'blue';
        // case CredentialCategoryEnum.job:
        //     return 'rose';
        // case CredentialCategoryEnum.course:
        //     return 'emerald';
        case CredentialCategoryEnum.currency:
            return 'cyan';
        case CredentialCategoryEnum.membership:
            return 'teal';
        case CredentialCategoryEnum.accommodation:
            return 'amber';
        case CredentialCategoryEnum.accomplishment:
            return 'lime';
        default:
            return 'spice';
    }
};

export const getCategoryDarkColor = (category = CredentialCategoryEnum.achievement) => {
    if (category === CredentialCategoryEnum.meritBadge) {
        return 'sp-purple-base';
    }

    return `${getCategoryPrimaryColor(category)}-700`;
};

// (Owner POV)
export const getEndorsements = async (wallet = walletStore.get.wallet(), vc: VC) => {
    if (!vc?.id) return [];
    const idxEndorsements = await wallet?.index.LearnCloud.get({ credentialId: vc?.id });

    if (!idxEndorsements || idxEndorsements.length === 0) return [];

    const endorsementPromises = idxEndorsements.map(async endorsement => {
        const resolvedEndorsement = await wallet?.read?.get(endorsement.uri);
        return { endorsement: resolvedEndorsement, metadata: endorsement };
    });

    return Promise.all(endorsementPromises);
};

// (Owner POV)
export const getEndorsementsForVC = async (
    wallet = walletStore.get.wallet(),
    vc: VC,
    visibility: 'public' | 'private' = 'public'
): Promise<VC[]> => {
    const idxEndorsements = await wallet?.index.LearnCloud.get({
        credentialId: vc?.id,
    });
    if (!idxEndorsements || idxEndorsements.length === 0) return [];

    // TODO: handle this server side ^^ filtering is not working above
    const filteredEndorsements = idxEndorsements.filter(r => r.visibility === visibility);

    const endorsementPromises = filteredEndorsements.map(async endorsement => {
        return wallet?.read?.get(endorsement.uri);
    });

    return Promise.all(endorsementPromises);
};

export const getEndorsementsFromPresentations = (VCs: VC[]) => {
    if (!Array.isArray(VCs)) return [];

    const endorsements = VCs.filter(vc => vc.type.includes('EndorsementCredential')) as VC[];

    return endorsements;
};

export const hasEndorsedCredential = (endorsements: VC[], currentUserDid: string): boolean => {
    return endorsements?.some(endorsement => endorsement?.issuer === currentUserDid);
};

export const parseShareLinkParams = (shareLink: string) => {
    const params = new URLSearchParams(shareLink);
    return {
        seed: params.get('seed'),
        pin: params.get('pin'),
        uri: params.get('uri'),
    };
};
export const getEvidenceAttachmentType = async (url: string) => {
    const videoMetadata = await getVideoMetadata(url);
    const docMetadata = await getFileMetadata(url);

    if (docMetadata && !videoMetadata) {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(docMetadata?.fileExtension)) {
            return 'photo';
        }
        if (['docx', 'doc', 'ppt', 'pptx', 'pdf'].includes(docMetadata?.fileExtension)) {
            return 'document';
        }
    }
    if (videoMetadata && !docMetadata) {
        return 'video';
    }
    if (url.includes('data:application/pdf;base64,')) {
        return 'document';
    }
    return 'text';
};

export const getEvidenceAttachments = async (evidence: BoostEvidenceSpec[]) => {
    if (!evidence) return;

    const result = await Promise.all(
        evidence.map(async ev => {
            let url;
            let type;

            if (ev?.url) {
                url = ev?.url;
                type = await getEvidenceAttachmentType(ev?.url);
            } else if (
                typeof ev?.id === 'string' &&
                ev?.id?.startsWith('data:application/pdf;base64,')
            ) {
                url = ev?.id;
                type = 'document';
            } else if (ev?.type?.includes('EvidenceFile')) {
                url = ev?.id;
                type = ev?.genre;
            } else {
                url = ev?.id;
                type = await getEvidenceAttachmentType(ev?.id);
            }

            return {
                title: ev?.name ?? '',
                url,
                description: ev?.description ?? '',
                narrative: ev?.narrative ?? '',
                type,
            };
        })
    );

    return result;
};

export const convertEvidenceToAttachments = (evidence: BoostEvidenceSpec[]): BoostAttachment[] => {
    return evidence.map(evidence => {
        return {
            type: evidence?.genre ?? '',
            title: evidence?.name ?? '',
            url: evidence?.id,
            fileName: evidence?.fileName ?? '',
            fileSize: evidence?.fileSize ?? '',
            fileType: evidence?.fileType ?? '',
        };
    });
};

// ! small helper to handle the transition from attachments to evidence
// ! existing attachments will take higher precedence over evidence
export const getExistingAttachmentsOrEvidence = (
    attachments: BoostCMSMediaAttachment[],
    evidence: BoostEvidenceSpec[]
): BoostCMSMediaAttachment[] => {
    const existingAttachments = attachments?.length > 0;
    const existingEvidence = evidence?.length > 0;

    if (existingAttachments) return attachments;
    if (!existingAttachments && existingEvidence) return convertEvidenceToAttachments(evidence);

    return [];
};
