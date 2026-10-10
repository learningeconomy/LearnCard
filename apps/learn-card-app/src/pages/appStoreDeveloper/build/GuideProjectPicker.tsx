import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import type { LCNIntegration } from '@learncard/types';

import { getLogger } from 'learn-card-base';

import { mDynamic } from '../../../i18n/mDynamic';
import { USE_CASES } from '../guides/types';
import type { UseCaseId } from '../guides/types';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { getProjectsForGuide } from './buildHome';

const log = getLogger('guide-project-picker');

interface GuideProjectPickerProps {
    guideType: UseCaseId;
    integrations: LCNIntegration[];
}

export const GuideProjectPicker: React.FC<GuideProjectPickerProps> = ({
    guideType,
    integrations,
}) => {
    const history = useHistory();
    const { useUpdateIntegration, useCreateIntegration, useMyApps } = useDeveloperPortal();
    const { data: apps } = useMyApps(integrations);
    const appIntegrationIds = new Set((apps ?? []).map(app => app.integrationId));
    const updateIntegration = useUpdateIntegration();
    const createIntegration = useCreateIntegration();
    const guide = USE_CASES[guideType];
    const existing = getProjectsForGuide(integrations, guideType, appIntegrationIds);

    const [name, setName] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openGuide = async (integrationId: string) => {
        await updateIntegration.mutateAsync({ id: integrationId, updates: { guideType } });
        history.push(`/app-store/developer/integrations/${integrationId}/guides/${guideType}`);
    };

    const run = async (key: string, action: () => Promise<void>) => {
        setBusyId(key);
        setError(null);
        try {
            await action();
        } catch (e) {
            log.error('guide.project.failed', e, { guideType });
            setError('Something went wrong. Please try again.');
            setBusyId(null);
        }
    };

    const startNew = () =>
        run('new', async () => {
            const id = await createIntegration.mutateAsync(name.trim());
            await openGuide(id);
        });

    return (
        <div className="max-w-[480px] mx-auto py-10 font-poppins animate-fade-in-up">
            <button
                type="button"
                onClick={() => history.push('/app-store/developer/build')}
                className="flex items-center gap-1.5 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <IonIcon icon={arrowBackOutline} />
                All guides
            </button>

            <div className="mt-6 bg-white rounded-[20px] border border-grayscale-200 p-6 sm:p-8">
                <p className="text-xs font-medium text-grayscale-500">{mDynamic(guide.titleKey)}</p>
                <h1 className="mt-1 text-xl font-semibold text-grayscale-900">Name your project</h1>
                <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                    {mDynamic(guide.descriptionKey)} We'll save your progress as you go.
                </p>

                {error && (
                    <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                <form
                    className="mt-6"
                    onSubmit={event => {
                        event.preventDefault();
                        if (name.trim()) startNew();
                    }}
                >
                    <label
                        htmlFor="guide-project-name"
                        className="block text-xs font-medium text-grayscale-700 mb-1.5"
                    >
                        Project name
                    </label>
                    <input
                        id="guide-project-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Summer Coding Camp"
                        autoFocus
                        maxLength={80}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                    <button
                        type="submit"
                        disabled={!name.trim() || busyId !== null}
                        className="mt-4 w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {busyId === 'new' ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Setting up…
                            </>
                        ) : (
                            'Start Guide'
                        )}
                    </button>
                </form>

                {existing.length > 0 && (
                    <div className="mt-8">
                        <p className="text-xs font-medium text-grayscale-700 mb-2">
                            Or use a project you already have
                        </p>
                        <div className="rounded-2xl border border-grayscale-200 divide-y divide-grayscale-100 overflow-hidden">
                            {existing.map(integration => (
                                <button
                                    key={integration.id}
                                    type="button"
                                    onClick={() =>
                                        run(integration.id, () => openGuide(integration.id))
                                    }
                                    disabled={busyId !== null}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm text-grayscale-900 hover:bg-grayscale-10 transition-colors disabled:opacity-60"
                                >
                                    <span className="truncate">{integration.name}</span>
                                    {busyId === integration.id && (
                                        <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
