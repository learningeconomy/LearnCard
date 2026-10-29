import type { ScenarioPort, DriverName } from '../port';
import type { ScenarioIds } from './ids';

/** SETUP builds fixtures; PRODUCT walks a product path; NEGATIVE expects a refusal. */
export type StepKind = 'SETUP' | 'PRODUCT' | 'NEGATIVE' | 'AUDIT' | 'OBSERVE';

/** The surface a step drives: the console (BFF), brain directly, the partner, the wallet, or the database. */
export type StepVia = 'CONSOLE' | 'BRAIN' | 'PARTNER' | 'WALLET' | 'DIRECT';

export type StepStatus = 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED' | 'WARN' | 'OBSERVED';

export type ScenarioOptions = {
    driver: DriverName;
    json: boolean;
    only?: string;
    from?: string;
    keepLms: boolean;
    /** Live only: reuse this district instead of creating `scenario-<runId>`. */
    districtId?: string;
};

export type StepContext = {
    port: ScenarioPort;
    ids: ScenarioIds;
    options: ScenarioOptions;
    runId: string;
    /** ISO time the run started; audit checks only look at events after it. */
    runStartedAt: string;
    /** Adds a report label (e.g. DIRECT, MOCK-SIGNER) to the running step. */
    label: (label: string) => void;
    /** Adds a detail line shown under the step in the report. */
    note: (message: string) => void;
    /** Results of the steps that already ran, in order. */
    results: readonly StepResult[];
};

/** A step that returns nothing passed. Return WARN or OBSERVED to say otherwise; throw to fail. */
export type StepOutcome = { status: 'WARN' | 'OBSERVED' | 'SKIP'; reason: string };

export type Step = {
    id: string;
    title: string;
    /** ScenarioIds keys this step reads; missing ones block it. */
    needs: (keyof ScenarioIds)[];
    /** ScenarioIds keys this step fills on success. */
    produces: (keyof ScenarioIds)[];
    kind: StepKind;
    via: StepVia;
    /** Restricts the drivers that run this step; others report SKIP. */
    drivers?: DriverName[];
    /** A step listed for a later slice reports SKIP with this reason. */
    deferred?: string;
    /** A failing gate (the doctor) blocks every later step and makes the run exit 2. */
    gate?: true;
    run: (context: StepContext) => Promise<StepOutcome | void>;
};

export type StepResult = {
    id: string;
    title: string;
    kind: StepKind;
    via: StepVia;
    status: StepStatus;
    reason: string;
    /** Runner-side diagnosis of a failure (core/explain.ts). Never shown to partners. */
    explain?: string;
    labels: string[];
    notes: string[];
    ms: number;
};
