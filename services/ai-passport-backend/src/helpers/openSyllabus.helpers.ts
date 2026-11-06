import { Source, Alignment, Evidence } from './credential.helpers';

// Syllabi
export type SyllabiResponse = {
    syllabus_total: number;
    syllabi: Syllabus[];
};

export type Syllabus = {
    id: string;
    title: string;
    code: string;
    institution: Institution;
    field: {
        id: string;
        field: string;
    } | null;
    description: string | null;
    topic_outline: string | null;
    credits: string | number | null;
    learning_outcomes: string[];
    year: number | null;
};

// Institution
export type Institution = {
    id: string;
    institution: string;
    country: {
        id: string;
        country: string;
    };
    state: string;
    city: string;
    lat: number;
    lng: number;
    description: string;
    url: string;
    wikipedia_url: string;
    image_url: string;
    coverage_metric: number;
};

export type InstitutionsResponse = {
    institutions: Institution[];
};

// Title
export type TitlesResponse = {
    syllabus_total: number;
    citation_total: number;
    work_total: number;
    works: Work[];
};

export type Work = {
    id: string;
    title: string;
    subtitle: string | null;
    authors: Author[];
    publisher: Publisher | null;
    year: number | null;
    oer: boolean;
    description: string | null;
    dois: string[] | null;
    isbns: string[] | null;
    issns: string[] | null;
    urls: string[] | null;
    publication_type: string | null;
    rank: number;
    score: number;
    citation_count: number;
};

export type Author = {
    id: string;
    author: string;
};

export type Publisher = {
    id: string;
    publisher: string;
};

export enum OpenSyllabusField {
    Business = 'Business',
    Mathematics = 'Mathematics',
    ComputerScience = 'Computer Science',
    EnglishLiterature = 'English Literature',
    Engineering = 'Engineering',
    Education = 'Education',
    Biology = 'Biology',
    History = 'History',
    Psychology = 'Psychology',
    PoliticalScience = 'Political Science',
    FineArts = 'Fine Arts',
    Law = 'Law',
    Economics = 'Economics',
    Medicine = 'Medicine',
    Chemistry = 'Chemistry',
    Music = 'Music',
    Nursing = 'Nursing',
    German = 'German',
    MediaCommunications = 'Media / Communications',
    Sociology = 'Sociology',
    FitnessAndLeisure = 'Fitness and Leisure',
    Physics = 'Physics',
    Accounting = 'Accounting',
    Spanish = 'Spanish',
    Philosophy = 'Philosophy',
    Architecture = 'Architecture',
    Marketing = 'Marketing',
    FilmAndPhotography = 'Film and Photography',
    Anthropology = 'Anthropology',
    Agriculture = 'Agriculture',
    BasicSkills = 'Basic Skills',
    EarthSciences = 'Earth Sciences',
    Geography = 'Geography',
    SocialWork = 'Social Work',
    CriminalJustice = 'Criminal Justice',
    French = 'French',
    Linguistics = 'Linguistics',
    Theology = 'Theology',
    BasicComputerSkills = 'Basic Computer Skills',
    HealthTechnician = 'Health Technician',
    TheatreArts = 'Theatre Arts',
    MechanicRepairTech = 'Mechanic / Repair Tech',
    Religion = 'Religion',
    Classics = 'Classics',
    Japanese = 'Japanese',
    Dentistry = 'Dentistry',
    LibraryScience = 'Library Science',
    Journalism = 'Journalism',
    Nutrition = 'Nutrition',
    CulinaryArts = 'Culinary Arts',
    Chinese = 'Chinese',
    VeterinaryMedicine = 'Veterinary Medicine',
    Dance = 'Dance',
    PublicSafety = 'Public Safety',
    Astronomy = 'Astronomy',
    Cosmetology = 'Cosmetology',
    SignLanguage = 'Sign Language',
    WomensStudies = "Women's Studies",
    Transportation = 'Transportation',
    AtmosphericSciences = 'Atmospheric Sciences',
    Hebrew = 'Hebrew',
    MilitaryScience = 'Military Science',
}

export const OPEN_SYLLABUS_FIELDS = Object.values(OpenSyllabusField);

export type OpenSyllabusFieldType = `${OpenSyllabusField}`;

/**
 * Attempts to resolve a cover image URL for a given work.
 * If ISBNs exist → use OpenLibrary Covers API // https://openlibrary.org/
 */
export const getBookCoverUrlFromWork = (work: Work): string | null => {
    if (work.isbns && work.isbns.length > 0) {
        const isbn = work.isbns.find(i => i.length >= 10); // Pick the first valid ISBN
        if (isbn) {
            return `https://covers.openlibrary.org/b/ISBN/${isbn}-L.jpg`;
        }
    }

    return null;
};

export const mapInstitutionToVC = (institution: Institution): Source => {
    const source: Source = {
        type: ['Profile'],
        id: `https://opensyllabus.org/institution/${institution.id}`,
        name: institution?.institution || '',
        description: institution?.description || '',
        url: institution?.url || '',
        image: institution?.image_url || '',
        address: {
            type: ['Address'],
            addressLocality: institution?.city || '',
            addressRegion: institution?.state || '',
            addressCountry: institution?.country?.country || '',
        },
        // otherIdentifier: [
        //   {
        //     type: ["OtherIdentifier"],
        //     identifier: institution?.id || "",
        //     identifierType: "OpenSyllabusInstitutionId",
        //   },
        // ],
        // parentOrg: {
        //   type: ["Profile"],
        //   name: "Open Syllabus",
        //   url: "https://opensyllabus.org/",
        // },
    };

    return source;
};

export const mapLearningOutcomesToVC = (learningOutcomes: string[]): Alignment[] => {
    if (learningOutcomes.length === 0) return [];

    const type: Alignment['type'] = ['Alignment'];
    const targetType = 'LearningOutcome';
    const targetFramework = 'Open Syllabus';
    const targetUrl = 'https://opensyllabus.org';

    const alignments = learningOutcomes.map(learningOutcome => {
        const alignment = {
            type,
            targetName: learningOutcome,
            targetType,
            targetFramework,
            targetUrl,
        };

        return alignment;
    });

    return alignments;
};

export const mapFieldToVC = (field: string): Alignment | null => {
    if (!field) return null;

    const type: Alignment['type'] = ['Alignment'];
    const targetType = 'CFSubject';
    const targetFramework = 'Open Syllabus Field Classification';
    const targetUrl = 'https://opensyllabus.org';

    const alignment = {
        type,
        targetName: field,
        targetType,
        targetFramework,
        targetUrl,
    };

    return alignment;
};

export const mapSyllabusToVC = (syllabus: Syllabus): Evidence | null => {
    if (!syllabus) return null;

    const type: Evidence['type'] = ['Evidence'];
    const genre = 'CourseSyllabus';
    const audience = 'educators';

    let syllabusUrl = `https://analytics.opensyllabus.org/singleton/syllabi?id=${syllabus.id}`;
    if (syllabus?.code) syllabusUrl += `&code=${syllabus.code}`;

    const evidence = {
        id: syllabusUrl,
        type,
        name: syllabus.title,
        description: syllabus.description || '',
        genre,
        audience,
    };

    return evidence;
};

export const mapWorksToVC = (works: Work[], limit: number): Evidence[] => {
    if (!works || works.length === 0) return [];

    const type: Evidence['type'] = ['Evidence'];
    const genre = 'Textbook';
    const audience = 'learners';

    return works.slice(0, limit).map(work => {
        const bookCoverUrl = getBookCoverUrlFromWork(work); // Resolves first valid ISBN
        const isbn = work?.isbns?.find(i => i.length >= 10); // Pick the first valid ISBN
        const authorStr = work.authors?.[0]?.author ? ` by ${work.authors[0].author}` : '';

        let worksUrl = `https://analytics.opensyllabus.org/singleton/works?id=${work.id}`;
        if (bookCoverUrl) worksUrl += `&cover=${bookCoverUrl}`;
        if (isbn) worksUrl += `&isbn=${isbn}`;
        if (authorStr) worksUrl += `&author=${authorStr}`;

        const name = `${work.title}`;

        const evidence: Evidence = {
            id: worksUrl,
            type,
            name,
            genre,
            audience,
            ...(work.description ? { description: work.description } : {}),
        };

        return evidence;
    });
};

export const getMappedOpenSyllabusData = (
    syllabi: SyllabiResponse,
    works: TitlesResponse,
    worksLimit: number = 8
) => {
    const evidence: Evidence[] = [];
    const alignment: Alignment[] = [];
    const syllabus: Syllabus = syllabi?.syllabi?.[0]; // get first syllabus

    // Source
    const source: Source = mapInstitutionToVC(syllabus?.institution || {});

    // Alignment
    const fieldAlignment = mapFieldToVC(syllabus?.field?.field || '');
    if (fieldAlignment) alignment.push(fieldAlignment);

    const learningOutcomes = mapLearningOutcomesToVC(syllabus?.learning_outcomes || []);
    if (learningOutcomes?.length > 0) alignment.push(...learningOutcomes);

    // Evidence
    const syllabusEvidence = mapSyllabusToVC(syllabus);
    if (syllabusEvidence) evidence?.push(syllabusEvidence);

    const worksEvidence = mapWorksToVC(works.works || [], worksLimit);
    if (worksEvidence.length > 0) evidence?.push(...worksEvidence);

    const mappedData = {
        source,
        alignment,
        evidence,
    };

    return mappedData;
};
