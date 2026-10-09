/**
 * Application presentation rules for CLR collections. CLR does not provide a
 * machine-readable military sector; keep these conservative, editable hints
 * separate from normalization and from the layout renderer.
 */
const DEGREE_TYPES = [
    'AssociateDegree',
    'BachelorDegree',
    'Degree',
    'Diploma',
    'DoctoralDegree',
    'GeneralEducationDevelopment',
    'MasterDegree',
    'ProfessionalDoctorate',
    'ResearchDoctorate',
    'SecondarySchoolDiploma',
] as const;

export const CLR_LAYOUT_HEURISTICS = {
    military: {
        leadPhrases: [
            ['military'],
            ['army'],
            ['navy'],
            ['air', 'force'],
            ['marine', 'corps'],
            ['coast', 'guard'],
            ['space', 'force'],
        ],
        // Record names only: a provider name or an isolated branch name is insufficient.
        titlePhrases: [
            ['joint', 'services', 'transcript'],
            ['aarts', 'transcript'],
            ['aarts'],
            ['army', 'american', 'council', 'on', 'education', 'registry', 'transcript'],
            ['ccaf', 'transcript'],
        ],
        middleWords: ['training', 'qualification', 'qualifications', 'service'],
        finalWords: [
            'service',
            'training',
            'record',
            'records',
            'transcript',
            'transcripts',
            'qualification',
            'qualifications',
        ],
        connectors: ['and'],
    },
    academic: {
        titlePhrases: [
            ['academic', 'record'],
            ['academic', 'history'],
            ['academic', 'transcript'],
            ['student', 'record'],
            ['grade', 'report'],
        ],
        titleWords: ['transcript'],
        degreeTypes: DEGREE_TYPES,
        compatibleTypes: [
            ...DEGREE_TYPES,
            'Course',
            'Assessment',
            'Assignment',
            'Competency',
            'LearningProgram',
            'Award',
            'Badge',
            'CoCurricular',
        ],
    },
} as const;

const contains = (values: readonly string[], value: string): boolean =>
    values.some(candidate => candidate === value);

const degreeTypes: ReadonlySet<string> = new Set(CLR_LAYOUT_HEURISTICS.academic.degreeTypes);
const compatibleTypes: ReadonlySet<string> = new Set(
    CLR_LAYOUT_HEURISTICS.academic.compatibleTypes
);

export const isAcademicDegreeType = (type: string): boolean => degreeTypes.has(type);
export const isAcademicCompatibleType = (type: string): boolean => compatibleTypes.has(type);

interface ClrTitleSignals {
    military: boolean;
    academic: boolean;
}

/** Tokenize ASCII title words in one pass; whitespace and punctuation cannot backtrack. */
const titleWords = (title: string): string[] => {
    const words: string[] = [];
    let start = -1;
    for (let index = 0; index <= title.length; index += 1) {
        const code = title.charCodeAt(index);
        const letter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
        if (letter && start < 0) start = index;
        if (!letter && start >= 0) {
            words.push(title.slice(start, index).toLowerCase());
            start = -1;
        }
    }
    return words;
};

const matchesPhrase = (words: string[], index: number, phrase: readonly string[]): boolean =>
    phrase.every((word, offset) => word === words[index + offset]);

/** Inspect collection-title signals without deriving a sector from child claims. */
export const inferClrTitleSignals = (title: string): ClrTitleSignals => {
    const words = titleWords(title);
    const consumedByMilitary = new Set<number>();
    const { military, academic } = CLR_LAYOUT_HEURISTICS;
    let militaryTitle = false;

    for (let index = 0; index < words.length; index += 1) {
        const titlePhrase = military.titlePhrases.find(phrase =>
            matchesPhrase(words, index, phrase)
        );
        if (titlePhrase) {
            militaryTitle = true;
            for (let offset = 0; offset < titlePhrase.length; offset += 1) {
                consumedByMilitary.add(index + offset);
            }
            index += titlePhrase.length - 1;
            continue;
        }
        const lead = military.leadPhrases.find(phrase => matchesPhrase(words, index, phrase));
        if (!lead) continue;
        let cursor = index + lead.length;
        let lastFinal = -1;
        while (cursor < words.length) {
            const word = words[cursor];
            if (contains(military.finalWords, word)) {
                lastFinal = cursor;
            }
            if (!contains(military.middleWords, word)) break;
            cursor += 1;
            if (contains(military.connectors, words[cursor] ?? '')) {
                cursor += 1;
            }
        }
        if (lastFinal < 0) continue;
        militaryTitle = true;
        for (let consumed = index; consumed <= lastFinal; consumed += 1) {
            consumedByMilitary.add(consumed);
        }
        index = lastFinal;
    }

    const academicTitle = words.some((word, index) => {
        if (contains(academic.titleWords, word) && !consumedByMilitary.has(index)) {
            return true;
        }
        return academic.titlePhrases.some(phrase => matchesPhrase(words, index, phrase));
    });
    return { military: militaryTitle, academic: academicTitle };
};
