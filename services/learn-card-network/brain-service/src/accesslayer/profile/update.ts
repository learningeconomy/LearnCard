import { QueryBuilder, BindParam } from 'neogma';
import { flattenObject } from '@helpers/objects.helpers';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';
import { syncProfileDisplayNameLower } from './search-fields';

export const updateProfile = async (profile: ProfileType, updates: Partial<ProfileType>) => {
    const currentDisplay = profile.display;
    const newDisplay = { ...(currentDisplay || {}), ...(updates.display || {}) };

    const newUpdates: Record<string, unknown> = flattenObject<Partial<ProfileType>>({
        ...updates,
        ...((currentDisplay || newDisplay) && { display: newDisplay }),
    });

    if (updates.highlightedCredentials !== undefined) {
        for (const key of Object.keys(flattenObject(profile))) {
            if (
                (key === 'highlightedCredentials' || key.startsWith('highlightedCredentials.')) &&
                !(key in newUpdates)
            ) {
                newUpdates[key] = null;
            }
        }
    }

    const query = new QueryBuilder(new BindParam({ params: newUpdates }))
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .set(
            // Keep the lowercased search copy in sync whenever displayName changes
            'displayName' in newUpdates
                ? `profile += $params, ${syncProfileDisplayNameLower('profile')}`
                : 'profile += $params'
        );

    const result = await query.run();

    return result.summary.updateStatistics.containsUpdates();
};
