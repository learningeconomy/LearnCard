import { ConsentFlowContractDetails } from '@learncard/types';
import { getBespokeLearnCard } from './wallet.helpers';

// Duplicated from learn-card-base to avoid importing app source code (breaks Playwright)
export enum BoostCategoryOptionsEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    course = 'Course',
    job = 'Job',
    id = 'ID',
    skill = 'Skill',
    membership = 'Membership',
    currency = 'Currency',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',
    workHistory = 'Work History',
    learningHistory = 'Learning History',
    family = 'Family',
    describe = 'Describe',
}

export const testContract = {
    name: 'Test Contract',
    subtitle: 'ConsentFlow contract for The Tests',
    description: 'Look here. This is how you test a ConsentFlow contract.',
    image: 'https://media-be.chewy.com/wp-content/uploads/2022/09/27110948/cute-dogs-hero-1024x615.jpg',
    contract: {
        read: {
            anonymize: true,
            credentials: {
                categories: {
                    'Social Badge': {
                        required: false,
                    },
                    Achievement: {
                        required: true,
                    },
                },
            },
            personal: {
                Name: {
                    required: false,
                },
            },
        },
        write: {
            credentials: {
                categories: {
                    ID: {
                        required: true,
                    },
                    'Learning History': {
                        required: false,
                    },
                },
            },
            personal: {
                SomeCustomID: {
                    required: true,
                },
            },
        },
    },
};

export const gameFlowContract: ConsentFlowContractDetails = {
    // name: 'Game Flow Test Contract',
    // subtitle: 'Test Contract for Game Flow',
    // description:
    //    'This is a contract used to test ConsentFlow contracts with the needsGuardianConsent flag set',
    // image: 'https://media-be.chewy.com/wp-content/uploads/2022/09/27110948/cute-dogs-hero-1024x615.jpg',

    name: 'A Job For Me',
    subtitle: 'Learn about jobs with Elmo!',
    image: 'https://prod.drupal.aws.sesamestreet.org/sites/default/files/styles/original/public/1592588523/Thumb800x600_AJobForMe%20%281%29.gif?itok=gp6Vaat6',
    reasonForAccessing: 'Allow this game to issue you credentials',
    needsGuardianConsent: true,
    redirectUrl: 'https://www.coolmathgames.com/0-worlds-hardest-game',
    contract: {
        read: {
            anonymize: true,
            credentials: {
                categories: {
                    ID: {
                        required: true,
                    },
                    'Social Badge': {
                        required: false,
                    },
                },
            },
            personal: {
                Name: {
                    required: false,
                },
            },
        },
        /* write: {
            credentials: {
                categories: {
                    ID: {
                        required: true
                    },
                    "Learning History": {
                        required: false
                    }
                }
            },
            personal: {
                SomeCustomID: {
                    required: true
                }
            }
        } */
    },
};

export const initGameFlowContract = async (options?: {
    includeReasonForAccessing?: boolean;
    includeRedirectUrl?: boolean;
}) => {
    const { includeReasonForAccessing = true, includeRedirectUrl = true } = options ?? {};
    const gameLearnCard = await getBespokeLearnCard('abc123');

    try {
        const serviceProfile = {
            dipslayName: 'Game Name',
            profileId: 'web3game',
            image: 'https://imgs.search.brave.com/6uOD67VXnWJhEgQUqTvBTPgrI6hAhaHNlP-3fXRTlvs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTMy/NDY3MzI5NC9waG90/by92aWRlby1nYW1p/bmctY29uc29sZS1t/YW4tcGxheWluZy1y/cGctc3RyYXRlZ3kt/Z2FtZS5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9aFRzWWRE/TGJOS25FNWd4ZVk4/WWM0LTVkcnF6c0sy/RGlZenUxdmRrTUFP/ST0',
        };

        await gameLearnCard.invoke.createServiceProfile(serviceProfile);
    } catch {
        // if the service profile already exists, that's totally fine
    }

    const contract = { ...gameFlowContract };
    if (!includeReasonForAccessing) {
        delete contract.reasonForAccessing;
    }
    if (!includeRedirectUrl) {
        delete contract.redirectUrl;
    }

    const contractUri = await gameLearnCard.invoke.createContract(contract);

    return contractUri;
};

export const initConsentFlowContract = async () => {
    const networkLearnCard = await getBespokeLearnCard('aaa111222333');

    try {
        const serviceProfile = {
            dipslayName: 'Test Service',
            profileId: 'test-service',
            image: 'https://imgs.search.brave.com/6uOD67VXnWJhEgQUqTvBTPgrI6hAhaHNlP-3fXRTlvs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTMy/NDY3MzI5NC9waG90/by92aWRlby1nYW1p/bmctY29uc29sZS1t/YW4tcGxheWluZy1y/cGctc3RyYXRlZ3kt/Z2FtZS5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9aFRzWWRE/TGJOS25FNWd4ZVk4/WWM0LTVkcnF6c0sy/RGlZenUxdmRrTUFP/ST0',
        };

        await networkLearnCard.invoke.createServiceProfile(serviceProfile);
    } catch {
        // if the service profile already exists, that's totally fine
    }

    const contractUri = await networkLearnCard.invoke.createContract(testContract);

    return contractUri;
};

export type CustomContractOptions = {
    name?: string;
    anonymize?: boolean;
    readCategories: { category: BoostCategoryOptionsEnum; required: boolean }[];
    writeCategories: { category: BoostCategoryOptionsEnum; required: boolean }[];
    readPersonal: { field: string; required: boolean }[];
};

export const initCustomConsentFlowContract = async ({
    name,
    anonymize = true,
    readCategories,
    writeCategories,
    readPersonal,
}: CustomContractOptions) => {
    const networkLearnCard = await getBespokeLearnCard('aaa111222333');

    try {
        const serviceProfile = {
            dipslayName: 'Test Service',
            profileId: 'test-service',
            image: 'https://imgs.search.brave.com/6uOD67VXnWJhEgQUqTvBTPgrI6hAhaHNlP-3fXRTlvs/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTMy/NDY3MzI5NC9waG90/by92aWRlby1nYW1p/bmctY29uc29sZS1t/YW4tcGxheWluZy1y/cGctc3RyYXRlZ3kt/Z2FtZS5qcGc_cz02/MTJ4NjEyJnc9MCZr/PTIwJmM9aFRzWWRE/TGJOS25FNWd4ZVk4/WWM0LTVkcnF6c0sy/RGlZenUxdmRrTUFP/ST0',
        };

        await networkLearnCard.invoke.createServiceProfile(serviceProfile);
    } catch {
        // if the service profile already exists, that's totally fine
    }

    const customContract = {
        name: name ?? testContract.name,
        subtitle: testContract.subtitle,
        description: testContract.description,
        image: testContract.image,
        contract: {
            read: { anonymize, credentials: { categories: {} }, personal: {} },
            write: {
                credentials: { categories: {} },
                personal: {},
            },
        },
    };

    if (readCategories) {
        readCategories.forEach(({ category, required }) => {
            customContract.contract.read.credentials.categories[category] = { required };
        });
    }
    if (readPersonal) {
        readPersonal.forEach(({ field, required }) => {
            customContract.contract.read.personal[field] = { required };
        });
    }
    if (writeCategories) {
        writeCategories.forEach(({ category, required }) => {
            customContract.contract.write.credentials.categories[category] = { required };
        });
    }

    const contractUri = await networkLearnCard.invoke.createContract(customContract);

    return contractUri;
};

// identical to joinWithAnd in learn-card-base/stringHelpers.ts
export const joinWithAnd = (strings: string[]) => {
    const len = strings.length;
    if (len === 0) return '';
    if (len === 1) return strings[0];
    if (len === 2) return `${strings[0]} and ${strings[1]}`;
    return `${strings.slice(0, -1).join(', ')}, and ${strings[len - 1]}`;
};

/**
 * Get all permutations of an array
 * @param array The array to get permutations for
 * @returns Array of all possible permutations
 */
export function getPermutations<T>(array: T[]): T[][] {
    if (array.length <= 1) return [array];

    const result: T[][] = [];

    for (let i = 0; i < array.length; i++) {
        // Get current item
        const current = array[i];

        // Get remaining items (excluding current)
        const remaining = [...array.slice(0, i), ...array.slice(i + 1)];

        // Get permutations of remaining items
        const permutationsOfRemaining = getPermutations(remaining);

        // Add current item to each permutation of remaining items
        for (const permutation of permutationsOfRemaining) {
            result.push([current, ...permutation]);
        }
    }

    return result;
}

// cheat with a hardcoded map here since importing getInfoFromContractKey from contract.helpers breaks things
export const categoryToDisplayNameMap = {
    [BoostCategoryOptionsEnum.socialBadge]: 'Social Badges',
    [BoostCategoryOptionsEnum.id]: 'IDs',
    [BoostCategoryOptionsEnum.job]: 'Job',
    [BoostCategoryOptionsEnum.skill]: 'Skills',
    [BoostCategoryOptionsEnum.course]: 'Studies',
    [BoostCategoryOptionsEnum.family]: 'Families',
    // [BoostCategoryOptionsEnum.currency]: '',
    // [BoostCategoryOptionsEnum.describe]: '',
    [BoostCategoryOptionsEnum.membership]: 'IDs',
    [BoostCategoryOptionsEnum.achievement]: 'Achievements',
    [BoostCategoryOptionsEnum.accommodation]: 'Assistance',
    [BoostCategoryOptionsEnum.accomplishment]: 'Milestones',
    [BoostCategoryOptionsEnum.workHistory]: 'Experiences',
    [BoostCategoryOptionsEnum.learningHistory]: 'Studies',
};
