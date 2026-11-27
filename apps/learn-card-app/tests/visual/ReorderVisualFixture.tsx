import React, { useCallback, useRef, useState } from 'react';
import { IonApp, IonContent } from '@ionic/react';
import { AppReorder as Reorder, AppReorderGroup as ReorderGroup } from 'learn-card-base/ui/reorder';
import { CredentialCategoryEnum } from 'learn-card-base';

import ResumePreviewGroupedCredentialsBlock from '../../src/components/resume-builder/resume-preview/ResumePreviewGroupedCredentialsBlock';
import { RESUME_SECTIONS } from '../../src/components/resume-builder/resume-builder.helpers';
import type {
    CredentialEntry,
    ResumeFieldEntry,
} from '../../src/components/resume-builder/resume-builder.helpers';
import { resumeBuilderStore } from '../../src/stores/resumeBuilderStore';
import { personaCredentials } from '../../src/pages/dashboard/dashboard.personas';
import VerticalArrowsIcon from '../../src/components/svgs/VerticalArrowsIcon';

/**
 * `reorder-1`: the reorder call sites in learn-card-app, one per page (`&case=<id>`).
 * - `resume` / `resume-content`: the real ResumePreviewGroupedCredentialsBlock (outer group, one row per
 *   credential, handle in ResumePreviewCredentialActionRail) with ResumePreviewCredentialToTextBlock's nested
 *   group (one row per field, handles on the detail rows) for the work-history section, seeded through
 *   resumeBuilderStore. `resume` scrolls in a plain `overflow-y-auto` div like ResumeBuilder's preview
 *   wrapper; `resume-content` scrolls in an ion-content.
 * - `simple` / `simple-disabled`: a plain group with the reorder events logged, a click counter on the rows
 *   and one handle without children (the default icon).
 * Readouts: the store's credential and field order, and the events.
 */
const SECTION = RESUME_SECTIONS.find(s => s.key === CredentialCategoryEnum.workHistory)!;
const VC1 = personaCredentials['lc:cloud:rec-1'];
const RESOLVED = {
    'lc:cloud:rec-1': VC1,
    'lc:cloud:rec-2': personaCredentials['lc:cloud:rec-2'],
    'lc:cloud:rec-3': personaCredentials['lc:cloud:rec-3'],
    'lc:cloud:rec-4': { ...VC1, name: 'Field Operations Lead' },
};
const SHORT: Record<string, string> = {
    'lc:cloud:rec-1': 'A',
    'lc:cloud:rec-2': 'B',
    'lc:cloud:rec-3': 'C',
    'lc:cloud:rec-4': 'D',
};

const field = (
    id: string,
    index: number,
    type: ResumeFieldEntry['type'],
    value: string
): ResumeFieldEntry => ({ id, index, type, value, source: 'selfAttested', hidden: false });

const seedEntries = (): CredentialEntry[] =>
    Object.keys(SHORT).map((uri, i) => {
        const s = SHORT[uri];
        const details = i === 0 ? ['one', 'two', 'three'] : ['one', 'two'];
        return {
            uri,
            index: i,
            fields: [
                field(`${s}-desc`, 0, 'description', `${s} description of the role.`),
                ...details.map((d, j) => field(`${s}-${d}`, j + 1, 'metadata', `${s} detail ${d}`)),
                field(`${s}-add`, details.length + 1, 'metadata', ''),
            ],
        };
    });

let seeded = false;
const seed = () => {
    if (seeded) return;
    seeded = true;
    resumeBuilderStore.set.credentialEntries({
        [CredentialCategoryEnum.workHistory]: seedEntries(),
    });
};

const StoreReadouts: React.FC = () => {
    const entries =
        resumeBuilderStore.useTracked.credentialEntries()[CredentialCategoryEnum.workHistory];
    const sorted = [...(entries ?? [])].sort((a, b) => a.index - b.index);
    return (
        <>
            <div>
                {'order: '}
                <output data-testid="ro-order">{sorted.map(e => SHORT[e.uri]).join(',')}</output>
            </div>
            {sorted.map(e => (
                <div key={e.uri}>
                    fields-{SHORT[e.uri]}:{' '}
                    <output data-testid={`ro-fields-${SHORT[e.uri]}`}>
                        {[...e.fields]
                            .sort((a, b) => a.index - b.index)
                            .map(f => f.id.split('-')[1])
                            .join(',')}
                    </output>
                </div>
            ))}
        </>
    );
};

const Resume: React.FC = () => {
    seed();
    const isMobile = window.innerWidth < 768;
    const cardClasses = isMobile
        ? 'w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-xl px-4 py-6 font-sans'
        : 'w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 font-sans';
    return (
        <div className={cardClasses}>
            <ResumePreviewGroupedCredentialsBlock
                section={SECTION}
                isMobile={isMobile}
                resolvedCredentialsByUri={RESOLVED}
            />
        </div>
    );
};

type Report = (key: string, value: string) => void;

const ROWS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

const Simple: React.FC<{ report: Report; disabled?: boolean }> = ({ report, disabled = false }) => {
    const [rows, setRows] = useState(ROWS);
    const log = useRef({ start: 0, move: '-', end: '-', ends: 0, clicks: 0 });
    const push = useCallback(() => {
        const l = log.current;
        report(
            'events',
            `start=${l.start} move=${l.move} end=${l.end} ends=${l.ends} clicks=${l.clicks}`
        );
    }, [report]);
    return (
        <div
            data-testid="simple-scroll"
            className="h-[300px] overflow-y-auto rounded-[16px] bg-white"
        >
            <ReorderGroup
                disabled={disabled}
                onIonReorderStart={() => {
                    log.current.start += 1;
                    push();
                }}
                onIonReorderMove={e => {
                    log.current.move = `${e.detail.from}>${e.detail.to}`;
                    push();
                }}
                onIonReorderEnd={e => {
                    const { from, to } = e.detail;
                    log.current.end = `${from}>${to}`;
                    log.current.ends += 1;
                    push();
                    const next = [...rows];
                    const [moved] = next.splice(from, 1);
                    next.splice(to, 0, moved);
                    setRows(next);
                    report('rows', next.join(','));
                    e.detail.complete();
                }}
            >
                {rows.map((row, i) => (
                    <div
                        key={row}
                        className="flex items-center gap-3 border-b border-grayscale-200 bg-white px-4 py-3 text-sm text-grayscale-900"
                        onClick={() => {
                            log.current.clicks += 1;
                            push();
                        }}
                    >
                        <span className="flex-1">{row}</span>
                        {i === 2 ? (
                            <Reorder />
                        ) : (
                            <div className="shrink-0 text-grayscale-700 bg-grayscale-100 rounded-[10px] leading-none h-[32px] w-[32px] flex items-center justify-center">
                                <Reorder>
                                    <VerticalArrowsIcon />
                                </Reorder>
                            </div>
                        )}
                    </div>
                ))}
            </ReorderGroup>
        </div>
    );
};

const CASES: Record<string, (report: Report) => React.ReactNode> = {
    resume: () => (
        <div data-testid="scroll" className="h-[520px] overflow-y-auto bg-grayscale-100 py-2">
            <Resume />
        </div>
    ),
    'resume-content': () => (
        <div className="relative h-[520px]">
            <IonContent data-testid="scroll">
                <Resume />
            </IonContent>
        </div>
    ),
    simple: report => <Simple report={report} />,
    'simple-disabled': report => <Simple report={report} disabled />,
};

const FixtureBody: React.FC = () => {
    const id = new URLSearchParams(window.location.search).get('case') ?? 'resume';
    const render = CASES[id] ?? CASES.resume;
    const [readouts, setReadouts] = useState<Record<string, string>>({});
    const report = useCallback<Report>(
        (key, value) => setReadouts(r => (r[key] === value ? r : { ...r, [key]: value })),
        []
    );
    return (
        <div
            id="ion-view-container-root"
            className="absolute inset-0 overflow-hidden bg-grayscale-100"
        >
            <main className="mx-auto flex w-full max-w-[900px] flex-col gap-3 p-4 font-poppins">
                <section data-testid="r1-stage" className="w-full">
                    {render(report)}
                </section>
                <section
                    data-testid="r1-readouts"
                    className="rounded-[16px] bg-white p-3 font-mono text-[11px] text-grayscale-800"
                >
                    <div>
                        case: <output data-testid="ro-ready">{id}</output>
                    </div>
                    {id.startsWith('resume') && <StoreReadouts />}
                    {Object.keys(readouts)
                        .sort()
                        .map(key => (
                            <div key={key}>
                                {key}: <output data-testid={`ro-${key}`}>{readouts[key]}</output>
                            </div>
                        ))}
                </section>
            </main>
        </div>
    );
};

export const ReorderVisualFixture: React.FC = () => (
    <IonApp>
        <FixtureBody />
    </IonApp>
);
