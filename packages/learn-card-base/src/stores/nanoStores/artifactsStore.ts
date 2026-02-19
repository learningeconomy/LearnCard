import { atom } from 'nanostores';

export const claimedArtifacts = atom<Set<string>>(new Set());
export const dismissedArtifacts = atom<Set<string>>(new Set());

export function claimArtifact(id: string): void {
    claimedArtifacts.set(new Set([...claimedArtifacts.get(), id]));
}

export function isArtifactClaimed(id: string): boolean {
    return claimedArtifacts.get().has(id);
}

export function dismissArtifact(id: string): void {
    dismissedArtifacts.set(new Set([...dismissedArtifacts.get(), id]));
}

export function isArtifactDismissed(id: string): boolean {
    return dismissedArtifacts.get().has(id);
}

export function resetArtifactsStore(): void {
    claimedArtifacts.set(new Set());
    dismissedArtifacts.set(new Set());
}
