import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonIcon, IonPage, IonSpinner } from '@ionic/react';
import {
    appsOutline,
    arrowForwardOutline,
    checkmarkCircleOutline,
    chevronForwardOutline,
    flashOutline,
    handLeftOutline,
    ribbonOutline,
    rocketOutline,
    shieldCheckmarkOutline,
    sparklesOutline,
} from 'ionicons/icons';

import { mDynamic } from '../../../i18n/mDynamic';
import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { USE_CASES } from '../guides/types';
import type { UseCaseId } from '../guides/types';
import { FEATURED_GUIDE, GUIDE_ORDER, summarizeProjects } from './buildHome';
import type { ProjectState, ProjectSummary } from './buildHome';

const GUIDE_ICONS: Record<string, string> = {
    'award': ribbonOutline,
    'mouse-pointer-click': handLeftOutline,
    'layout': appsOutline,
    'shield-check': shieldCheckmarkOutline,
    'check-circle': checkmarkCircleOutline,
    'webhook': flashOutline,
    'rocket': rocketOutline,
};

const STATE_LABEL: Record<ProjectState, string> = {
    'app': 'App',
    'running': 'Running',
    'in-progress': 'In progress',
    'not-started': 'No guide yet',
};

const STATE_PILL: Record<ProjectState, string> = {
    'app': 'bg-grayscale-100 text-grayscale-700',
    'running': 'bg-emerald-50 text-emerald-700',
    'in-progress': 'bg-amber-50 text-amber-700',
    'not-started': 'bg-grayscale-100 text-grayscale-600',
};

const guidePath = (id: UseCaseId) => `/app-store/developer/guides/${id}`;

const GuideCard: React.FC<{ id: UseCaseId; onOpen: () => void }> = ({ id, onOpen }) => {
    const guide = USE_CASES[id];
    const icon = GUIDE_ICONS[guide.icon] ?? ribbonOutline;
    const comingSoon = Boolean(guide.comingSoon);

    return (
        <button
            type="button"
            onClick={onOpen}
            disabled={comingSoon}
            className="group text-left w-full bg-white rounded-[20px] border border-grayscale-200 p-5 hover:border-grayscale-300 hover:shadow-md transition-all disabled:hover:shadow-none disabled:hover:border-grayscale-200 disabled:cursor-default"
        >
            <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-2xl bg-grayscale-100 flex items-center justify-center">
                    <IonIcon icon={icon} className="text-xl text-grayscale-700" />
                </span>
                {comingSoon ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-grayscale-100 text-grayscale-500 text-xs font-medium">
                        Coming soon
                    </span>
                ) : (
                    <IonIcon
                        icon={chevronForwardOutline}
                        className="text-grayscale-400 group-hover:text-grayscale-700 transition-colors"
                    />
                )}
            </div>
            <h3
                className={`mt-4 text-base font-semibold ${
                    comingSoon ? 'text-grayscale-500' : 'text-grayscale-900'
                }`}
            >
                {mDynamic(guide.subtitleKey)}
            </h3>
            <p className="mt-1 text-sm text-grayscale-500 leading-relaxed line-clamp-2">
                {mDynamic(guide.descriptionKey)}
            </p>
        </button>
    );
};

const ProjectRow: React.FC<{ project: ProjectSummary; onOpen: () => void }> = ({
    project,
    onOpen,
}) => {
    const guideTitle = project.guideType ? mDynamic(USE_CASES[project.guideType].titleKey) : null;
    const detail =
        project.state === 'in-progress'
            ? `${guideTitle} · Step ${project.step}`
            : project.state === 'not-started'
              ? 'Pick a guide to get started'
              : project.state === 'app'
                ? 'Published from an app'
                : (guideTitle ?? 'Set up and running');

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group w-full flex items-center gap-4 p-4 text-left hover:bg-grayscale-10 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grayscale-900 truncate">
                    {project.integration.name}
                </p>
                <p className="text-xs text-grayscale-500 truncate">{detail}</p>
            </div>
            <span
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_PILL[project.state]}`}
            >
                {STATE_LABEL[project.state]}
            </span>
            <IonIcon
                icon={chevronForwardOutline}
                className="text-grayscale-400 group-hover:text-grayscale-700 transition-colors shrink-0"
            />
        </button>
    );
};

const BuildHomePage: React.FC = () => {
    const history = useHistory();
    const { integrations, isLoadingIntegrations } = useDeveloperPortalContext();
    const { useMyApps } = useDeveloperPortal();
    const { data: apps, isLoading: isLoadingApps } = useMyApps(
        isLoadingIntegrations ? undefined : integrations
    );
    const appIntegrationIds = new Set((apps ?? []).map(app => app.integrationId));
    const projects = summarizeProjects(integrations, appIntegrationIds);
    const appCount = apps?.length ?? 0;

    return (
        <IonPage>
            <AppStoreHeader title="Build" />
            <IonContent>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 font-poppins animate-fade-in-up">
                    <h1 className="text-2xl font-semibold text-grayscale-900">
                        What do you want to build?
                    </h1>
                    <p className="text-sm text-grayscale-600 mt-1">
                        Pick a guide. We'll walk you through it, step by step.
                    </p>

                    <button
                        type="button"
                        onClick={() => history.push(guidePath(FEATURED_GUIDE))}
                        className="group mt-8 w-full text-left rounded-[20px] bg-grayscale-900 p-6 sm:p-8 hover:opacity-95 transition-opacity"
                    >
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
                            <IonIcon icon={sparklesOutline} />
                            Most popular
                        </span>
                        <h2 className="mt-4 text-xl font-semibold text-white">
                            Build an app with AI
                        </h2>
                        <p className="mt-1 text-sm text-white/70 max-w-lg leading-relaxed">
                            Make it in Lovable, Bolt, v0, or your own code. It runs inside LearnCard
                            and can sign people in, give out credentials, and more.
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white">
                            Start building
                            <IonIcon
                                icon={arrowForwardOutline}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </span>
                    </button>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {GUIDE_ORDER.map(id => (
                            <GuideCard
                                key={id}
                                id={id}
                                onOpen={() => history.push(guidePath(id))}
                            />
                        ))}
                    </div>

                    <div className="mt-12">
                        <h2 className="text-base font-semibold text-grayscale-900">
                            Continue where you left off
                        </h2>
                        {isLoadingIntegrations || isLoadingApps ? (
                            <div className="flex justify-center py-10">
                                <IonSpinner name="crescent" />
                            </div>
                        ) : projects.length === 0 ? (
                            <p className="mt-2 text-sm text-grayscale-500">
                                Guides you start show up here.
                            </p>
                        ) : (
                            <div className="mt-3 bg-white rounded-[20px] border border-grayscale-200 divide-y divide-grayscale-100 overflow-hidden">
                                {projects.map(project => (
                                    <ProjectRow
                                        key={project.integration.id}
                                        project={project}
                                        onOpen={() => history.push(project.path)}
                                    />
                                ))}
                            </div>
                        )}
                        {appCount > 0 && (
                            <button
                                type="button"
                                onClick={() => history.push('/app-store/developer')}
                                className="mt-4 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors inline-flex items-center gap-1"
                            >
                                {appCount === 1
                                    ? 'Your app is in the Apps tab'
                                    : `Your ${appCount} apps are in the Apps tab`}
                                <IonIcon icon={arrowForwardOutline} />
                            </button>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default BuildHomePage;
