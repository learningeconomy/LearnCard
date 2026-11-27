import React, { useState } from 'react';
import { AppItem, AppLabel, AppList } from 'learn-card-base/ui/list';

import { CheckListItemSkeleton } from '../../src/components/learncard/checklist/checklist-steps/CheckListItemSkeleton';

/**
 * `list-1`: the app's IonList, IonItem and IonLabel call sites (phase 4, list batch), rendered with fixed
 * local data and no backend.
 * - Matrices cover what the call sites pass: list `lines` and `role`, item `lines`, `button`,
 *   `detail={false}`, `disabled`, the `--background` / `--padding-*` / `--inner-padding-*` /
 *   `--border-color` custom properties (as Tailwind arbitrary properties, inline style and the
 *   `notificaion-list-item` class), and labels inside and outside items.
 * - Excerpts are copied from the cited source lines. CheckListItemSkeleton renders for real.
 * - Every clickable item reports its clicks in the section's `output`, so the capture can record
 *   which clicks reach the call site.
 */

const Block: React.FC<{ testId: string; title: string; children: React.ReactNode }> = ({
    testId,
    title,
    children,
}) => (
    <section data-testid={testId} className="w-full max-w-[800px] flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-grayscale-600">
            {title}
        </h2>
        {children}
    </section>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col gap-1 rounded-xl p-2 w-[240px] bg-grayscale-100">
        <div className="w-full">{children}</div>
        <span className="text-[10px] font-mono">{label}</span>
    </div>
);

const useClicks = (): [string[], (id: string) => () => void] => {
    const [clicks, setClicks] = useState<string[]>([]);
    return [clicks, (id: string) => () => setClicks(previous => [...previous, id])];
};

const Clicks: React.FC<{ clicks: string[] }> = ({ clicks }) => (
    <output className="text-[10px] font-mono" data-testid="clicks">
        {JSON.stringify(clicks)}
    </output>
);

const SORT_OPTIONS = [
    { id: 1, title: 'Recent' },
    { id: 2, title: 'Alphabetical' },
    { id: 3, title: 'Most sessions' },
];

export const ListVisualFixture: React.FC = () => {
    const [matrixClicks, onMatrix] = useClicks();
    const [sortClicks, onSort] = useClicks();
    const [resumeClicks, onResume] = useClicks();
    const [demoClicks, onDemo] = useClicks();
    const [scopeClicks, onScope] = useClicks();
    const [sortBy, setSortBy] = useState(1);

    return (
        <main className="flex flex-col items-center gap-6 p-4">
            <Block testId="l1-list-matrix" title="IonList lines / role (synthetic)">
                <div className="flex flex-wrap gap-2">
                    <Cell label="list default, items default">
                        <AppList>
                            <AppItem>Item one</AppItem>
                            <AppItem>Item two</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label='list lines="none"'>
                        <AppList lines="none">
                            <AppItem>Item one</AppItem>
                            <AppItem>Item two</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label='list lines="full"'>
                        <AppList lines="full">
                            <AppItem>Item one</AppItem>
                            <AppItem>Item two</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label='list lines="inset"'>
                        <AppList lines="inset">
                            <AppItem>Item one</AppItem>
                            <AppItem>Item two</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label='list none, item lines="full"'>
                        <AppList lines="none">
                            <AppItem lines="full">Item full</AppItem>
                            <AppItem>Item default</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label="list classes (py-4 rounded bg-white)">
                        <AppList className="py-4 rounded-[20px] bg-white">
                            <AppItem lines="none">Item</AppItem>
                        </AppList>
                    </Cell>
                    <Cell label="list bg-transparent, empty">
                        <AppList lines="none" className="bg-transparent" />
                    </Cell>
                    <Cell label='role="navigation" aria-label'>
                        <AppList
                            role="navigation"
                            aria-label="Primary navigation"
                            className="m-4 rounded-2xl py-3"
                        >
                            <a href="#nav">Link</a>
                        </AppList>
                    </Cell>
                    <Cell label='role="presentation"'>
                        <AppList className="w-full h-full bg-transparent" role="presentation">
                            <ul className="m-0 p-0 list-none">
                                <li>
                                    <button type="button">Wallet</button>
                                </li>
                            </ul>
                        </AppList>
                    </Cell>
                </div>
            </Block>

            <Block testId="l1-item-matrix" title="IonItem states (synthetic)">
                <div className="flex flex-wrap gap-2">
                    <Cell label="item outside list">
                        <AppItem>Plain item</AppItem>
                    </Cell>
                    <Cell label='lines="none"'>
                        <AppItem lines="none">No lines</AppItem>
                    </Cell>
                    <Cell label='lines="full"'>
                        <AppItem lines="full">Full line</AppItem>
                    </Cell>
                    <Cell label='lines="inset"'>
                        <AppItem lines="inset">Inset line</AppItem>
                    </Cell>
                    <Cell label="button detail={false}">
                        <AppItem
                            data-testid="m-button"
                            button
                            detail={false}
                            onClick={onMatrix('button')}
                        >
                            Button item
                        </AppItem>
                    </Cell>
                    <Cell label="button lines none, in list">
                        <AppList>
                            <AppItem
                                data-testid="m-button-in-list"
                                button={true}
                                detail={false}
                                lines="none"
                                onClick={onMatrix('button-in-list')}
                            >
                                Button in list
                            </AppItem>
                        </AppList>
                    </Cell>
                    <Cell label="button disabled">
                        <AppItem
                            data-testid="m-disabled"
                            button
                            detail={false}
                            disabled
                            onClick={onMatrix('disabled')}
                        >
                            Disabled button
                        </AppItem>
                    </Cell>
                    <Cell label="not button, onClick">
                        <AppItem
                            data-testid="m-plain-click"
                            lines="none"
                            onClick={onMatrix('plain')}
                        >
                            Plain, clickable
                        </AppItem>
                    </Cell>
                    <Cell label="--vars via Tailwind">
                        <AppItem
                            button
                            detail={false}
                            className="rounded-[12px] [--background:transparent] [--inner-padding-end:0] [--padding-start:12px] [--padding-end:12px] bg-grayscale-100"
                        >
                            Custom padding
                        </AppItem>
                    </Cell>
                    <Cell label="--border-color inline">
                        <AppList>
                            <AppItem
                                style={{ '--border-color': 'transparent' } as React.CSSProperties}
                            >
                                Transparent line
                            </AppItem>
                        </AppList>
                    </Cell>
                    <Cell label="--background --min-height">
                        <AppItem
                            lines="none"
                            style={
                                {
                                    '--background': '#fef3c7',
                                    '--min-height': '64px',
                                } as React.CSSProperties
                            }
                        >
                            Amber, 64px
                        </AppItem>
                    </Cell>
                    <Cell label="notificaion-list-item">
                        <AppItem
                            lines="none"
                            className="w-full ion-no-border px-[12px] py-[10px] flex items-center justify-between notificaion-list-item"
                        >
                            No padding vars
                        </AppItem>
                    </Cell>
                    <Cell label="ion-label in item">
                        <AppItem lines="none">
                            <AppLabel>Label inside item with a long text that wraps</AppLabel>
                        </AppItem>
                    </Cell>
                    <Cell label="ion-label outside item">
                        <span>
                            a <AppLabel className="text-sm">inline label</AppLabel> b
                        </span>
                    </Cell>
                </div>
                <Clicks clicks={matrixClicks} />
            </Block>

            {/* AiSessionsPopOverButton.tsx:83-112 (same pattern in the Learner insights and LaunchPad
                popovers and the three FilterSortingOptions modals). */}
            <Block testId="l1-x-sort-popover" title="Sort popover list (excerpt)">
                <div className="w-[260px] bg-white rounded-[12px] shadow-xs">
                    <AppList>
                        {SORT_OPTIONS.map(option => (
                            <AppItem
                                className="font-notoSans text-sm flex items-center justify-start text-left"
                                key={option.id}
                                data-testid={`sort-${option.id}`}
                                lines="none"
                                button={true}
                                detail={false}
                                onClick={() => {
                                    setSortBy(option.id);
                                    onSort(`sort-${option.id}`)();
                                }}
                            >
                                {option.id === sortBy ? (
                                    <span className="text-grayscale-800 w-[24px] h-[24px] mr-1">
                                        ✓
                                    </span>
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                Sort by {option.title}
                            </AppItem>
                        ))}
                    </AppList>
                </div>
                <div className="w-[300px]">
                    {/* LaunchPadFilterSortingOptionsModal.tsx:33-58 */}
                    <AppList className="py-4 rounded-[20px] bg-white">
                        <AppItem
                            className="font-notoSans text-sm flex items-center justify-start text-left"
                            lines="none"
                            button={true}
                            detail={false}
                        >
                            Filter: All apps
                        </AppItem>
                    </AppList>
                </div>
                <Clicks clicks={sortClicks} />
            </Block>

            {/* ResumeBuilderHistoryDropdownButton.tsx:132-175 (active, idle and selecting rows). */}
            <Block testId="l1-x-resume-history" title="Resume history rows (excerpt)">
                <div className="max-h-[360px] overflow-y-auto pr-1 w-[360px] bg-white rounded-[20px] p-2">
                    <AppList lines="none" className="bg-transparent">
                        {['active', 'idle', 'selecting'].map(state => (
                            <AppItem
                                key={state}
                                data-testid={`resume-${state}`}
                                button
                                detail={false}
                                disabled={state === 'selecting'}
                                className={`rounded-[18px] mb-2 [--background:transparent] [--inner-padding-end:0] [--padding-start:0] ${
                                    state === 'active' ? 'bg-indigo-50' : 'bg-transparent'
                                }`}
                                onClick={onResume(`resume-${state}`)}
                            >
                                <div className="w-full flex flex-col items-start gap-3 px-3 py-3">
                                    <div className="flex-1 flex items-start gap-3 min-w-0">
                                        <div className="w-9 h-9 shrink-0 mt-1 rounded bg-grayscale-200" />
                                        <div className="min-w-0">
                                            <p className="text-[16px] leading-[120%] font-semibold text-grayscale-900 wrap-break-word">
                                                Resume ({state})
                                            </p>
                                            <p className="mt-1 text-[14px] leading-[120%] font-semibold text-grayscale-700 wrap-break-word">
                                                Edited on Nov 20, 2026
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AppItem>
                        ))}
                    </AppList>
                </div>
                <Clicks clicks={resumeClicks} />
            </Block>

            {/* AddressBookContactItem.tsx:745-750, NotificationsList.tsx:45-75, UserOptionsModal.tsx:78-110. */}
            <Block
                testId="l1-x-contacts"
                title="Contacts / notifications / user options (excerpts)"
            >
                <div className="bg-grayscale-100 p-2">
                    <AppList
                        lines="none"
                        className="flex flex-col items-center justify-center w-full"
                    >
                        {['Ada Lovelace', 'Grace Hopper'].map(name => (
                            <AppItem
                                key={name}
                                lines="none"
                                className="w-[95%] max-w-3xl ion-no-border px-[12px] py-[10px] flex items-center justify-between notificaion-list-item cursor-pointer last:border-b-0"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="w-10 h-10 rounded-full bg-grayscale-300 mr-3" />
                                    <p className="grow text-grayscale-900 font-medium">{name}</p>
                                    <span className="text-grayscale-400">›</span>
                                </div>
                            </AppItem>
                        ))}
                    </AppList>
                    <AppList
                        lines="none"
                        className="flex flex-col items-center justify-center px-2 w-[90%] max-w-[600px] pt-4"
                    >
                        <AppItem
                            lines="none"
                            className="w-full max-w-3xl mb-2 mt-2 p-0 shadow-3xl rounded-3xl notificaion-list-item"
                        >
                            <div className="w-full p-4 bg-white">
                                New credential from Synthetic Academy
                            </div>
                        </AppItem>
                    </AppList>
                    <AppList lines="none">
                        <AppItem className="w-full">
                            <button className="w-full flex items-center justify-center px-[15px] my-[10px] font-medium text-lg">
                                Delete account
                            </button>
                        </AppItem>
                    </AppList>
                </div>
            </Block>

            {/* ClrTranscriptRendererDemo.tsx:92-112 and CreateAPITokenModal.tsx:216-246. */}
            <Block testId="l1-x-labels" title="Items with labels (excerpts)">
                <div className="flex gap-4 items-start">
                    <div className="bg-white rounded-[16px] p-1.5 w-[260px]">
                        <AppList lines="none" className="bg-transparent">
                            {['Basic', 'Detailed'].map((key, i) => (
                                <AppItem
                                    key={key}
                                    data-testid={`demo-${key}`}
                                    button
                                    detail={false}
                                    className={`rounded-[12px] [--background:transparent] [--inner-padding-end:0] [--padding-start:12px] [--padding-end:12px] ${
                                        i === 0 ? 'bg-grayscale-100' : ''
                                    }`}
                                    onClick={onDemo(`demo-${key}`)}
                                >
                                    <AppLabel className="text-sm font-medium text-grayscale-900 font-poppins py-1">
                                        {key} transcript
                                    </AppLabel>
                                </AppItem>
                            ))}
                        </AppList>
                    </div>
                    <div className="w-[300px] bg-white">
                        <AppList>
                            {['Read', 'Write'].map(scope => (
                                <AppItem
                                    button
                                    data-testid={`scope-${scope}`}
                                    style={
                                        { '--border-color': 'transparent' } as React.CSSProperties
                                    }
                                    className="border-b-grayscale-100! !border-b-solid border-b! last:border-0! p-1"
                                    key={scope}
                                    onClick={onScope(`scope-${scope}`)}
                                >
                                    {scope}
                                </AppItem>
                            ))}
                        </AppList>
                        <div className="p-2">
                            <AppLabel className="w-full">Scope*: Read</AppLabel>
                            <AppLabel className="w-full">read:profile</AppLabel>
                        </div>
                    </div>
                </div>
                <Clicks clicks={[...demoClicks, ...scopeClicks]} />
            </Block>

            {/* CreateContractModal.tsx:580-588, AiPathwaysDiscoverySearch.tsx:32 and
                AiPathwaysWhatWouldYouLikeToDoCard.tsx:47; CheckListItemSkeleton renders for real. */}
            <Block
                testId="l1-x-standalone-labels"
                title="Standalone labels (excerpts + real skeleton)"
            >
                <div className="flex flex-col gap-3 bg-white p-3">
                    <div className="flex gap-[10px] items-center">
                        <AppLabel
                            className="font-medium text-base text-grayscale-800 font-notoSans tracking-wide"
                            title="If this contract is (potentially) intended for minors."
                        >
                            Needs Guardian Consent (GameFlow)
                        </AppLabel>
                        <span className="w-10 h-6 rounded-full bg-emerald-700" />
                    </div>
                    <div className="flex items-center">
                        <AppLabel className="text-grayscale-600 font-poppins text-sm">
                            Explore pathways
                        </AppLabel>
                    </div>
                    <div>
                        <AppLabel className="text-grayscale-900 font-poppins text-xl">
                            What would you like to do?
                        </AppLabel>
                    </div>
                    <CheckListItemSkeleton />
                </div>
            </Block>
        </main>
    );
};
