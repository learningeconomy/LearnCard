import React, { useRef, useState } from 'react';
import { IonApp, IonInput } from '@ionic/react';
import { X } from 'lucide-react';
import Search from 'learn-card-base/svgs/Search';

import Calendar from '../../src/components/svgs/Calendar';

/**
 * `inputs-1b`: representative IonInput call sites for every group (I-A … I-F) in the phase 4
 * inventory (anvil-ionic-evidence/p4c/inventory.md §2), rendered with fixed local data and no
 * backend.
 *
 * Every block is a faithful excerpt: the input, its props, classes and handler shape, and its
 * immediate wrappers, copied from the source line cited in each block. Page state those handlers
 * touch is reduced to the fields the input reads; translated strings are inlined in English.
 *
 * Each call site is its own component with local state, as in the source: Ionic React writes
 * `value` back onto ion-input whenever its parent re-renders, so shared page-level state would
 * change what a re-render resets.
 *
 * Every block reports:
 * - `<output data-testid="i1b-…-value">`: the app state the call site's handler writes;
 * - `<output data-testid="i1b-…-events">`: an event log written through a ref (never state, so
 *   logging never re-renders the call site). The site's own `onIonInput` logs `input:"…"` (and
 *   `onKeyDown` logs `keydown:<key>` where wired), plus log-only probes for `onIonChange`
 *   (`change:"…"`), `onIonFocus` (`focus`) and `onIonBlur` (`blur`).
 *
 * The state matrix adds synthetic cells for the built-in states no single site covers together
 * (types, clearInput, counter, helper / error text, label placements, debounce).
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

const Value: React.FC<{ testId: string; value: unknown }> = ({ testId, value }) => (
    <output data-testid={testId} className="block text-xs font-mono text-grayscale-600">
        {JSON.stringify(value ?? null)}
    </output>
);

type EventLog = {
    record: (entry: string) => void;
    /** Callback ref for the `<output>` the log is written into. */
    attach: (element: HTMLOutputElement | null) => void;
};

/** Event log written to the DOM through a ref, so logging never re-renders the call site. */
const useEventLog = (): EventLog => {
    const entries = useRef<string[]>([]);
    const output = useRef<HTMLOutputElement | null>(null);
    const record = (entry: string): void => {
        entries.current.push(entry);
        if (output.current) output.current.textContent = JSON.stringify(entries.current);
    };
    const attach = (element: HTMLOutputElement | null): void => {
        output.current = element;
    };
    return { record, attach };
};

const Events: React.FC<{ testId: string; log: EventLog }> = ({ testId, log: { attach } }) => (
    <output
        ref={attach}
        data-testid={testId}
        className="block text-xs font-mono text-grayscale-600 break-all"
    >
        []
    </output>
);

/** Log-only probes for the events no call site wires: change (on blur), focus and blur. */
const probes = (log: EventLog) => ({
    onIonChange: (e: CustomEvent<{ value?: string | null }>) =>
        log.record(`change:${JSON.stringify(e.detail.value)}`),
    onIonFocus: () => log.record('focus'),
    onIonBlur: () => log.record('blur'),
});

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = '',
}) => <div className={`w-full bg-white rounded-[20px] p-4 ${className}`}>{children}</div>;

// ---------------------------------------------------------------------------------------------
// State matrix (synthetic: built-in states × mode)
// ---------------------------------------------------------------------------------------------

type MatrixCellSpec = {
    state: string;
    initial: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
    inputmode?: 'url';
    disabled?: boolean;
    readonly?: boolean;
    clearInput?: boolean;
    counter?: boolean;
    maxlength?: number;
    helperText?: string;
    errorText?: string;
    invalid?: boolean;
    label?: string;
    labelPlacement?: 'start' | 'stacked';
    debounce?: number;
};

const MATRIX_CELLS: MatrixCellSpec[] = [
    { state: 'empty', initial: '' },
    { state: 'filled', initial: 'Filled value' },
    { state: 'disabled', initial: 'Disabled value', disabled: true },
    { state: 'readonly', initial: 'Readonly value', readonly: true },
    { state: 'clear', initial: 'Clear me', clearInput: true },
    { state: 'clear-disabled', initial: 'No clear', clearInput: true, disabled: true },
    { state: 'email', initial: 'ada@example.com', type: 'email' },
    { state: 'password', initial: 'secret', type: 'password' },
    { state: 'number', initial: '12', type: 'number' },
    { state: 'search', initial: 'query', type: 'search' },
    { state: 'url', initial: 'https://example.com', type: 'url', inputmode: 'url' },
    { state: 'counter', initial: 'Twelve chars', counter: true, maxlength: 20 },
    { state: 'helper', initial: '', helperText: 'Helper text' },
    { state: 'error', initial: 'Bad', errorText: 'Error text', invalid: true },
    { state: 'label-start', initial: '', label: 'Name*' },
    { state: 'label-stacked', initial: 'Ada', label: 'Stacked label', labelPlacement: 'stacked' },
    { state: 'debounce', initial: '', debounce: 300 },
];

const MatrixCell: React.FC<{ spec: MatrixCellSpec; mode: 'ios' | 'md' }> = ({ spec, mode }) => {
    const log = useEventLog();
    const [value, setValue] = useState(spec.initial);
    const testId = `i1b-matrix-${mode}-${spec.state}`;
    return (
        <div data-testid={testId} className="flex flex-col gap-1">
            <span className="text-xs font-mono">
                {spec.state} {mode}
            </span>
            <IonInput
                mode={mode}
                value={value}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setValue(e.detail.value ?? '');
                }}
                {...probes(log)}
                placeholder="Placeholder"
                type={spec.type}
                inputmode={spec.inputmode}
                disabled={spec.disabled}
                readonly={spec.readonly}
                clearInput={spec.clearInput}
                counter={spec.counter}
                maxlength={spec.maxlength}
                helperText={spec.helperText}
                errorText={spec.errorText}
                label={spec.label}
                labelPlacement={spec.labelPlacement}
                debounce={spec.debounce}
                aria-label={spec.label ? undefined : `${spec.state} ${mode}`}
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding ${
                    spec.invalid ? 'ion-touched ion-invalid' : ''
                }`}
            />
            <Value testId={`${testId}-value`} value={value} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

const InputMatrix: React.FC = () => (
    <div className="bg-white rounded-[15px] p-4 grid grid-cols-2 gap-4">
        {(['ios', 'md'] as const).map(mode => (
            <div key={mode} className="flex flex-col gap-3 min-w-0">
                {MATRIX_CELLS.map(spec => (
                    <MatrixCell key={spec.state} spec={spec} mode={mode} />
                ))}
            </div>
        ))}
    </div>
);

// ---------------------------------------------------------------------------------------------
// Value write-back and ref forwarding (synthetic)
// ---------------------------------------------------------------------------------------------

/**
 * Ionic React re-applies `value` on every parent re-render, so typed text that the parent never
 * stored is reset by the next unrelated re-render (the button). The handler ignores input.
 */
const WriteBackProbe: React.FC = () => {
    const log = useEventLog();
    const [renders, setRenders] = useState(0);
    return (
        <Card className="flex flex-col gap-2">
            <IonInput
                value="Parent value"
                onIonInput={e => log.record(`input:${JSON.stringify(e.detail.value)}`)}
                {...probes(log)}
                aria-label="write-back"
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding"
            />
            <button
                type="button"
                data-testid="i1b-writeback-rerender"
                className="self-start rounded-full bg-grayscale-900 text-white px-4 py-1 text-sm"
                onClick={() => setRenders(count => count + 1)}
            >
                Re-render parent
            </button>
            <Value testId="i1b-writeback-value" value={{ renders }} />
            <Events testId="i1b-writeback-events" log={log} />
        </Card>
    );
};

// ---------------------------------------------------------------------------------------------
// I-A filled ion-padding fields
// ---------------------------------------------------------------------------------------------

/** src/components/boost-endorsements/EndorsementRequestForm/EndorsementRequestOptions.tsx:297-308 */
const EndorsementEmail: React.FC<{ testId: string; withError?: boolean }> = ({
    testId,
    withError,
}) => {
    const log = useEventLog();
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>(
        withError ? { email: 'Invalid email' } : {}
    );
    return (
        <Card>
            <IonInput
                value={email}
                onIonInput={e => {
                    setErrors({});
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setEmail(e.detail.value!);
                }}
                {...probes(log)}
                placeholder="Email address"
                type="text"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                    errors?.email ? 'border-rose-500 border border-solid' : ''
                }`}
            />
            <Value testId={`${testId}-value`} value={{ email, errors }} />
            <Events testId={`${testId}-events`} log={log} />
        </Card>
    );
};

/** src/components/boost-endorsements/EndorsementMediaAttachments/EndorsementMediaTypeForm.tsx:113-140 */
const MediaTitleAndLink: React.FC = () => {
    const log = useEventLog();
    const [mediaTitle, setMediaTitle] = useState('');
    const [mediaUrl, setMediaUrl] = useState('https://example.com/video');
    return (
        <Card>
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                placeholder="Title"
                type="text"
                value={mediaTitle}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setMediaTitle(e.detail.value!);
                }}
                {...probes(log)}
                onKeyDown={e => {
                    if (e.key === 'Enter') log.record('keydown:Enter');
                }}
            />
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mt-4`}
                placeholder="Paste link"
                type="text"
                value={mediaUrl}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setMediaUrl(e.detail.value!);
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') log.record('keydown:Enter');
                }}
            />
            <Value testId="i1b-a-media-value" value={{ mediaTitle, mediaUrl }} />
            <Events testId="i1b-a-media-events" log={log} />
        </Card>
    );
};

/** src/pages/adminToolsPage/CreateManagedProfileModal.tsx:245-261 (label, placement start) */
const ManagedProfileLabels: React.FC = () => {
    const log = useEventLog();
    const [name, setName] = useState<string | null | undefined>('');
    const [profileId, setProfileId] = useState<string | null | undefined>('');
    return (
        <Card className="flex flex-col gap-3">
            <IonInput
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setName(e.detail.value);
                }}
                {...probes(log)}
                value={name}
                placeholder="Profile Name"
                type="text"
                label="Name*"
            />
            <IonInput
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setProfileId(e.detail.value);
                }}
                value={profileId}
                placeholder={name ? name.toLowerCase().replace(/\s+/g, '-') : 'Profile ID'}
                type="text"
                label="Profile ID"
            />
            <Value testId="i1b-a-managed-profile-value" value={{ name, profileId }} />
            <Events testId="i1b-a-managed-profile-events" log={log} />
        </Card>
    );
};

/** src/pages/adminToolsPage/CreateContractModal.tsx:540-562 (title, slot="end" button) */
const ContractExpires: React.FC = () => {
    const log = useEventLog();
    const [contract, setContract] = useState<{
        redirectUrl?: string | null;
        expiresAt?: string | null;
    }>({});
    const [expiresAtError] = useState(true);
    const updateSlice = (key: 'redirectUrl' | 'expiresAt', value?: string | null) => {
        log.record(`input:${JSON.stringify(value)}`);
        setContract(prev => ({ ...prev, [key]: value }));
    };
    return (
        <Card className="flex flex-col gap-3">
            <IonInput
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding"
                onIonInput={e => updateSlice('redirectUrl', e.detail.value)}
                {...probes(log)}
                value={contract.redirectUrl}
                type="text"
                placeholder="Redirect URL"
                title="URL to redirect users to after they consent to the contract."
            />
            <IonInput
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base ion-padding ${
                    expiresAtError ? 'border-red-mastercard border border-solid' : ''
                }`}
                onIonInput={e => updateSlice('expiresAt', e.detail.value)}
                value={contract.expiresAt}
                type="text"
                placeholder="Expires At (ISO String)"
                title="Expiration date for the contract."
            >
                <button
                    onClick={() => updateSlice('expiresAt', '2027-01-01T00:00:00.000Z')}
                    type="button"
                    slot="end"
                >
                    <Calendar className="w-[30px] text-grayscale-700" />
                </button>
            </IonInput>
            <Value testId="i1b-a-contract-value" value={contract} />
            <Events testId="i1b-a-contract-events" log={log} />
        </Card>
    );
};

/** src/components/familyCMS/FamilyCMSMemberTitlesForm/FamilyCMSMemberTitlesForm.tsx:88-120 (clearInput) */
const FamilyTitles: React.FC = () => {
    const log = useEventLog();
    const [titles, setTitles] = useState({ singular: 'Guardian', plural: '' });
    const errors = { plural: 'Required' };
    const handleSetState = (key: 'singular' | 'plural', value?: string | null) => {
        log.record(`input:${JSON.stringify(value)}`);
        setTitles(prev => ({ ...prev, [key]: value }));
    };
    return (
        <Card className="flex flex-col gap-3">
            <IonInput
                value={titles.singular}
                onIonInput={e => handleSetState('singular', e.detail.value)}
                {...probes(log)}
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                    (errors as Record<string, string>)?.singular ? 'border-red-300 border-2' : ''
                }`}
                placeholder="Singular"
                clearInput
                type="text"
            />
            <IonInput
                value={titles.plural}
                onIonInput={e => handleSetState('plural', e.detail.value)}
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                    errors?.plural ? 'border-red-300 border-2' : ''
                }`}
                placeholder="Plural"
                clearInput
                type="text"
            />
            <Value testId="i1b-a-family-titles-value" value={titles} />
            <Events testId="i1b-a-family-titles-events" log={log} />
        </Card>
    );
};

const placeholderStyles = {
    '--placeholder-color': '#52597a',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: 'Poppins',
} as React.CSSProperties;

/** src/pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple.tsx:440-484 */
const CreateProfileSimple: React.FC<{ testId: string; isLoading?: boolean }> = ({
    testId,
    isLoading = false,
}) => {
    const log = useEventLog();
    const [name, setName] = useState<string | null | undefined>(isLoading ? 'Ada Lovelace' : '');
    const [errors, setErrors] = useState<Record<string, string>>({ name: 'Name is required' });
    return (
        <Card>
            <IonInput
                style={placeholderStyles}
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                    errors.name ? 'login-input-email-error' : ''
                }`}
                onIonInput={e => {
                    setErrors({});
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setName(e.detail.value);
                }}
                {...probes(log)}
                value={name}
                placeholder="Name"
                type="text"
                aria-label="Full name"
                disabled={isLoading}
            />
            <Value testId={`${testId}-value`} value={{ name, errors }} />
            <Events testId={`${testId}-events`} log={log} />
        </Card>
    );
};

/** src/pages/adminToolsPage/AdminToolsStorage/AdminToolsStorageOption.tsx:223-233 (url, debounce 0) */
const StorageUrl: React.FC = () => {
    const log = useEventLog();
    const [customEndpoint, setCustomEndpoint] = useState('');
    return (
        <Card>
            <IonInput
                type="url"
                inputmode="url"
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-sm w-full"
                placeholder="Enter storage URL (e.g., https://api.example.com)"
                value={customEndpoint}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setCustomEndpoint(String(e.detail.value ?? ''));
                }}
                {...probes(log)}
                debounce={0}
            />
            <Value testId="i1b-a-storage-url-value" value={customEndpoint} />
            <Events testId="i1b-a-storage-url-events" log={log} />
        </Card>
    );
};

/** src/components/boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode.tsx:645-680 */
const ClaimLimit: React.FC = () => {
    const log = useEventLog();
    const [claimLimit, setClaimLimit] = useState<string | number | null | undefined>('');
    return (
        <Card>
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[15px]! py-[6px]! font-notoSans text-[17px]`}
                placeholder="How many claims?"
                type="number"
                min={0}
                value={claimLimit}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setClaimLimit(e.detail.value);
                }}
                {...probes(log)}
                onKeyDown={e => {
                    // Allow only numbers
                    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                        log.record(`keydown:${e.key}:blocked`);
                        e.preventDefault();
                    }
                }}
                onPaste={e => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const numericText = pastedText.replace(/\D/g, '');
                    if (numericText) {
                        setClaimLimit(numericText);
                    }
                }}
            />
            <Value testId="i1b-a-claim-limit-value" value={claimLimit} />
            <Events testId="i1b-a-claim-limit-events" log={log} />
        </Card>
    );
};

/** src/components/boost/boostCMS/boostCMSForms/boostCMSAppearance/BoostCMSAchievementTypeSelector.tsx:142-155 */
const AchievementTypeSearch: React.FC = () => {
    const log = useEventLog();
    const [search, setSearch] = useState('Custom type name');
    const [errors, setErrors] = useState<Record<string, string>>({ customType: 'Too long' });
    return (
        <Card>
            <IonInput
                autocapitalize="on"
                value={search}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setSearch(e.detail.value!);
                    setErrors({});
                }}
                {...probes(log)}
                placeholder="Search"
                type="text"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                    errors?.customType ? 'border-red-500 border-2' : ''
                }`}
                maxlength={22}
            />
            <Value testId="i1b-a-achievement-type-value" value={{ search, errors }} />
            <Events testId="i1b-a-achievement-type-events" log={log} />
        </Card>
    );
};

/** src/components/network-prompts/NewJoinNetworkPrompt.tsx:402-471 (disabled, readonly, aria-label) */
const JoinNetwork: React.FC = () => {
    const log = useEventLog();
    const [name, setName] = useState<string | null | undefined>('');
    const [profileId, setProfileId] = useState<string | null | undefined>('classlink-ada');
    const classlink = true;
    return (
        <Card className="flex flex-col">
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mb-4`}
                value={`@${'ada'}`}
                placeholder="User ID"
                type="text"
                aria-label="User ID"
                disabled={true}
            />
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base`}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setName(e.detail.value);
                }}
                {...probes(log)}
                value={name}
                placeholder="Full Name"
                type="text"
                aria-label="Full Name"
            />
            <IonInput
                autocapitalize="on"
                className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base text-left mt-4 login-input-email-error`}
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setProfileId(e.detail.value);
                }}
                value={profileId}
                readonly={classlink}
                placeholder="User ID"
                aria-label="User ID"
                type="text"
            />
            <Value testId="i1b-a-join-network-value" value={{ name, profileId }} />
            <Events testId="i1b-a-join-network-events" log={log} />
        </Card>
    );
};

// ---------------------------------------------------------------------------------------------
// I-B debounced search (500 ms)
// ---------------------------------------------------------------------------------------------

/** src/pages/ai-insights/share-insights/ShareInsightsModal.tsx:72-81 (debounce 500, clearInput) */
const ShareInsightsSearch: React.FC = () => {
    const log = useEventLog();
    const [search, setSearch] = useState('Ada');
    const handleSearch = (value?: string | null) => {
        log.record(`input:${JSON.stringify(value)}`);
        setSearch(value ?? '');
    };
    return (
        <Card>
            <IonInput
                autocapitalize="on"
                placeholder="Search by name"
                value={search}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base"
                onIonInput={e => handleSearch(e?.detail?.value)}
                {...probes(log)}
                debounce={500}
                type="text"
                clearInput
            />
            <Value testId="i1b-b-share-insights-value" value={search} />
            <Events testId="i1b-b-share-insights-events" log={log} />
        </Card>
    );
};

/** src/components/boost/boost-search/BoostSearch.tsx:134-142 (debounce 500) */
const BoostSearchExcerpt: React.FC = () => {
    const log = useEventLog();
    const [search, setSearch] = useState('');
    return (
        <Card>
            <IonInput
                autocapitalize="on"
                placeholder="Search LearnCard Network..."
                value={search}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-base"
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e?.detail?.value ?? '')}`);
                    setSearch(e?.detail?.value ?? '');
                }}
                {...probes(log)}
                debounce={500}
                type="text"
            />
            <Value testId="i1b-b-boost-search-value" value={search} />
            <Events testId="i1b-b-boost-search-events" log={log} />
        </Card>
    );
};

// ---------------------------------------------------------------------------------------------
// I-C pill search with icon gutter
// ---------------------------------------------------------------------------------------------

/** src/pages/skills/SkillsHubSearch.tsx:41-65 */
const SkillsHubSearchExcerpt: React.FC = () => {
    const log = useEventLog();
    const [searchInput, setSearchInput] = useState<string | null | undefined>('Leadership');
    return (
        <Card>
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center gap-[10px] justify-between max-w-[600px] relative">
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                            <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                        </div>
                        <IonInput
                            type="text"
                            value={searchInput}
                            placeholder="Search"
                            onIonInput={e => {
                                log.record(`input:${JSON.stringify(e.detail.value)}`);
                                setSearchInput(e.detail.value);
                            }}
                            {...probes(log)}
                            className="bg-grayscale-200 text-grayscale-800 rounded-[10px] py-[4px]! font-normal !font-notoSans text-[17px] pl-[44px]! text-left! pr-[36px]!"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => {
                                    setSearchInput('');
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <Value testId="i1b-c-skills-hub-value" value={searchInput} />
            <Events testId="i1b-c-skills-hub-events" log={log} />
        </Card>
    );
};

/**
 * src/pages/ai-pathways/ai-pathways-what-would-you-like-to-do/PathwaySearchInput.tsx:136-165
 * (--padding-start / --padding-end, React onFocus / onBlur / onKeyDown)
 */
const PathwaySearch: React.FC = () => {
    const log = useEventLog();
    const [searchValue, setSearchValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const showClearAction = false;
    const isSimpleVariant = true;
    return (
        <Card>
            <div className="relative flex flex-col">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <IonInput
                            value={searchValue}
                            onIonInput={e => {
                                const nextValue = e.detail.value ?? '';
                                log.record(`input:${JSON.stringify(nextValue)}`);
                                setSearchValue(nextValue);
                                setShowSuggestions(Boolean(nextValue));
                            }}
                            onFocus={() => {
                                log.record('react-focus');
                                setShowSuggestions(true);
                            }}
                            onBlur={() => {
                                log.record('react-blur');
                                setShowSuggestions(false);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Escape') {
                                    log.record('keydown:Escape');
                                    setShowSuggestions(false);
                                }
                            }}
                            autocapitalize="off"
                            className={`w-full text-grayscale-800 rounded-[20px] px-[10px]! py-0! font-medium text-[16px] leading-[18px] ${
                                showClearAction ? 'bg-violet-50' : 'bg-grayscale-100'
                            }`}
                            style={
                                {
                                    '--padding-start': '45px',
                                    '--padding-end': isSimpleVariant ? '44px' : '16px',
                                } as React.CSSProperties
                            }
                            placeholder="What would you like to do?"
                            type="text"
                        />
                    </div>
                </div>
            </div>
            <Value testId="i1b-c-pathway-value" value={{ searchValue, showSuggestions }} />
            <Events testId="i1b-c-pathway-events" log={log} />
        </Card>
    );
};

// ---------------------------------------------------------------------------------------------
// I-D compact chat
// ---------------------------------------------------------------------------------------------

/** src/components/ai-assessment/AiAssessment/helpers/AssessmentAnswerInput.tsx:43-50 */
const AssessmentAnswer: React.FC<{ isDesktop: boolean; testId: string }> = ({
    isDesktop,
    testId,
}) => {
    const log = useEventLog();
    const [answer, setAnswer] = useState<string | null | undefined>('');
    return (
        <div className="w-full flex bg-cyan-50 p-4">
            <IonInput
                onIonInput={e => {
                    log.record(`input:${JSON.stringify(e.detail.value)}`);
                    setAnswer(e.detail.value);
                }}
                {...probes(log)}
                className={`bg-white text-grayscale-800 flex-1 w-full rounded-[16px] px-4!  ${
                    isDesktop ? '' : 'border-solid border border-grayscale-200'
                }`}
                placeholder="Answer... "
                value={answer}
            />
            <div className="flex flex-col ml-2 w-[160px] shrink-0">
                <Value testId={`${testId}-value`} value={answer} />
                <Events testId={`${testId}-events`} log={log} />
            </div>
        </div>
    );
};

/** src/components/new-ai-session/NewAiSessionChatBot/helpers/ExistingTopicSearch.tsx:31-59 (uncontrolled) */
const ExistingTopic: React.FC = () => {
    const log = useEventLog();
    const [search, setSearch] = useState<string | null | undefined>('');
    const isDesktop = true;
    const isEmpty = !search;
    return (
        <div>
            <div
                className={`w-full ion-padding flex fade-enter ${
                    isDesktop
                        ? 'bg-white rounded-[20px] shadow-box-bottom my-4 max-w-[99%]'
                        : 'bg-cyan-50'
                }`}
            >
                <IonInput
                    onIonInput={e => {
                        log.record(`input:${JSON.stringify(e.detail.value)}`);
                        setSearch(e.detail.value);
                    }}
                    {...probes(log)}
                    className={`bg-white text-grayscale-800 flex-1 w-full rounded-[16px] px-4! ${
                        isDesktop ? '' : 'border-solid border border-grayscale-200'
                    }`}
                    placeholder="Browse topics"
                />
                <button
                    type="button"
                    aria-label="Search"
                    className={` p-2 rounded-[16px] flex items-center justify-center ml-2 min-h-[44px] min-w-[44px] ${
                        isEmpty ? 'bg-grayscale-300' : 'bg-emerald-700'
                    }`}
                    disabled={!search}
                >
                    <Search version="2" className="text-white" />
                </button>
            </div>
            <Value testId="i1b-d-existing-topic-value" value={search} />
            <Events testId="i1b-d-existing-topic-events" log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// I-E SkillFrameworks (ref.setFocus())
// ---------------------------------------------------------------------------------------------

/** src/pages/SkillFrameworks/FrameworkColumn.tsx:483-500 (ref + setFocus on clear) */
const FrameworkSearch: React.FC = () => {
    const log = useEventLog();
    const inputRef = useRef<HTMLIonInputElement>(null);
    const [search, setSearch] = useState<string | null | undefined>('Communication');
    return (
        <Card>
            <div className="relative">
                <IonInput
                    ref={inputRef}
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-poppins text-[14px] w-full"
                    placeholder="Search skills..."
                    value={search}
                    onIonInput={e => {
                        log.record(`input:${JSON.stringify(e.detail.value)}`);
                        setSearch(e.detail.value);
                    }}
                    {...probes(log)}
                />
                {search && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => {
                            setSearch('');
                            inputRef.current?.setFocus();
                        }}
                        className="absolute right-[10px] top-1/2 -translate-y-1/2 z-10"
                    >
                        <X className="w-[20px] h-[20px] text-grayscale-700" />
                    </button>
                )}
            </div>
            <button
                type="button"
                data-testid="i1b-e-framework-measure"
                className="mt-2 rounded-full bg-grayscale-900 text-white px-4 py-1 text-sm"
                onClick={() => log.record(`width:${inputRef.current?.offsetWidth}`)}
            >
                Measure
            </button>
            <Value testId="i1b-e-framework-value" value={search} />
            <Events testId="i1b-e-framework-events" log={log} />
        </Card>
    );
};

// ---------------------------------------------------------------------------------------------
// I-F stacked label
// ---------------------------------------------------------------------------------------------

/** src/components/familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModalSimple.tsx:221-270 */
const ChildInvite: React.FC<{ withError?: boolean; testId: string }> = ({ withError, testId }) => {
    const log = useEventLog();
    const [name, setName] = useState<string | null | undefined>(withError ? '' : 'Ada');
    const [errors, setErrors] = useState<Record<string, string>>(
        withError ? { name: 'Required' } : {}
    );
    return (
        <Card>
            <div className="w-full mb-2 mt-4 relative">
                <IonInput
                    value={name}
                    onIonInput={e => {
                        const _name = e?.detail?.value;
                        log.record(`input:${JSON.stringify(_name)}`);
                        setName(_name);
                        setErrors?.({});
                    }}
                    {...probes(log)}
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] px-4! pb-2! pr-8! font-normal font-poppins text-sm w-full troops-cms-placeholder ${
                        errors?.name ? 'border-red-300 border-2' : ''
                    }`}
                    label="Name"
                    labelPlacement="stacked"
                    type="text"
                />
            </div>
            <Value testId={`${testId}-value`} value={{ name, errors }} />
            <Events testId={`${testId}-events`} log={log} />
        </Card>
    );
};

export const InputsVisualFixture: React.FC = () => (
    <main className="mx-auto flex w-full max-w-[860px] flex-col items-stretch gap-6 p-6 font-poppins">
        {/*
         * IonApp starts Ionic's focus-visible and tap-click utilities (and, on iOS / Android web,
         * the input shims), as it does at the real app root. Its host CSS (absolute, contain,
         * overflow) would clip this long page, so it is mounted empty and hidden.
         */}
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="i1b-matrix" title="IonInput states × modes (synthetic)">
            <InputMatrix />
        </Block>
        <Block testId="i1b-writeback" title="IonInput value write-back on parent re-render">
            <WriteBackProbe />
        </Block>

        <Block testId="i1b-a-endorsement-email" title="I-A EndorsementRequestOptions email">
            <EndorsementEmail testId="i1b-a-endorsement-email" />
        </Block>
        <Block
            testId="i1b-a-endorsement-email-error"
            title="I-A EndorsementRequestOptions email (error border)"
        >
            <EndorsementEmail testId="i1b-a-endorsement-email-error" withError />
        </Block>
        <Block testId="i1b-a-media" title="I-A EndorsementMediaTypeForm title + link (Enter)">
            <MediaTitleAndLink />
        </Block>
        <Block testId="i1b-a-managed-profile" title="I-A CreateManagedProfileModal (label start)">
            <ManagedProfileLabels />
        </Block>
        <Block testId="i1b-a-contract" title="I-A CreateContractModal (title, slot end button)">
            <ContractExpires />
        </Block>
        <Block testId="i1b-a-family-titles" title="I-A FamilyCMSMemberTitlesForm (clearInput)">
            <FamilyTitles />
        </Block>
        <Block
            testId="i1b-a-create-profile"
            title="I-A AdminToolsCreateProfileSimple (--placeholder-color)"
        >
            <CreateProfileSimple testId="i1b-a-create-profile" />
        </Block>
        <Block
            testId="i1b-a-create-profile-disabled"
            title="I-A AdminToolsCreateProfileSimple (disabled while loading)"
        >
            <CreateProfileSimple testId="i1b-a-create-profile-disabled" isLoading />
        </Block>
        <Block testId="i1b-a-storage-url" title="I-A AdminToolsStorageOption (url, debounce 0)">
            <StorageUrl />
        </Block>
        <Block testId="i1b-a-claim-limit" title="I-A BoostShareableCode (number, min 0)">
            <ClaimLimit />
        </Block>
        <Block
            testId="i1b-a-achievement-type"
            title="I-A BoostCMSAchievementTypeSelector (maxlength 22)"
        >
            <AchievementTypeSearch />
        </Block>
        <Block testId="i1b-a-join-network" title="I-A NewJoinNetworkPrompt (disabled, readonly)">
            <JoinNetwork />
        </Block>

        <Block testId="i1b-b-share-insights" title="I-B ShareInsightsModal (debounce 500, clear)">
            <ShareInsightsSearch />
        </Block>
        <Block testId="i1b-b-boost-search" title="I-B BoostSearch (debounce 500)">
            <BoostSearchExcerpt />
        </Block>

        <Block testId="i1b-c-skills-hub" title="I-C SkillsHubSearch (pill, icon gutter)">
            <SkillsHubSearchExcerpt />
        </Block>
        <Block testId="i1b-c-pathway" title="I-C PathwaySearchInput (--padding-start)">
            <PathwaySearch />
        </Block>

        <Block testId="i1b-d-assessment" title="I-D AssessmentAnswerInput (desktop)">
            <AssessmentAnswer isDesktop testId="i1b-d-assessment" />
        </Block>
        <Block testId="i1b-d-assessment-mobile" title="I-D AssessmentAnswerInput (mobile border)">
            <AssessmentAnswer isDesktop={false} testId="i1b-d-assessment-mobile" />
        </Block>
        <Block testId="i1b-d-existing-topic" title="I-D ExistingTopicSearch (uncontrolled)">
            <ExistingTopic />
        </Block>

        <Block testId="i1b-e-framework" title="I-E FrameworkColumn (ref.setFocus, offsetWidth)">
            <FrameworkSearch />
        </Block>

        <Block testId="i1b-f-child-invite" title="I-F ChildInviteModalSimple (stacked label)">
            <ChildInvite testId="i1b-f-child-invite" />
        </Block>
        <Block
            testId="i1b-f-child-invite-error"
            title="I-F ChildInviteModalSimple (stacked label, error)"
        >
            <ChildInvite testId="i1b-f-child-invite-error" withError />
        </Block>
    </main>
);
