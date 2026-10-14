import type { Boost } from '@learncard/types';
import type { ConsumerWallet } from './consumer-apps';
import { FamilyFailure } from './families';

/** Family membership can confer guardian authority, so it never uses ordinary credential delivery. */
export const isFamilyCreation = (
    value: Pick<Boost, 'category' | 'type'> & { boost?: unknown }
): boolean => {
    if (value.category?.toLowerCase() === 'family' || value.type?.toLowerCase() === 'family')
        return true;
    const raw = value.boost as { display?: { displayType?: unknown } } | undefined;
    return raw?.display?.displayType === 'family';
};

/** Recheck metadata immediately before delivery, including templates loaded before a category change. */
export const sendPersonalCreation = async (
    wallet: ConsumerWallet,
    input: { uri: string; recipient: string },
    isCurrent: () => boolean
): Promise<void> => {
    if (!isCurrent()) throw new FamilyFailure('unavailable');
    const template = await wallet.invoke.getBoost(input.uri);
    if (!isCurrent()) throw new FamilyFailure('unavailable');
    if (isFamilyCreation(template)) throw new FamilyFailure('permission');
    await wallet.invoke.send({ type: 'boost', recipient: input.recipient, templateUri: input.uri });
    if (!isCurrent()) throw new FamilyFailure('unavailable');
};
