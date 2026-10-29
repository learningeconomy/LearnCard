import { createStore } from '@udecode/zustood';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import type { CredentialListCategory } from 'learn-card-base/types/credential-records';

export type CredentialSelectionContext = 'passport' | 'archived';

export type SelectedCredential = {
    uri: string;
    recordId: string;
    category: CredentialListCategory;
    fromCategory?: CredentialListCategory;
    record: LCR;
};

type CredentialSelectionState = {
    active: boolean;
    context: CredentialSelectionContext;
    items: Record<string, SelectedCredential>;
    anchorByList: Record<string, string | undefined>;
    accountDid?: string;
};

const initialState: CredentialSelectionState = {
    active: false,
    context: 'passport',
    items: {},
    anchorByList: {},
    accountDid: undefined,
};

const currentAccount = (): string | undefined => switchedProfileStore.get.switchedDid();

const reset = (set: ReturnType<typeof createStore>['set']) => {
    set.active(false);
    set.context('passport');
    set.items({});
    set.anchorByList({});
    set.accountDid(undefined);
};

export const credentialSelectionStore = createStore(
    'credentialSelectionStore'
)<CredentialSelectionState>(initialState).extendActions(set => ({
    enter: (context: CredentialSelectionContext = 'passport') => {
        set.active(true);
        set.context(context);
        set.accountDid(currentAccount());
    },
    toggle: (item: SelectedCredential, listId = item.category) => {
        const current = credentialSelectionStore.get.items();
        const next = { ...current };
        if (next[item.uri]) {
            delete next[item.uri];
        } else {
            next[item.uri] = item;
        }
        set.items(next);
        set.anchorByList({ ...credentialSelectionStore.get.anchorByList(), [listId]: item.uri });
    },
    selectMany: (items: SelectedCredential[], listId?: string) => {
        set.items({
            ...credentialSelectionStore.get.items(),
            ...Object.fromEntries(items.map(item => [item.uri, item])),
        });
        if (listId && items.at(-1)) {
            set.anchorByList({
                ...credentialSelectionStore.get.anchorByList(),
                [listId]: items.at(-1)?.uri,
            });
        }
    },
    deselectMany: (uris: string[]) => {
        const next = { ...credentialSelectionStore.get.items() };
        uris.forEach(uri => delete next[uri]);
        set.items(next);
    },
    setRange: (listId: string, items: SelectedCredential[], endUri: string) => {
        const anchor = credentialSelectionStore.get.anchorByList()[listId];
        const anchorIndex = anchor ? items.findIndex(item => item.uri === anchor) : -1;
        const endIndex = items.findIndex(item => item.uri === endUri);
        const end = items[endIndex];
        if (!end) return;
        const startIndex = anchorIndex >= 0 ? anchorIndex : endIndex;
        const range = items.slice(
            Math.min(startIndex, endIndex),
            Math.max(startIndex, endIndex) + 1
        );
        credentialSelectionStore.set.selectMany(range, listId);
        set.anchorByList({ ...credentialSelectionStore.get.anchorByList(), [listId]: end.uri });
    },
    clear: () => {
        set.items({});
        set.anchorByList({});
    },
    exit: () => reset(set),
    syncAccount: () => {
        const selectionAccount = credentialSelectionStore.get.accountDid();
        if (selectionAccount !== currentAccount()) reset(set);
    },
}));

export const getCredentialSelectionCount = (): number =>
    Object.keys(credentialSelectionStore.get.items()).length;

export const getCredentialSelectionCountByCategory = (): Record<string, number> =>
    Object.values(credentialSelectionStore.get.items()).reduce<Record<string, number>>(
        (counts, item) => ({ ...counts, [item.category]: (counts[item.category] ?? 0) + 1 }),
        {}
    );

export const isCredentialSelected = (uri: string): boolean =>
    Boolean(credentialSelectionStore.get.items()[uri]);
