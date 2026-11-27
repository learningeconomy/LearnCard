import React from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { CampaignApi } from './types';
import { CampaignEditor } from './CampaignEditor';
import { CampaignList } from './CampaignList';
import { Busy, Notice, buttonClass } from './ui';

export const CampaignNotFound = () => (
    <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-grayscale-600">This page is unavailable.</p>
    </div>
);

const CampaignEditorRoute: React.FC<{ api: CampaignApi }> = ({ api }) => {
    const { id = '' } = useParams();
    return <CampaignEditor key={`campaign:${id}`} api={api} id={id} />;
};

/** Nothing below the admin gate mounts or fetches until the server grants access. */
export const CampaignRoutes: React.FC<{ api: CampaignApi }> = ({ api }) => {
    const location = useLocation();
    const creating = new URLSearchParams(location.search).get('create') === '1';
    const access = useQuery({
        queryKey: ['campaign-admin'],
        queryFn: () => api.campaignsIsAdmin(),
        retry: false,
        staleTime: 0,
    });
    if (access.isPending) return <Busy>Checking access...</Busy>;
    if (access.isError)
        return (
            <div className="space-y-3">
                <Notice error>
                    Access could not be checked. Check your connection and try again.
                </Notice>
                <button
                    type="button"
                    className={buttonClass}
                    disabled={access.isFetching}
                    onClick={() => void access.refetch()}
                >
                    {access.isFetching ? <Busy>Checking access...</Busy> : 'Try again'}
                </button>
            </div>
        );
    if (!access.data) return <CampaignNotFound />;
    return (
        // Mounted at `/admin/campaigns/*`: paths are relative to it.
        <Routes>
            <Route
                index
                element={
                    creating ? (
                        <CampaignEditor key="create-campaign" api={api} />
                    ) : (
                        <CampaignList api={api} />
                    )
                }
            />
            <Route path=":id" element={<CampaignEditorRoute api={api} />} />
            <Route path="*" element={<CampaignNotFound />} />
        </Routes>
    );
};
