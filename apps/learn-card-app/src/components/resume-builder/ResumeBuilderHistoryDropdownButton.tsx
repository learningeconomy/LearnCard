import React, { useState } from 'react';
import moment from 'moment';
import { IonItem, IonList, IonPopover, IonSpinner } from '@ionic/react';
import ResumeHistoryIcon from '../../assets/images/resume-history-icon.svg';
import useExistingResumes, { ExistingResume } from '../../hooks/useExistingResumes';
import { getResumeDisplaySummary } from './resume-builder-history.helpers';

export const ResumeBuilderHistoryDropdownButton: React.FC<{
    activeResumeRecordId?: string | null;
    disabled?: boolean;
    onSelectResume: (resume: ExistingResume) => Promise<void> | void;
}> = ({ activeResumeRecordId, disabled = false, onSelectResume }) => {
    const { data: resumes = [], isLoading } = useExistingResumes();

    const [isOpen, setIsOpen] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    const sortedResumes = [...resumes].sort((a, b) => {
        const aDate = new Date(
            (typeof a.record.generatedAt === 'string' && a.record.generatedAt) ||
                a.vc?.validFrom ||
                a.vc?.issuanceDate ||
                0
        ).getTime();
        const bDate = new Date(
            (typeof b.record.generatedAt === 'string' && b.record.generatedAt) ||
                b.vc?.validFrom ||
                b.vc?.issuanceDate ||
                0
        ).getTime();

        return bDate - aDate;
    });

    return (
        <>
            <button
                type="button"
                disabled={disabled}
                onClick={event => {
                    setPopoverEvent(event.nativeEvent);
                    setIsOpen(true);
                }}
                className={`inline-flex items-center gap-2 py-1 px-4 rounded-full border-[1px] border-indigo-500 border-solid  disabled:opacity-60 disabled:cursor-not-allowed ${
                    isOpen ? 'bg-indigo-50' : 'bg-white'
                }`}
            >
                <img src={ResumeHistoryIcon} alt="Resume history" className="w-6 h-6" />
                <span className="text-[18px] font-semibold text-grayscale-800">
                    {sortedResumes.length}
                </span>
            </button>

            <IonPopover
                isOpen={isOpen}
                event={popoverEvent}
                reference="event"
                side="bottom"
                alignment="start"
                onDidDismiss={() => {
                    setIsOpen(false);
                    setPopoverEvent(undefined);
                    setSelectedResumeId(null);
                }}
                className="resume-history-popover"
            >
                <div className="bg-white rounded-[24px] p-3">
                    <div className="px-3 py-2">
                        <p className="text-[18px] font-semibold text-grayscale-900">
                            Resume History
                        </p>
                        <p className="text-sm text-grayscale-600">
                            Select a resume to continue editing or sharing it.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <IonSpinner name="crescent" />
                        </div>
                    ) : sortedResumes.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-grayscale-600">
                            No existing resumes yet.
                        </div>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto pr-1">
                            <IonList lines="none" className="bg-transparent">
                                {sortedResumes.map(resume => {
                                    const summary = getResumeDisplaySummary(resume);
                                    const isActive = resume.record.id === activeResumeRecordId;
                                    const isSelecting = selectedResumeId === resume.record.id;

                                    return (
                                        <IonItem
                                            key={resume.record.id}
                                            button
                                            detail={false}
                                            disabled={isSelecting}
                                            className={`rounded-[18px] mb-2 [--background:transparent] [--inner-padding-end:0] [--padding-start:0] ${
                                                isActive ? 'bg-indigo-50' : 'bg-transparent'
                                            }`}
                                            onClick={async () => {
                                                setSelectedResumeId(resume.record.id);
                                                await onSelectResume(resume);
                                                setIsOpen(false);
                                                setSelectedResumeId(null);
                                            }}
                                        >
                                            <div className="w-full flex items-start gap-3 px-3 py-3">
                                                <img
                                                    src={ResumeHistoryIcon}
                                                    alt=""
                                                    className="w-9 h-9 shrink-0 mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-[16px] leading-[120%] font-semibold text-grayscale-900 break-words">
                                                                {summary.title}
                                                            </p>
                                                            <p className="mt-1 text-[14px] leading-[120%] font-semibold text-grayscale-700 break-words">
                                                                {summary.subtitle}
                                                            </p>
                                                        </div>
                                                        {isSelecting && (
                                                            <IonSpinner
                                                                name="crescent"
                                                                className="w-4 h-4 shrink-0"
                                                            />
                                                        )}
                                                    </div>

                                                    <p className="mt-2 text-[13px] text-grayscale-600">
                                                        {summary.credentialCount} Credentials
                                                        {' • '}
                                                        {summary.generatedAt
                                                            ? `Edited on ${moment(
                                                                  summary.generatedAt
                                                              ).format('MMM D, YYYY')}`
                                                            : 'No edit date'}
                                                        {' • '}
                                                        <span
                                                            className={
                                                                summary.status === 'Published'
                                                                    ? 'text-emerald-600 font-semibold'
                                                                    : 'text-grayscale-500 font-semibold'
                                                            }
                                                        >
                                                            {summary.status}
                                                        </span>
                                                        {isActive ? (
                                                            <span className="ml-2 text-indigo-600 font-semibold">
                                                                Active
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                </div>
                                            </div>
                                        </IonItem>
                                    );
                                })}
                            </IonList>
                        </div>
                    )}
                </div>
            </IonPopover>
        </>
    );
};

export default ResumeBuilderHistoryDropdownButton;
