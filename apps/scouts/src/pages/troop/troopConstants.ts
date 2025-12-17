export enum TroopParentLevel {
    global = 'global',
    national = 'national',
}

export const troopParentLevelToChildDepth = {
    [TroopParentLevel.global]: 2,
    [TroopParentLevel.national]: 1,
} as const;
