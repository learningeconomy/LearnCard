import { useState } from 'react';
import { IonItem, IonLabel, IonList, IonPopover } from '@ionic/react';

import {
    clrUniversityTranscript,
    clrNdStudentTranscript,
    clrGreatPlainsFull,
    clrMinimal,
    clrWestbridgeFull,
    clrCompetencyAligned,
} from '@learncard/credential-library';

import {
    normalizeClrTranscriptDisplayModel,
    ClrTranscriptSurface,
    type ClrTranscriptViewer,
} from '../../helpers/clrRenderer.helpers';
import {
    ClrTranscriptCard,
    ClrTranscriptEmbedWidget,
    ClrTranscriptFullPage,
} from '../../components/clr-transcript';

const FIXTURES = {
    westbridge: clrWestbridgeFull.credential as Record<string, unknown>,
    university: clrUniversityTranscript.credential as Record<string, unknown>,
    nd: clrNdStudentTranscript.credential as Record<string, unknown>,
    greatPlains: clrGreatPlainsFull.credential as Record<string, unknown>,
    minimal: clrMinimal.credential as Record<string, unknown>,
    competencyAligned: clrCompetencyAligned.credential as Record<string, unknown>,
};

const FIXTURE_LABELS: Record<string, string> = {
    westbridge: 'Westbridge (Full)',
    university: 'University',
    nd: 'North Dakota',
    greatPlains: 'Great Plains',
    minimal: 'Minimal',
    competencyAligned: 'Competency Aligned',
};

const VIEWER_LABELS: Record<string, string> = {
    student: 'Student',
    employer: 'Employer',
    admin: 'Admin',
    registrar: 'Registrar',
};

type FixtureKey = keyof typeof FIXTURES;

const ClrTranscriptRendererDemo = () => {
    const [fixture, setFixture] = useState<FixtureKey>('westbridge');
    const [viewer, setViewer] = useState<ClrTranscriptViewer>('student');
    const [surface, setSurface] = useState<ClrTranscriptSurface>(ClrTranscriptSurface.Full);

    const [fixturePopoverOpen, setFixturePopoverOpen] = useState(false);
    const [fixturePopoverEvent, setFixturePopoverEvent] = useState<Event | undefined>(undefined);

    const [viewerPopoverOpen, setViewerPopoverOpen] = useState(false);
    const [viewerPopoverEvent, setViewerPopoverEvent] = useState<Event | undefined>(undefined);

    const currentModel = normalizeClrTranscriptDisplayModel(FIXTURES[fixture]);

    // return (
    //     <div className="bg-grayscale-10 h-screen overflow-y-auto font-poppins flex flex-col">
    //         <ClrTranscriptFullPage
    //             model={currentModel}
    //             credential={FIXTURES[fixture] as any}
    //             options={{ viewer, surface }}
    //         />
    //     </div>
    // );

    return (
        <div className="bg-grayscale-10 h-screen overflow-y-auto font-poppins flex flex-col">
            {/* Controls header */}
            <div className="px-4 pt-4 pb-3 space-y-3 bg-white border-b border-grayscale-200 shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-base font-semibold text-grayscale-900">CLR Renderer</h1>
                    <span className="text-xs text-grayscale-400 font-mono">
                        {currentModel.quality.level}
                    </span>
                </div>

                {/* Popover dropdowns — left-aligned, auto width */}
                <div className="flex items-center gap-2">
                    {/* Fixture picker */}
                    <button
                        type="button"
                        onClick={e => {
                            setFixturePopoverEvent(e.nativeEvent);
                            setFixturePopoverOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-grayscale-200 bg-grayscale-50 text-sm font-medium text-grayscale-800"
                    >
                        {FIXTURE_LABELS[fixture]}
                        <span className="text-grayscale-400 text-xs">▾</span>
                    </button>

                    <IonPopover
                        isOpen={fixturePopoverOpen}
                        event={fixturePopoverEvent}
                        reference="event"
                        side="bottom"
                        alignment="start"
                        onDidDismiss={() => {
                            setFixturePopoverOpen(false);
                            setFixturePopoverEvent(undefined);
                        }}
                    >
                        <div className="bg-white rounded-[16px] p-1.5">
                            <IonList lines="none" className="bg-transparent">
                                {(Object.keys(FIXTURES) as FixtureKey[]).map(key => (
                                    <IonItem
                                        key={key}
                                        button
                                        detail={false}
                                        className={`rounded-[12px] [--background:transparent] [--inner-padding-end:0] [--padding-start:12px] [--padding-end:12px] ${
                                            fixture === key ? 'bg-grayscale-100' : ''
                                        }`}
                                        onClick={() => {
                                            setFixture(key);
                                            setFixturePopoverOpen(false);
                                        }}
                                    >
                                        <IonLabel className="text-sm font-medium text-grayscale-900 font-poppins py-1">
                                            {FIXTURE_LABELS[key]}
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        </div>
                    </IonPopover>

                    {/* Viewer picker */}
                    {/* <button
                        type="button"
                        onClick={e => {
                            setViewerPopoverEvent(e.nativeEvent);
                            setViewerPopoverOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-grayscale-200 bg-grayscale-50 text-sm font-medium text-grayscale-800"
                    >
                        {VIEWER_LABELS[viewer]}
                        <span className="text-grayscale-400 text-xs">▾</span>
                    </button> */}

                    <IonPopover
                        isOpen={viewerPopoverOpen}
                        event={viewerPopoverEvent}
                        reference="event"
                        side="bottom"
                        alignment="start"
                        onDidDismiss={() => {
                            setViewerPopoverOpen(false);
                            setViewerPopoverEvent(undefined);
                        }}
                    >
                        <div className="bg-white rounded-[16px] p-1.5">
                            <IonList lines="none" className="bg-transparent">
                                {(Object.keys(VIEWER_LABELS) as ClrTranscriptViewer[]).map(key => (
                                    <IonItem
                                        key={key}
                                        button
                                        detail={false}
                                        className={`rounded-[12px] [--background:transparent] [--inner-padding-end:0] [--padding-start:12px] [--padding-end:12px] ${
                                            viewer === key ? 'bg-grayscale-100' : ''
                                        }`}
                                        onClick={() => {
                                            setViewer(key);
                                            setViewerPopoverOpen(false);
                                        }}
                                    >
                                        <IonLabel className="text-sm font-medium text-grayscale-900 font-poppins py-1">
                                            {VIEWER_LABELS[key]}
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        </div>
                    </IonPopover>
                </div>

                {/* Surface tabs */}
                {/* <div className="bg-grayscale-100 flex rounded-full py-[2px] px-[1px]">
                    {(
                        [
                            ClrTranscriptSurface.Full,
                            ClrTranscriptSurface.Card,
                            ClrTranscriptSurface.Embed,
                        ] as const
                    ).map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSurface(s)}
                            className={`flex-1 py-[12px] rounded-full text-[14px] font-semibold font-poppins text-grayscale-900 transition-colors ${
                                surface === s ? 'bg-white shadow-sm' : ''
                            }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div> */}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {surface === ClrTranscriptSurface.Card && (
                    <ClrTranscriptCard
                        model={currentModel}
                        boost={FIXTURES[fixture] as any}
                        onViewDetails={() => setSurface(ClrTranscriptSurface.Full)}
                    />
                )}
                {surface === ClrTranscriptSurface.Embed && (
                    <ClrTranscriptEmbedWidget model={currentModel} />
                )}
                {surface === ClrTranscriptSurface.Full && (
                    <ClrTranscriptFullPage
                        model={currentModel}
                        boost={FIXTURES[fixture] as any}
                        options={{ viewer, surface }}
                    />
                )}
            </div>
        </div>
    );
};

export default ClrTranscriptRendererDemo;
