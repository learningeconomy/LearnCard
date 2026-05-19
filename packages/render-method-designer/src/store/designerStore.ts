import { create } from 'zustand';
import { produce } from 'immer';

import { DEFAULT_THEME } from '../ir/theme';
import type {
    CredentialTemplate,
    DesignerElement,
    Theme,
} from '../ir/types';

/**
 * Zustand store for the visual designer. The IR is the single source of truth; the
 * Canvas, LayersList, and PropertiesPanel all read from this store. Mutations happen
 * via the action methods, which use immer to produce structurally-shared updates so
 * React re-renders stay surgical.
 *
 * The store deliberately holds only one IR at a time. Multi-template editing (tabs,
 * comparison views) is a Phase 3 concern.
 */
export interface DesignerState {
    template: CredentialTemplate;
    selectedElementId: string | null;
    history: { past: CredentialTemplate[]; future: CredentialTemplate[] };
    /**
     * True while an interaction (drag, resize) is in flight. Mutations during this window
     * skip history snapshots so a multi-frame drag collapses to a single undo entry.
     */
    interacting: boolean;
}

export interface DesignerActions {
    setTemplate: (template: CredentialTemplate) => void;
    selectElement: (id: string | null) => void;
    updateElement: (id: string, update: (el: DesignerElement) => void) => void;
    updateTheme: (update: (theme: Theme) => void) => void;
    addElement: (element: DesignerElement) => void;
    reorderElements: (fromIndex: number, toIndex: number) => void;
    moveElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
    deleteElement: (id: string) => void;
    duplicateElement: (id: string) => void;
    /** Begin an interaction. Snapshots the current template once, then suppresses snapshots
     *  on subsequent updates until `endInteraction` is called. */
    beginInteraction: () => void;
    /** End an in-flight interaction. The next update snapshots as usual. */
    endInteraction: () => void;
    undo: () => void;
    redo: () => void;
}

export type DesignerStore = DesignerState & DesignerActions;

const HISTORY_LIMIT = 50;

const blankTemplate = (): CredentialTemplate => ({
    version: 1,
    name: 'Untitled',
    size: { w: 360, h: 560 },
    theme: DEFAULT_THEME,
    elements: [],
});

const snapshot = (state: DesignerState, next: CredentialTemplate): DesignerState => {
    if (state.interacting) {
        return { ...state, template: next };
    }
    return {
        ...state,
        template: next,
        history: {
            past: [...state.history.past.slice(-(HISTORY_LIMIT - 1)), state.template],
            future: [],
        },
    };
};

const generateId = (prefix: string): string =>
    `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;

export const createDesignerStore = (initial?: CredentialTemplate) =>
    create<DesignerStore>((set, get) => ({
        template: initial ?? blankTemplate(),
        selectedElementId: null,
        history: { past: [], future: [] },
        interacting: false,

        setTemplate: template =>
            set(state => ({
                ...snapshot(state, template),
                selectedElementId: null,
            })),

        selectElement: id => set({ selectedElementId: id }),

        updateElement: (id, update) =>
            set(state => {
                const next = produce(state.template, draft => {
                    const el = draft.elements.find(e => e.id === id);
                    if (el) update(el);
                });
                return snapshot(state, next);
            }),

        updateTheme: update =>
            set(state => {
                const next = produce(state.template, draft => {
                    update(draft.theme);
                });
                return snapshot(state, next);
            }),

        addElement: element =>
            set(state => {
                const next = produce(state.template, draft => {
                    draft.elements.push(element);
                });
                return {
                    ...snapshot(state, next),
                    selectedElementId: element.id,
                };
            }),

        reorderElements: (fromIndex, toIndex) =>
            set(state => {
                if (
                    fromIndex === toIndex ||
                    fromIndex < 0 ||
                    toIndex < 0 ||
                    fromIndex >= state.template.elements.length ||
                    toIndex >= state.template.elements.length
                ) {
                    return state;
                }
                const next = produce(state.template, draft => {
                    const [el] = draft.elements.splice(fromIndex, 1);
                    draft.elements.splice(toIndex, 0, el);
                });
                return snapshot(state, next);
            }),

        beginInteraction: () => set({ interacting: true }),
        endInteraction: () => set({ interacting: false }),

        moveElement: (id, direction) =>
            set(state => {
                const idx = state.template.elements.findIndex(e => e.id === id);
                if (idx < 0) return state;
                const next = produce(state.template, draft => {
                    const [el] = draft.elements.splice(idx, 1);
                    let target = idx;
                    if (direction === 'up') target = Math.min(idx + 1, draft.elements.length);
                    if (direction === 'down') target = Math.max(idx - 1, 0);
                    if (direction === 'top') target = draft.elements.length;
                    if (direction === 'bottom') target = 0;
                    draft.elements.splice(target, 0, el);
                });
                return snapshot(state, next);
            }),

        deleteElement: id =>
            set(state => {
                const next = produce(state.template, draft => {
                    draft.elements = draft.elements.filter(e => e.id !== id);
                });
                return {
                    ...snapshot(state, next),
                    selectedElementId:
                        state.selectedElementId === id ? null : state.selectedElementId,
                };
            }),

        duplicateElement: id =>
            set(state => {
                const src = state.template.elements.find(e => e.id === id);
                if (!src) return state;
                const next = produce(state.template, draft => {
                    const idx = draft.elements.findIndex(e => e.id === id);
                    const clone = JSON.parse(JSON.stringify(src)) as DesignerElement;
                    clone.id = generateId(src.type);
                    if ('x' in clone && 'y' in clone) {
                        clone.x = (clone.x as number) + 12;
                        clone.y = (clone.y as number) + 12;
                    }
                    draft.elements.splice(idx + 1, 0, clone);
                });
                return {
                    ...snapshot(state, next),
                    selectedElementId: null,
                };
            }),

        undo: () => {
            const state = get();
            const last = state.history.past[state.history.past.length - 1];
            if (!last) return;
            set({
                template: last,
                history: {
                    past: state.history.past.slice(0, -1),
                    future: [state.template, ...state.history.future],
                },
                selectedElementId: null,
            });
        },

        redo: () => {
            const state = get();
            const next = state.history.future[0];
            if (!next) return;
            set({
                template: next,
                history: {
                    past: [...state.history.past, state.template],
                    future: state.history.future.slice(1),
                },
                selectedElementId: null,
            });
        },
    }));

export type DesignerStoreApi = ReturnType<typeof createDesignerStore>;

export { generateId };
