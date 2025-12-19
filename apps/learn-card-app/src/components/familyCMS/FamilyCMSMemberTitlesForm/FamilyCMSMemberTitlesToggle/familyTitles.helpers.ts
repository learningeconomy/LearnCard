export enum FamilyTitleModesEnum {
    guardians = 'guardians',
    dependents = 'dependents',
}

export type TitleOption = {
    id?: number;
    plural: string;
    singular: string;
};

export type FamilyTitleOptions = {
    guardians: TitleOption[];
    dependents: TitleOption[];
};

export const familyTitleOptions = {
    guardians: [
        {
            id: 1,
            plural: 'Guardians',
            singular: 'Guardian',
        },
        {
            id: 2,
            plural: 'Parents',
            singular: 'Parent',
        },
        {
            id: 3,
            plural: 'Grandparents',
            singular: 'Grandparent',
        },
        {
            id: 4,
            plural: 'Caretakers',
            singular: 'Caretaker',
        },
        {
            id: 5,
            plural: 'Advocates',
            singular: 'Advocate',
        },
    ],
    dependents: [
        {
            id: 1,
            plural: 'Children',
            singular: 'Child',
        },
        {
            id: 2,
            plural: 'Kids',
            singular: 'Kid',
        },
    ],
};
