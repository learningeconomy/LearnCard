import { refuse } from './errors';

/**
 * Pure load-shape planning: stages, arrival classification, user and email
 * budgets. Nothing here performs IO.
 */
export interface Stage {
    /** Target arrivals per second. */
    rate: number;
    durationSec: number;
}

/** Hard ceilings, independent of operator flags. */
export const MAX_STAGES = 20;
export const MAX_RATE_PER_SEC = 50;
export const MAX_STAGE_SEC = 7_200;

/**
 * Emails per scenario, from lca-api/enclave code (see the header of
 * `scripts/load.ts` for file:line evidence):
 * - enrol (shares, opt-in, optional PIN, activation): none.
 * - PIN recovery: `escrow-hold-started` when the PIN hold is created plus
 *   `escrow-pin-sign-in` on release, to each verified recipient (one for these
 *   synthetic accounts: the login address).
 * Upper bound adds one: a hold left pending by a failed release can have its
 * `started` notice retried by the reminder job, or a failure sends `cancelled`.
 */
export const EMAILS_PER_PIN_RECOVERY = 2;
export const EMAILS_PER_PIN_RECOVERY_MAX = 3;

/**
 * lca-api's per-client-IP PIN limiter (`limitPinCompletion`, `src/routes/escrow.ts`):
 * Redis `INCR` on `escrow:pin-start:<client ip>` (every PIN-policy hold start) and
 * `escrow:pin-complete:<client ip>` (every completion with a PIN proof), `EXPIRE`
 * 60 s set on the first hit, 429 once the count exceeds 20. A fixed window, so a
 * burst straddling two windows can pass up to 40. Each PIN recovery makes one of
 * each, so ONE egress IP sustains at most 20 PIN recoveries per minute.
 */
export const PIN_CLIENT_IP_LIMIT = 20;
export const PIN_CLIENT_IP_WINDOW_SEC = 60;

/**
 * Stages whose planned PIN arrival rate, all from this generator's single egress
 * IP, exceeds the per-IP limit. Results above it measure the limiter, not capacity.
 */
export const pinRateOverClientIpLimit = (
    stages: Stage[],
    pinRatio: number
): { stage: number; pinPerWindow: number }[] =>
    stages.flatMap((stage, index) => {
        const pinPerWindow =
            Math.round(stage.rate * pinRatio * PIN_CLIENT_IP_WINDOW_SEC * 100) / 100;
        return pinPerWindow > PIN_CLIENT_IP_LIMIT ? [{ stage: index, pinPerWindow }] : [];
    });

/**
 * Roughtime requests PER SERVER, rough upper estimates derived from the
 * LAUNCH-DECISIONS.md "RT" table, which is itself an estimate (not measured).
 * Printed so the operator sees the third-party volume before starting.
 */
export const ROUGHTIME_ESTIMATE = {
    enrol: 6,
    enrolPinExtra: 6,
    pinSetup: 6,
    pinRecovery: 20,
} as const;

export const parseStages = (value: string | undefined): Stage[] => {
    if (!value) throw refuse('stages_required');
    const parts = value.split(',');
    if (parts.length === 0 || parts.length > MAX_STAGES) throw refuse('stages_count');
    return parts.map(part => {
        const match = /^\s*([0-9]+(?:\.[0-9]+)?):([0-9]+)\s*$/.exec(part);
        if (!match) throw refuse('stages_format');
        const rate = Number(match[1]);
        const durationSec = Number(match[2]);
        if (!(rate > 0) || rate > MAX_RATE_PER_SEC) throw refuse('stages_rate');
        if (!Number.isInteger(durationSec) || durationSec < 1 || durationSec > MAX_STAGE_SEC)
            throw refuse('stages_duration');
        return { rate, durationSec };
    });
};

/** Arrivals in one stage: floor(rate x duration), at exact 1/rate spacing. */
export const stageArrivals = (stage: Stage): number =>
    Math.floor(stage.rate * stage.durationSec + 1e-9);

/**
 * Deterministic interleave: arrival `index` is a PIN recovery when it crosses
 * the next multiple of 1/ratio. Exactly floor(n x ratio) of the first n are PIN.
 */
export const isPinArrival = (index: number, ratio: number): boolean =>
    Math.floor((index + 1) * ratio + 1e-9) > Math.floor(index * ratio + 1e-9);

export const pinCount = (arrivals: number, ratio: number): number =>
    Math.floor(arrivals * ratio + 1e-9);

export interface Arrival {
    index: number;
    stage: number;
    /** Offset from the schedule start, ms. */
    atMs: number;
    kind: 'enrol' | 'pin';
}

/** Every scheduled arrival, in time order. Stages run back to back. */
export const scheduleArrivals = (stages: Stage[], pinRatio: number): Arrival[] => {
    const out: Arrival[] = [];
    let offset = 0;
    let index = 0;
    stages.forEach((stage, stageIndex) => {
        const count = stageArrivals(stage);
        for (let k = 0; k < count; k += 1) {
            out.push({
                index,
                stage: stageIndex,
                atMs: offset + (k * 1000) / stage.rate,
                kind: isPinArrival(index, pinRatio) ? 'pin' : 'enrol',
            });
            index += 1;
        }
        offset += stage.durationSec * 1000;
    });
    return out;
};

export interface PlanInput {
    stages: Stage[];
    pinRatio: number;
    pinPool: number;
    enrolWithPin: boolean;
}

export interface LoadPlan {
    stages: Stage[];
    arrivals: number;
    enrolOps: number;
    pinOps: number;
    pinPool: number;
    /** Firebase users this run creates: one per enrol arrival plus the PIN pool. */
    users: number;
    expectedEmails: number;
    maxEmails: number;
    roughtimePerServerEstimate: number;
    durationSec: number;
}

export const buildPlan = (input: PlanInput): LoadPlan => {
    if (!(input.pinRatio >= 0 && input.pinRatio <= 1)) throw refuse('pin_ratio');
    if (!Number.isInteger(input.pinPool) || input.pinPool < 0) throw refuse('pin_pool');
    const arrivals = input.stages.reduce((sum, stage) => sum + stageArrivals(stage), 0);
    if (arrivals === 0) throw refuse('no_arrivals');
    const pinOps = pinCount(arrivals, input.pinRatio);
    const enrolOps = arrivals - pinOps;
    if (pinOps > 0 && input.pinPool < 1) throw refuse('pin_pool_required');
    if (pinOps === 0 && input.pinPool > 0) throw refuse('pin_pool_unused');
    const rt = ROUGHTIME_ESTIMATE;
    return {
        stages: input.stages,
        arrivals,
        enrolOps,
        pinOps,
        pinPool: input.pinPool,
        users: enrolOps + input.pinPool,
        expectedEmails: pinOps * EMAILS_PER_PIN_RECOVERY,
        maxEmails: pinOps * EMAILS_PER_PIN_RECOVERY_MAX,
        roughtimePerServerEstimate:
            enrolOps * (rt.enrol + (input.enrolWithPin ? rt.enrolPinExtra : 0)) +
            input.pinPool * rt.pinSetup +
            pinOps * rt.pinRecovery,
        durationSec: input.stages.reduce((sum, stage) => sum + stage.durationSec, 0),
    };
};
