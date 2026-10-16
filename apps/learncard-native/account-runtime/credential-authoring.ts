import catalog from '../ios/NativeCore/Sources/LearnCardNativeCore/Resources/credential-authoring.json';

export type NativeAuthoringInput = {
    kind: string;
    category?: string;
    displayType?: string;
    achievementType: string;
};
const colors: Record<string, string> = {
    'Social Badge': '#93C5FD',
    Achievement: '#F9A8D4',
    Qualifications: '#FDBA74',
    'Learning History': '#34D399',
    Accomplishment: '#FDE047',
    Accommodation: '#C4B5FD',
    'Work History': '#22D3EE',
    ID: '#93C5FD',
};

/** Resolve before any network mutation; old Swift callers keep their existing three-kind contract. */
export const resolveNativeAuthoring = (input: NativeAuthoringInput) => {
    const legacy = input.category === undefined;
    if (!['Achievements', 'Memberships', 'Learning'].includes(input.kind))
        throw new Error('Invalid credential category');
    const category = legacy
        ? input.kind === 'Learning'
            ? 'Learning History'
            : input.kind === 'Memberships'
              ? 'ID'
              : 'Achievement'
        : input.category!;
    const definition = catalog.categories.find(value => value.category === category);
    if (!definition) throw new Error('Unsupported credential category');
    if (
        legacy
            ? ![
                  'Badge',
                  'Certificate',
                  'Course',
                  'Competency',
                  'Membership',
                  'License',
                  'MicroCredential',
              ].includes(input.achievementType)
            : !definition.types.some(value => value.type === input.achievementType)
    )
        throw new Error('Invalid credential type for category');
    const displayType =
        input.displayType ??
        (category === 'ID'
            ? 'id'
            : category === 'Accomplishment'
              ? 'media'
              : legacy
                ? 'badge'
                : 'certificate');
    if (category === 'ID' ? displayType !== 'id' : !catalog.formats.includes(displayType))
        throw new Error('Invalid credential format');
    return {
        category,
        achievementType: input.achievementType,
        displayType,
        backgroundColor: colors[category],
    };
};
