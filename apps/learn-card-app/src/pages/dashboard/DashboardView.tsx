import React from 'react';

import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';

import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import DashboardHeaderCard from './components/DashboardHeaderCard';
import CurrentGoalCard from './components/CurrentGoalCard';
import QuickActionsRow from './components/QuickActionsRow';
import GetStartedChecklist from './components/GetStartedChecklist';
import ActivityCard from './components/ActivityCard';
import LearningProfileCard from './components/LearningProfileCard';
import AppsCard from './components/AppsCard';
import DataTrustCard from './components/DataTrustCard';
import type { DashboardViewModel } from './DashboardView.types';

type DashboardViewProps = {
    vm: DashboardViewModel;
};

const DashboardView: React.FC<DashboardViewProps> = ({ vm }) => {
    const {
        brandName,
        header,
        heroSlot,
        checklistItems,
        onDismissGetStarted,
        goalSummary,
        pathwaysEnabled,
        reviewsDueToday,
        onContinueGoal,
        onReviewGoal,
        primaryButtonClass,
        slots,
        dataTrust,
        activity,
        learningProfile,
        apps,
    } = vm;

    return (
        <div className="flex justify-center w-full font-poppins">
            <div className="w-full max-w-[1200px] flex flex-col gap-5 px-4 pt-4 pb-[100px] desktop:px-8 desktop:pt-6 safe-area-top-margin">
                <GenericErrorBoundary>
                    <DashboardHeaderCard
                        brandName={brandName}
                        displayName={header.displayName}
                        profileImage={header.profileImage}
                        heroImage={header.heroImage}
                        profileRole={header.profileRole}
                        shortBio={header.shortBio}
                        affiliation={header.affiliation}
                        stats={header.stats}
                        professionalTitle={header.professionalTitle}
                        experience={header.experience ?? null}
                        skills={header.skills}
                        onSkillPillClick={header.onSkillPillClick}
                        onAvatarClick={header.onAvatarClick}
                        topRightAction={
                            <button
                                type="button"
                                onClick={header.onScanQrTopRight}
                                aria-label="Open QR scanner"
                                className="w-9 h-9 rounded-full bg-grayscale-100 hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800 active:scale-95"
                            >
                                <QRCodeScanner version="2" />
                            </button>
                        }
                    />
                </GenericErrorBoundary>

                <GenericErrorBoundary>
                    <QuickActionsRow slots={slots} />
                </GenericErrorBoundary>

                <div className="grid grid-cols-1 desktop:grid-cols-12 gap-5">
                    <div className="flex flex-col gap-5 desktop:col-span-7 min-w-0">
                        {heroSlot === 'getStarted' ? (
                            <GenericErrorBoundary>
                                <GetStartedChecklist
                                    brandName={brandName}
                                    items={checklistItems}
                                    onDismiss={onDismissGetStarted}
                                    variant="hero"
                                    primaryButtonClass={primaryButtonClass}
                                />
                            </GenericErrorBoundary>
                        ) : (
                            <GenericErrorBoundary>
                                <CurrentGoalCard
                                    goalSummary={goalSummary}
                                    pathwaysEnabled={pathwaysEnabled}
                                    reviewsDueToday={reviewsDueToday}
                                    onContinue={onContinueGoal}
                                    onReview={onReviewGoal}
                                    primaryButtonClass={primaryButtonClass}
                                    variant="hero"
                                />
                            </GenericErrorBoundary>
                        )}
                    </div>
                    <div className="flex flex-col gap-5 desktop:col-span-5 min-w-0">
                        <GenericErrorBoundary>
                            <ActivityCard
                                notifications={activity.notifications}
                                pendingContractRequests={activity.pendingContractRequests}
                                pendingConnections={activity.pendingConnections}
                                records={activity.records}
                                isLoading={activity.isLoading}
                                emptyTips={activity.emptyTips}
                            />
                        </GenericErrorBoundary>
                    </div>
                </div>

                <div className="w-full">
                    <GenericErrorBoundary>
                        <LearningProfileCard vm={learningProfile} />
                    </GenericErrorBoundary>
                </div>

                <GenericErrorBoundary>
                    <AppsCard
                        installedApps={apps.installedApps}
                        suggestedApps={apps.suggestedApps}
                        unreadByListing={apps.unreadByListing}
                        onInstallSuccess={apps.onInstallSuccess}
                        variant="featured"
                    />
                </GenericErrorBoundary>

                <GenericErrorBoundary>
                    <DataTrustCard vm={dataTrust} />
                </GenericErrorBoundary>
            </div>
        </div>
    );
};

export default DashboardView;
