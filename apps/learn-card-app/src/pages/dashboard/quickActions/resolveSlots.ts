import {
    SLOT_ORDER,
    type ActionDeps,
    type ActionDescriptor,
    type DashboardState,
    type ResolvedAction,
    type SlotName,
} from './types';

export type ResolvedSlots = Record<SlotName, ResolvedAction | null>;

export const resolveSlots = (
    state: DashboardState,
    deps: ActionDeps,
    heroActionId: string | null,
    registry: ActionDescriptor[]
): ResolvedSlots => {
    const result: ResolvedSlots = {
        collect: null,
        understand: null,
        navigate: null,
    };

    for (const slot of SLOT_ORDER) {
        const eligibleInSlot = registry
            .map((descriptor, index) => ({ descriptor, index }))
            .filter(({ descriptor }) => descriptor.slot === slot && descriptor.eligible(state));

        // Drop the hero action to avoid a duplicate CTA, but re-include it if that
        // empties the slot: a redundant button beats an empty slot.
        const nonHero = eligibleInSlot.filter(({ descriptor }) => descriptor.id !== heroActionId);
        const candidates = nonHero.length > 0 ? nonHero : eligibleInSlot;

        if (candidates.length === 0) continue;

        candidates.sort((a, b) => {
            const wa = a.descriptor.weight(state);
            const wb = b.descriptor.weight(state);
            if (wb !== wa) return wb - wa;
            return a.index - b.index;
        });

        const top = candidates[0].descriptor;
        result[slot] = {
            id: top.id,
            slot: top.slot,
            ...top.build(state, deps),
        };
    }

    return result;
};
