import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Toggle, useWallet } from 'learn-card-base';
import type { AnnouncementPreferences as Preferences } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

/** Mount with a profile key so switching accounts cannot carry pending writes across profiles. */
export const AnnouncementPreferences: React.FC<{ profileId: string }> = ({ profileId }) => {
    const { initWallet } = useWallet();
    const [saving, setSaving] = useState(false);
    const busy = useRef(false);
    const [saveError, setSaveError] = useState(false);
    const query = useQuery({
        queryKey: ['announcement-preferences', profileId],
        queryFn: async () => (await initWallet()).invoke.getAnnouncementPreferences(),
        staleTime: 0,
    });
    const update = async (key: keyof Preferences, enabled: boolean): Promise<void> => {
        if (busy.current) return;
        busy.current = true;
        setSaving(true);
        setSaveError(false);
        try {
            const wallet = await initWallet();
            const profile = await wallet.invoke.getProfile();
            if (profile?.profileId !== profileId) throw new Error('Profile changed');
            await wallet.invoke.updateAnnouncementPreferences({ [key]: !enabled });
            await query.refetch({ throwOnError: true });
        } catch {
            setSaveError(true);
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };
    return (
        <section
            className="rounded-[20px] bg-white p-6 font-poppins"
            aria-busy={saving || query.isFetching}
        >
            <h2 className="text-xl font-semibold text-grayscale-900">
                {m['announcements.title']()}
            </h2>
            {query.isPending ? (
                <p role="status" className="text-sm text-grayscale-600">
                    {m['announcements.loading']()}
                </p>
            ) : (
                query.data && (
                    <div className="space-y-4 mt-4">
                        <Toggle
                            label={m['announcements.email']()}
                            checked={!query.data.announcementEmailOptOut}
                            disabled={saving || query.isFetching}
                            onChange={enabled => void update('announcementEmailOptOut', enabled)}
                        />
                        <Toggle
                            label={m['announcements.push']()}
                            checked={!query.data.announcementPushOptOut}
                            disabled={saving || query.isFetching}
                            onChange={enabled => void update('announcementPushOptOut', enabled)}
                        />
                    </div>
                )
            )}
            {saving && (
                <p role="status" className="text-sm text-grayscale-600 mt-3">
                    {m['announcements.saving']()}
                </p>
            )}
            {(query.isError || saveError) && (
                <div
                    role="alert"
                    className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700"
                >
                    {m['announcements.error']()}
                    <button
                        type="button"
                        className="block mt-3 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 disabled:opacity-40"
                        disabled={query.isFetching || saving}
                        onClick={() => {
                            setSaveError(false);
                            void query.refetch();
                        }}
                    >
                        {m['announcements.retry']()}
                    </button>
                </div>
            )}
        </section>
    );
};
