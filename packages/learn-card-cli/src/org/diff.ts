import type { OrgChange } from './apply';

export const hasChanges = (changes: OrgChange[]): boolean =>
    changes.some(change => change.action !== 'unchanged');

export const formatChanges = (changes: OrgChange[]): string[] => {
    if (!changes.length) return [];
    const resourceWidth = Math.max(...changes.map(change => change.resource.length));
    const nameWidth = Math.max(...changes.map(change => change.name.length));
    return changes.map(change => {
        const detail = change.detail ? `  (${change.detail})` : '';
        return `${change.resource.padEnd(resourceWidth)}  ${change.name.padEnd(nameWidth)}  ${change.action}${detail}`;
    });
};
