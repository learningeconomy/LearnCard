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

/** Localize the UI label without changing the English value persisted in family credentials. */
export const getFamilyTitleLabel = (plural: string): string => {
    switch (plural) {
        case 'Guardians':
            return m['family.titleOptions.guardians']();
        case 'Parents':
            return m['family.titleOptions.parents']();
        case 'Grandparents':
            return m['family.titleOptions.grandparents']();
        case 'Caretakers':
            return m['family.titleOptions.caretakers']();
        case 'Advocates':
            return m['family.titleOptions.advocates']();
        case 'Children':
            return m['family.titleOptions.children']();
        case 'Kids':
            return m['family.titleOptions.kids']();
        default:
            return plural;
    }
};
import * as m from '../../../../paraglide/messages.js';
