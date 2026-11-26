import React, { useRef, useState } from 'react';
import { IonApp } from '@ionic/react';

import { AppTextarea } from '../../src/components/controls/AppTextarea';
import { X } from 'lucide-react';
import { BoostCategoryOptionsEnum, CredentialCategoryEnum } from 'learn-card-base';

import { initialBoostCMSState, type BoostCMSState } from '../../src/components/boost/boost';
import BoostCMSTitleForm from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSTitleForm/BoostCMSTitleForm';
import BoostCMSNotesForm from '../../src/components/boost/boostCMS/boostCMSForms/boostCMSNotes/BoostCMSNotesForm';
import { EndorsementTextForm } from '../../src/components/boost-endorsements/EndorsementForm/EndorsementTextForm';
import { EndorsementQualificationsTextForm } from '../../src/components/boost-endorsements/EndorsementForm/EndorsementQualificationsTextForm';
import {
    initialEndorsementState,
    type EndorsementState,
} from '../../src/components/boost-endorsements/EndorsementForm/endorsement-state.helpers';
import { EndorsementRequestTextForm } from '../../src/components/boost-endorsements/EndorsementRequestForm/EndorsementRequestTextForm';
import type { EndorsementRequestState } from '../../src/components/boost-endorsements/EndorsementRequestForm/endorsement-request.helpers';
import AnimatedPlusToXIcon from '../../src/components/ai-passport/helpers/AnimatedPlusToXIcon';
import AiInsightsPromptBoxInput from '../../src/pages/ai-insights/ai-inisghts-prompt/AiInsightsPromptBoxInput';
import { personaCredentials } from '../../src/pages/dashboard/dashboard.personas';

/**
 * `textareas-1b`: representative (formerly IonTextarea, now AppTextarea) call sites for every group (X-A … X-E) in the phase 4
 * batch 1b inventory (anvil-ionic-evidence/p4c/inventory.md §3), rendered with fixed local data and
 * no backend.
 *
 * Components that render standalone with props only are the real ones (BoostCMSTitleForm,
 * BoostCMSNotesForm, EndorsementTextForm, EndorsementQualificationsTextForm,
 * EndorsementRequestTextForm, AiInsightsPromptBoxInput). Everything else is a faithful excerpt: the
 * textarea, its props, classes and handler shape, and its immediate wrappers, copied from the
 * source line cited in each block. Page state those handlers touch is reduced to the fields the
 * textarea reads.
 *
 * Each call site is its own component with local state, as in the source: Ionic React writes
 * `value` back onto ion-textarea whenever its parent re-renders, so shared page-level state would
 * change what a re-render resets.
 *
 * Every block reports:
 * - `<output data-testid="x1b-…-value">`: the app state the call site's handler writes;
 * - `<output data-testid="x1b-…-events">`: an event log written through a ref (never state, so
 *   logging never re-renders the call site). Excerpts log the site's own `onValueInput` (was `onIonInput`) as
 *   `input:"…"` (and `onKeyDown` as `keydown:<key>` where wired), plus log-only probes for
 *   `onValueChange` (`change:"…"`, fires on blur when the value changed), `onFocus` (`focus`) and
 *   `onBlur` (`blur`), which replace Ionic's `onIonChange` / `onIonFocus` / `onIonBlur`. Real components log every state write as `input:"<field>"`, plus
 *   `focus` / `blur` from native focusin / focusout on their wrapper.
 *
 * No call site sets `debounce`, `counter`, `label`, `helperText` or `errorText`. The state matrix
 * adds synthetic readonly and `counter` cells (Ionic's own counter, `maxlength` 20) so the
 * built-in states can be compared too.
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
    onValueChange: (value: string) => log.record(`change:${JSON.stringify(value)}`),
    onFocus: () => log.record('focus'),
    onBlur: () => log.record('blur'),
});

/** Native focus / blur on a real component's wrapper (the component wires no focus handlers). */
const focusProbes = (log: EventLog) => ({
    onFocus: () => log.record('focus'),
    onBlur: () => log.record('blur'),
});

/** Wraps a real component's state setter so every write is logged with the field it changed. */
const useLoggedState = <S,>(
    initial: S,
    log: EventLog,
    field: (state: S) => unknown
): [S, React.Dispatch<React.SetStateAction<S>>] => {
    const [state, setState] = useState<S>(initial);
    const current = useRef(state);
    const set: React.Dispatch<React.SetStateAction<S>> = action => {
        const next =
            typeof action === 'function'
                ? (action as (prev: S) => S)(current.current)
                : (action as S);
        current.current = next;
        log.record(`input:${JSON.stringify(field(next))}`);
        setState(next);
    };
    return [state, set];
};

const LOREM =
    'Led a six-week community garden project with twelve volunteers, coordinated weekly schedules and tracked the harvest donated to the local food bank.';

// ---------------------------------------------------------------------------------------------
// State matrix (synthetic: every built-in state × mode)
// ---------------------------------------------------------------------------------------------

type MatrixCellSpec = {
    state: string;
    initial: string;
    disabled?: boolean;
    readonly?: boolean;
    autoGrow?: boolean;
    counter?: boolean;
    maxlength?: number;
    rows?: number;
};

const MATRIX_CELLS: MatrixCellSpec[] = [
    { state: 'empty', initial: '' },
    { state: 'filled', initial: 'Filled value' },
    { state: 'disabled', initial: 'Disabled value', disabled: true },
    { state: 'readonly', initial: 'Readonly value', readonly: true },
    { state: 'counter', initial: 'Twelve chars', counter: true, maxlength: 20 },
    { state: 'autogrow', initial: LOREM, autoGrow: true, rows: 1 },
    { state: 'overflow', initial: `${LOREM}\n\n${LOREM}`, rows: 2 },
];

const MatrixCell: React.FC<{ spec: MatrixCellSpec; mode: 'ios' | 'md' }> = ({ spec, mode }) => {
    const log = useEventLog();
    const [value, setValue] = useState(spec.initial);
    const testId = `x1b-matrix-${mode}-${spec.state}`;
    return (
        <div data-testid={testId} className="flex flex-col gap-1">
            <span className="text-xs font-mono">
                {spec.state} {mode}
            </span>
            <AppTextarea
                mode={mode}
                value={value}
                onValueInput={value => {
                    log.record(`input:${JSON.stringify(value)}`);
                    setValue(value);
                }}
                {...probes(log)}
                placeholder="Placeholder"
                disabled={spec.disabled}
                readonly={spec.readonly}
                autoGrow={spec.autoGrow}
                counter={spec.counter}
                maxlength={spec.maxlength}
                rows={spec.rows}
                aria-label={`${spec.state} ${mode}`}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] px-[16px]"
            />
            <Value testId={`${testId}-value`} value={value} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

const TextareaMatrix: React.FC = () => (
    <div className="bg-white rounded-[15px] p-4 grid grid-cols-2 gap-4">
        {(['ios', 'md'] as const).map(mode => (
            <div key={mode} className="flex flex-col gap-3">
                {MATRIX_CELLS.map(spec => (
                    <MatrixCell key={spec.state} spec={spec} mode={mode} />
                ))}
            </div>
        ))}
    </div>
);

// ---------------------------------------------------------------------------------------------
// Value write-back (synthetic): the parent re-renders without taking the typed value
// ---------------------------------------------------------------------------------------------

/**
 * Ionic React re-applies `value` on every parent re-render, so typed text that the parent never
 * stored is reset by the next unrelated re-render (the button). The handler ignores input.
 */
const WriteBackProbe: React.FC = () => {
    const log = useEventLog();
    const [renders, setRenders] = useState(0);
    return (
        <div className="bg-white rounded-[15px] p-4 flex flex-col gap-2">
            <AppTextarea
                value="Parent value"
                onValueInput={value => log.record(`input:${JSON.stringify(value)}`)}
                {...probes(log)}
                aria-label="write-back"
                rows={2}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] px-[16px]"
            />
            <button
                type="button"
                data-testid="x1b-writeback-rerender"
                className="self-start rounded-full bg-grayscale-900 text-white px-4 py-1 text-sm"
                onClick={() => setRenders(count => count + 1)}
            >
                Re-render parent
            </button>
            <Value testId="x1b-writeback-value" value={{ renders }} />
            <Events testId="x1b-writeback-events" log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// X-A BoostCMS filled (autocapitalize="on", rows 2/3/10, disabled)
// ---------------------------------------------------------------------------------------------

type BasicInfoField = 'issuerName' | 'description' | 'narrative';

/**
 * src/components/boost/boostCMS/boostCMSForms/boostCMSBasicInfo/BoostCMSBasicInfoForm.tsx:112-147
 * and boostCMSAdvancedSettings/BoostCMSAdvancedSettingsForm.tsx:116-149 (identical shape; the
 * advanced narrative uses rows={10}).
 */
const BoostCMSBasicInfoTextarea: React.FC<{
    testId: string;
    field: BasicInfoField;
    rows: number;
    placeholder: string;
    initial?: string;
    disabled?: boolean;
}> = ({ testId, field, rows, placeholder, initial = '', disabled = false }) => {
    const log = useEventLog();
    const [basicInfo, setBasicInfo] = useState<Record<BasicInfoField, string>>({
        issuerName: '',
        description: '',
        narrative: '',
        [field]: initial,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors the source's loose handler
    const handleStateChange = (propName: string, value: any) => {
        log.record(`input:${JSON.stringify(value)}`);
        setBasicInfo(prev => ({ ...prev, [propName]: value }));
    };
    return (
        <div className="w-full bg-white rounded-[20px] p-4">
            <div className="flex flex-col items-start justify-center w-full mt-2 bg-grayscale-100 px-[16px] py-[8px] rounded-[15px]">
                <AppTextarea
                    autocapitalize="on"
                    value={basicInfo?.[field]}
                    onValueInput={value => handleStateChange(field, value)}
                    {...probes(log)}
                    placeholder={placeholder}
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium text-base"
                    rows={rows}
                    disabled={disabled}
                />
            </div>
            <Value testId={`${testId}-value`} value={basicInfo[field]} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// X-B endorsement / notes
// ---------------------------------------------------------------------------------------------

const RealEndorsementTextForm: React.FC<{ testId: string; withError?: boolean }> = ({
    testId,
    withError,
}) => {
    const log = useEventLog();
    const [endorsement, setEndorsement] = useLoggedState<EndorsementState>(
        { ...initialEndorsementState, description: withError ? '' : 'Great collaborator.' },
        log,
        state => state.description
    );
    const [errors, setErrors] = useState<Record<string, string[]>>(
        withError ? { description: ['Description is required'] } : {}
    );
    return (
        <div {...focusProbes(log)}>
            <EndorsementTextForm
                credential={personaCredentials['lc:cloud:rec-2']}
                categoryType={CredentialCategoryEnum.achievement}
                endorsement={endorsement}
                setEndorsement={setEndorsement}
                errors={errors}
                setErrors={setErrors}
            />
            <Value
                testId={`${testId}-value`}
                value={{ description: endorsement.description, errors }}
            />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

const RealEndorsementQualificationsForm: React.FC<{ testId: string }> = ({ testId }) => {
    const log = useEventLog();
    const [endorsement, setEndorsement] = useLoggedState<EndorsementState>(
        initialEndorsementState,
        log,
        state => state.qualification
    );
    return (
        <div {...focusProbes(log)}>
            <EndorsementQualificationsTextForm
                endorsement={endorsement}
                setEndorsement={setEndorsement}
                errors={{}}
            />
            <Value testId={`${testId}-value`} value={endorsement.qualification} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

const RealEndorsementRequestTextForm: React.FC<{ testId: string }> = ({ testId }) => {
    const log = useEventLog();
    const [request, setRequest] = useLoggedState<EndorsementRequestState>(
        { text: '', email: '' },
        log,
        state => state.text
    );
    return (
        <div {...focusProbes(log)}>
            <EndorsementRequestTextForm
                endorsementRequest={request}
                setEndorsementRequest={setRequest}
            />
            <Value testId={`${testId}-value`} value={request.text} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

/** src/components/boost-endorsements/EndorsementRequestForm/EndorsementRequestOptions.tsx:281-291 */
const EndorsementRequestOptionsMessage: React.FC = () => {
    const log = useEventLog();
    const [endorsementRequest, setEndorsementRequest] = useState<EndorsementRequestState>({
        text: 'Could you endorse my project work?',
    });
    const handleStateChange = (key: string, value: string | null | undefined) => {
        log.record(`input:${JSON.stringify(value)}`);
        setEndorsementRequest(prev => ({ ...prev, [key]: value }));
    };
    return (
        <div>
            <div className="w-full flex flex-col items-start justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
                <p className="text-[17px] text-grayscale-900 text-left mb-2">What to say</p>
                <AppTextarea
                    autocapitalize="on"
                    value={endorsementRequest?.text}
                    onValueInput={value => handleStateChange('text', value)}
                    {...probes(log)}
                    placeholder="Add a message"
                    className={`bg-grayscale-100 font-poppins text-grayscale-800 rounded-[15px] px-[16px] py-[8px] text-[17px] mb-1`}
                />
            </div>
            <Value
                testId="x1b-b-endorsement-request-options-value"
                value={endorsementRequest.text}
            />
            <Events testId="x1b-b-endorsement-request-options-events" log={log} />
        </div>
    );
};

/** Real BoostCMSNotesForm: the textarea has no `value` prop (uncontrolled). */
const RealBoostNotesForm: React.FC = () => {
    const log = useEventLog();
    const [state, setState] = useLoggedState<BoostCMSState>(
        initialBoostCMSState,
        log,
        next => next.notes
    );
    return (
        <div {...focusProbes(log)} className="bg-grayscale-100 p-2 rounded-[20px]">
            <BoostCMSNotesForm state={state} setState={setState} />
            <Value testId="x1b-b-boost-notes-value" value={state.notes ?? null} />
            <Events testId="x1b-b-boost-notes-events" log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// X-C BoostCMSTitleForm (dark, rows 3, maxlength 100, slot="end" counter)
// ---------------------------------------------------------------------------------------------

/** Real BoostCMSTitleForm on the BoostCMS page's dark IonContent background (grayscale-800). */
const RealBoostTitleForm: React.FC<{ testId: string; disabled?: boolean }> = ({
    testId,
    disabled,
}) => {
    const log = useEventLog();
    const [state, setState] = useLoggedState<BoostCMSState>(
        {
            ...initialBoostCMSState,
            basicInfo: {
                ...initialBoostCMSState.basicInfo,
                type: BoostCategoryOptionsEnum.achievement,
                name: disabled ? 'Community Garden Lead' : '',
            },
        },
        log,
        next => next.basicInfo.name
    );
    return (
        <div {...focusProbes(log)} className="bg-grayscale-800 p-4 rounded-[20px]">
            <BoostCMSTitleForm state={state} setState={setState} disabled={disabled} />
            <Value testId={`${testId}-value`} value={state.basicInfo.name} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// X-D autoGrow
// ---------------------------------------------------------------------------------------------

const RealAiInsightsPromptBoxInput: React.FC = () => {
    const log = useEventLog();
    const [prompt, setPromptState] = useState('');
    const setPrompt = (next: string): void => {
        log.record(`input:${JSON.stringify(next)}`);
        setPromptState(next);
    };
    return (
        <div {...focusProbes(log)} className="bg-white p-4 rounded-[20px]">
            {/* AiInsightsPromptBox.tsx:78-82 wraps it in this form. */}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    log.record('submit');
                }}
                className="w-full items-center justify-center flex flex-col gap-4"
            >
                <AiInsightsPromptBoxInput prompt={prompt} setPrompt={setPrompt} />
            </form>
            <Value testId="x1b-d-ai-insights-value" value={prompt} />
            <Events testId="x1b-d-ai-insights-events" log={log} />
        </div>
    );
};

/**
 * src/components/ai-passport/AiPassportPersonaliztionAnswerInput.tsx:28-112, desktop branch only
 * (`isMobile` renders a button instead), so the capture viewport cannot switch it. Enter with a
 * non-empty answer submits; clicking the pill (including the textarea) with a non-empty answer
 * submits too, through the wrapper's onClick.
 */
const AiPassportAnswerInput: React.FC<{ testId: string; favFictionalCharacter?: boolean }> = ({
    testId,
    favFictionalCharacter,
}) => {
    const log = useEventLog();
    const [answer, setAnswer] = useState<string>('');
    const [submitted, setSubmitted] = useState<string[]>([]);
    const placeholderText = favFictionalCharacter ? 'Favorite character' : 'Add a hobby';
    const minWidth = favFictionalCharacter ? 'min-w-[200px]!' : 'min-w-[150px]! w-[150px]';
    const isAnswerEmpty = answer?.length === 0;

    const handleCreateAnswer = () => {
        log.record(`submit:${JSON.stringify(answer)}`);
        setSubmitted(prev => [...prev, answer]);
        setAnswer('');
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        log.record(`keydown:${event.key}`);
        if (event.key === 'Enter' && answer.length > 0) {
            event.preventDefault();
            handleCreateAnswer();
        }
    };

    return (
        <div className="bg-white p-4 rounded-[20px]">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- copied from the source */}
            <div
                className="flex items-center justify-between rounded-full py-[5px]! px-[16px] font-semibold text-[17px] font-notoSans mt-2 mr-2 bg-grayscale-100 text-grayscale-500"
                onClick={() => {
                    log.record('wrapper-click');
                    if (!isAnswerEmpty) {
                        handleCreateAnswer();
                    }
                }}
            >
                <AppTextarea
                    value={answer}
                    onValueInput={value => {
                        log.record(`input:${JSON.stringify(value)}`);
                        setAnswer(value);
                    }}
                    {...probes(log)}
                    placeholder={placeholderText}
                    className={`${minWidth} ion-no-padding mb-0! min-h-0!`}
                    autoGrow
                    rows={1}
                    onKeyDown={handleKeyDown}
                />
                <AnimatedPlusToXIcon
                    isPlus
                    className="text-grayscale-500 h-[24px] w-auto ml-[10px] shrink-0 pt-0!"
                />
            </div>
            <Value testId={`${testId}-value`} value={{ answer, submitted }} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

/** src/components/familyCMS/FamilyCMSContentForm/FamilyCMSContentForm.tsx:163-205 */
const FamilyMotto: React.FC<{ testId: string; withError?: boolean }> = ({ testId, withError }) => {
    const log = useEventLog();
    const [description, setDescription] = useState<string>(withError ? '' : 'Together we grow.');
    const [basicInfo, setBasicInfo] = useState<{ description: string }>({ description });
    const [errors, setErrors] = useState<Record<string, string[]>>(
        withError ? { description: ['A motto is required'] } : {}
    );
    const handleSetState = (_section: string, key: string, value: string) =>
        setBasicInfo(prev => ({ ...prev, [key]: value }));

    return (
        <div className="bg-white p-4 rounded-[20px]">
            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Motto
                </h3>

                <div className="relative">
                    <AppTextarea
                        aria-label="motto"
                        autoGrow
                        autocapitalize="on"
                        value={description}
                        onValueInput={value => {
                            log.record(`input:${JSON.stringify(value)}`);
                            const _familyMotto = value;
                            setDescription(_familyMotto);
                            handleSetState('basicInfo', 'description', _familyMotto);

                            setErrors?.({});
                        }}
                        {...probes(log)}
                        placeholder="What's your family motto?"
                        className={`bg-grayscale-100 text-grayscale-900 rounded-[15px] font-normal text-[17px] font-poppins p-4 troops-cms-placeholder ${
                            errors?.description ? 'border-red-300 border-2' : ''
                        }`}
                        rows={5}
                        maxlength={620}
                    />
                    {description.length > 0 && (
                        <button
                            data-testid={`${testId}-clear`}
                            aria-label="clear motto"
                            onClick={() => {
                                log.record('clear');
                                setDescription('');
                                handleSetState('basicInfo', 'description', '');
                            }}
                            className="absolute top-[8%] right-[3%] z-10"
                        >
                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                        </button>
                    )}
                    {errors?.description && (
                        <div className="text-red-400 font-medium pl-1 mt-1">
                            {errors?.description}
                        </div>
                    )}
                </div>
            </div>
            <Value testId={`${testId}-value`} value={{ description, basicInfo, errors }} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

// ---------------------------------------------------------------------------------------------
// X-E admin / tools
// ---------------------------------------------------------------------------------------------

/**
 * src/pages/adminToolsPage/api-tokens/CreateAPITokenModal.tsx:199-218 (EditAPITokenModal.tsx:42-61
 * is the same textarea). `--min-width` / `--max-width` are not ion-textarea variables (no-ops).
 */
const ApiTokenDescription: React.FC = () => {
    const log = useEventLog();
    const [description, setDescription] = useState<string>('');
    return (
        <div className="bg-white rounded-[20px]">
            <section className="p-[20px]">
                <h1 className="font-semibold mb-[10px] font-notoSans text-[20px] text-grayscale-900">
                    Create API Token
                </h1>
                <AppTextarea
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base pl-4 pt-2"
                    style={{ '--min-width': '385px', '--max-width': '385px' }}
                    rows={3}
                    onValueInput={value => {
                        log.record(`input:${JSON.stringify(value)}`);
                        setDescription(value);
                    }}
                    {...probes(log)}
                    value={description}
                    placeholder="Description"
                />
            </section>
            <Value testId="x1b-e-api-token-value" value={description} />
            <Events testId="x1b-e-api-token-events" log={log} />
        </div>
    );
};

/** src/pages/adminToolsPage/CreateContractModal.tsx:471-529 (wrappers reduced to the column). */
const ContractDescription: React.FC = () => {
    const log = useEventLog();
    const [contract, setContract] = useState<{ description: string }>({
        description: 'Shares your name and achievements with the partner app.',
    });
    const updateSlice = (key: string, value: string) => {
        log.record(`input:${JSON.stringify(value)}`);
        setContract(prev => ({ ...prev, [key]: value }));
    };
    return (
        <div className="bg-white rounded-[20px]">
            <div className="flex flex-col gap-[20px] text-grayscale-800 py-[30px] px-[20px]">
                <div className="flex flex-col gap-[10px] w-full">
                    <AppTextarea
                        value={contract.description}
                        onValueInput={value => updateSlice('description', value)}
                        {...probes(log)}
                        placeholder="Describe your contract"
                        rows={6}
                        className="pl-3 pr-2 font-medium tracking-widest bg-grayscale-100 text-grayscale-800 rounded-[15px]"
                    />
                </div>
            </div>
            <Value testId="x1b-e-contract-value" value={contract.description} />
            <Events testId="x1b-e-contract-events" log={log} />
        </div>
    );
};

/** src/components/learncard/checklist/checklist-steps/CheckListUploadRawVC.tsx:316-334 */
const CheckListRawVc: React.FC<{ testId: string; initial?: string }> = ({
    testId,
    initial = '',
}) => {
    const log = useEventLog();
    const [rawVcText, setRawVcText] = useState<string>(initial);
    return (
        <div className="bg-white p-4 rounded-[20px]">
            <div className="flex flex-col gap-[10px] w-full">
                <AppTextarea
                    value={rawVcText}
                    onValueInput={value => {
                        log.record(`input:${JSON.stringify(value)}`);
                        setRawVcText(value);
                    }}
                    {...probes(log)}
                    className="ion-no-padding mb-0! h-[112px] overflow-hidden bg-grayscale-100 rounded-[10px] text-grayscale-800 text-[15px] font-notoSans"
                    // For some reason placeholder-grayscale-400 doesn't work
                    style={{
                        '--placeholder-color': 'rgb(156 163 175)', // grayscale-400 equivalent
                        '--placeholder-opacity': '0.7',
                        '--padding-top': '10px',
                        '--padding-start': '10px',
                        '--padding-end': '10px',
                        '--padding-bottom': '10px',
                    }}
                    placeholder="Paste your JSON here..."
                    rows={4}
                />
            </div>
            <Value testId={`${testId}-value`} value={rawVcText} />
            <Events testId={`${testId}-events`} log={log} />
        </div>
    );
};

/** src/pages/SkillFrameworks/EditAlignmentModal.tsx:303-320 */
const AlignmentStatement: React.FC = () => {
    const log = useEventLog();
    const [node, setNode] = useState<{ targetDescription?: string }>({
        targetDescription: 'Explains how photosynthesis converts light into chemical energy.',
    });
    return (
        <div className="bg-white rounded-[20px]">
            <div className="flex flex-col gap-[15px] p-[20px]">
                <div className="flex flex-col gap-[5px] w-full">
                    <label className="text-grayscale-600 font-poppins text-[12px] font-[600]">
                        Statement
                    </label>
                    <AppTextarea
                        onValueInput={value => {
                            log.record(`input:${JSON.stringify(value)}`);
                            setNode(prev => ({
                                ...prev,
                                targetDescription: value,
                            }));
                        }}
                        {...probes(log)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[10px] py-[5px]! px-[10px]!"
                        placeholder="Statement"
                        value={node.targetDescription}
                        rows={4}
                    />
                </div>
            </div>
            <Value testId="x1b-e-edit-alignment-value" value={node.targetDescription} />
            <Events testId="x1b-e-edit-alignment-events" log={log} />
        </div>
    );
};

/** src/pages/SkillFrameworks/CreateFrameworkModal.tsx:307-357 (thumbnail row omitted). */
const FrameworkDescription: React.FC = () => {
    const log = useEventLog();
    const [description, setDescription] = useState<string>('');
    return (
        <div className="flex flex-col gap-[20px] bg-white p-[20px] rounded-[20px] shadow-bottom-0-4">
            <AppTextarea
                onValueInput={value => {
                    log.record(`input:${JSON.stringify(value)}`);
                    setDescription(value);
                }}
                {...probes(log)}
                className="bg-grayscale-100 text-grayscale-800 rounded-[16px] py-[8px] px-[15px]!"
                placeholder="Framework description"
                value={description}
                rows={4}
            />
            <Value testId="x1b-e-create-framework-value" value={description} />
            <Events testId="x1b-e-create-framework-events" log={log} />
        </div>
    );
};

export const TextareasVisualFixture: React.FC = () => (
    <main className="mx-auto flex w-full max-w-[860px] flex-col items-stretch gap-6 p-6 font-poppins">
        {/*
         * IonApp starts Ionic's focus-visible and tap-click utilities (and, on iOS / Android web,
         * the input shims), as it does at the real app root. Its host CSS (absolute, contain,
         * overflow) would clip this long page, so it is mounted empty and hidden.
         */}
        <IonApp style={{ display: 'none' }} aria-hidden="true" />

        <Block testId="x1b-matrix" title="IonTextarea states × modes (synthetic)">
            <TextareaMatrix />
        </Block>
        <Block testId="x1b-writeback" title="IonTextarea value write-back on parent re-render">
            <WriteBackProbe />
        </Block>

        <Block
            testId="x1b-a-basic-info-issuer"
            title="X-A BoostCMSBasicInfoForm issuerName (rows 2)"
        >
            <BoostCMSBasicInfoTextarea
                testId="x1b-a-basic-info-issuer"
                field="issuerName"
                rows={2}
                placeholder="Issuer name"
            />
        </Block>
        <Block
            testId="x1b-a-basic-info-description"
            title="X-A BoostCMSBasicInfoForm description (rows 3, filled)"
        >
            <BoostCMSBasicInfoTextarea
                testId="x1b-a-basic-info-description"
                field="description"
                rows={3}
                placeholder="Description"
                initial={LOREM}
            />
        </Block>
        <Block
            testId="x1b-a-basic-info-narrative-disabled"
            title="X-A BoostCMSBasicInfoForm narrative (rows 3, disabled)"
        >
            <BoostCMSBasicInfoTextarea
                testId="x1b-a-basic-info-narrative-disabled"
                field="narrative"
                rows={3}
                placeholder="Narrative"
                initial="Complete all six garden sessions."
                disabled
            />
        </Block>
        <Block
            testId="x1b-a-advanced-narrative"
            title="X-A BoostCMSAdvancedSettingsForm narrative (rows 10)"
        >
            <BoostCMSBasicInfoTextarea
                testId="x1b-a-advanced-narrative"
                field="narrative"
                rows={10}
                placeholder="How to earn this achievement"
            />
        </Block>

        <Block testId="x1b-b-endorsement-text" title="X-B EndorsementTextForm (real)">
            <RealEndorsementTextForm testId="x1b-b-endorsement-text" />
        </Block>
        <Block testId="x1b-b-endorsement-text-error" title="X-B EndorsementTextForm (real, error)">
            <RealEndorsementTextForm testId="x1b-b-endorsement-text-error" withError />
        </Block>
        <Block
            testId="x1b-b-endorsement-qualifications"
            title="X-B EndorsementQualificationsTextForm (real)"
        >
            <RealEndorsementQualificationsForm testId="x1b-b-endorsement-qualifications" />
        </Block>
        <Block
            testId="x1b-b-endorsement-request-text"
            title="X-B EndorsementRequestTextForm (real)"
        >
            <RealEndorsementRequestTextForm testId="x1b-b-endorsement-request-text" />
        </Block>
        <Block
            testId="x1b-b-endorsement-request-options"
            title="X-B EndorsementRequestOptions message"
        >
            <EndorsementRequestOptionsMessage />
        </Block>
        <Block testId="x1b-b-boost-notes" title="X-B BoostCMSNotesForm (real, uncontrolled)">
            <RealBoostNotesForm />
        </Block>

        <Block testId="x1b-c-title" title="X-C BoostCMSTitleForm (real, slot=end counter)">
            <RealBoostTitleForm testId="x1b-c-title" />
        </Block>
        <Block testId="x1b-c-title-disabled" title="X-C BoostCMSTitleForm (real, disabled)">
            <RealBoostTitleForm testId="x1b-c-title-disabled" disabled />
        </Block>

        <Block
            testId="x1b-d-ai-insights"
            title="X-D AiInsightsPromptBoxInput (real, autoGrow rows 2)"
        >
            <RealAiInsightsPromptBoxInput />
        </Block>
        <Block
            testId="x1b-d-ai-passport"
            title="X-D AiPassportPersonalizationAnswerInput (autoGrow rows 1, onKeyDown)"
        >
            <AiPassportAnswerInput testId="x1b-d-ai-passport" />
        </Block>
        <Block
            testId="x1b-d-ai-passport-fav-character"
            title="X-D AiPassportPersonalizationAnswerInput (favFictionalCharacter width)"
        >
            <AiPassportAnswerInput testId="x1b-d-ai-passport-fav-character" favFictionalCharacter />
        </Block>
        <Block testId="x1b-d-family-motto" title="X-D FamilyCMSContentForm motto (autoGrow rows 5)">
            <FamilyMotto testId="x1b-d-family-motto" />
        </Block>
        <Block testId="x1b-d-family-motto-error" title="X-D FamilyCMSContentForm motto (error)">
            <FamilyMotto testId="x1b-d-family-motto-error" withError />
        </Block>

        <Block testId="x1b-e-api-token" title="X-E CreateAPITokenModal / EditAPITokenModal">
            <ApiTokenDescription />
        </Block>
        <Block testId="x1b-e-contract" title="X-E CreateContractModal description (rows 6)">
            <ContractDescription />
        </Block>
        <Block testId="x1b-e-checklist-raw-vc" title="X-E CheckListUploadRawVC (empty)">
            <CheckListRawVc testId="x1b-e-checklist-raw-vc" />
        </Block>
        <Block testId="x1b-e-checklist-raw-vc-filled" title="X-E CheckListUploadRawVC (filled)">
            <CheckListRawVc
                testId="x1b-e-checklist-raw-vc-filled"
                initial={
                    '{\n  "@context": ["https://www.w3.org/ns/credentials/v2"],\n  "type": ["VerifiableCredential"],\n  "issuer": "did:example:issuer",\n  "credentialSubject": { "id": "did:example:learner" }\n}'
                }
            />
        </Block>
        <Block testId="x1b-e-edit-alignment" title="X-E EditAlignmentModal statement (rows 4)">
            <AlignmentStatement />
        </Block>
        <Block
            testId="x1b-e-create-framework"
            title="X-E CreateFrameworkModal description (rows 4)"
        >
            <FrameworkDescription />
        </Block>
    </main>
);
