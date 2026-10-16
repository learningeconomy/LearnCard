import type { Browser, BrowserContext, Page } from '@playwright/test';

import type { VerificationLearnCard } from './sdk';

/** Where a journey's user stands: the web app, the SDK, the `learncard` CLI, or several at once. */
export type VerificationSurface = 'web' | 'sdk' | 'cli' | 'cross-surface' | 'docs';

export interface VerificationActor {
    role: string;
    seed: string;
    profileId: string;
    displayName: string;
}

export interface NewContextOptions {
    /** Record a WebM of every page in this context (also enabled globally by `--video`). */
    video?: boolean;
}

export interface NewPageOptions extends NewContextOptions {
    /** Sign this actor in (developer seed sign-in) before returning the page. */
    signInAs?: VerificationActor;
    /** Passed to `signIn`; ignored without `signInAs`. */
    createProfile?: boolean;
}

export interface SignInOptions {
    /**
     * Create the network profile during developer sign-in (`?profileId=`). Defaults to true.
     * Pass false to leave the account profile-less, e.g. to drive real onboarding afterwards.
     */
    createProfile?: boolean;
}

export interface VerificationContext {
    baseUrl: string;
    artifactsDir: string;
    runId: string;
    browser: Browser;
    /** Fresh run-owned actors. Each feature gets its own, even on a retained stack. */
    actors: Record<'learner' | 'recipient' | 'issuer', VerificationActor>;
    /** Mint another run-owned actor (random seed, unique profile ID). */
    newActor: (role: string) => VerificationActor;
    /** Isolated browser context with the verification network policy, tracing, and evidence. */
    newContext: (label: string, options?: NewContextOptions) => Promise<BrowserContext>;
    /** One-page context, optionally signed in as an actor. Lands on `/wallet` when signed in. */
    newPage: (label: string, options?: NewPageOptions) => Promise<Page>;
    /** Real developer seed sign-in through the UI; lands on a signed-in `/wallet`. */
    signIn: (page: Page, actor: VerificationActor, options?: SignInOptions) => Promise<void>;
    /** A real network LearnCard (checkout source) for this actor; creates its profile if absent. */
    sdk: (actor: VerificationActor) => Promise<VerificationLearnCard>;
    /** Screenshot + accessibility snapshot before/after an action; failures are captured too. */
    step: <T>(page: Page, label: string, action: () => Promise<T>) => Promise<T>;
    /** Screenshot + accessibility snapshot of the current state. */
    capture: (page: Page, label: string) => Promise<void>;
    /** Read-only corroboration of side effects in the owned databases. */
    inspect: {
        neo4j: (cypher: string) => Promise<string>;
        mongo: (database: string, collection?: string, filter?: object) => Promise<string>;
    };
    /** Persist nonsecret JSON evidence (API results, DB rows) under the feature directory. */
    record: (label: string, value: unknown) => Promise<string>;
}

export interface FeatureResult {
    entries: string[];
    observations: Record<string, unknown>;
}

export interface FeatureDefinition {
    id: string;
    title: string;
    surface: VerificationSurface;
    /** Every entry must be exercised and asserted before the feature can pass. */
    entries: string[];
    /** Extra local processes the journey launches, so `list` can warn about ports. */
    requires?: string[];
    run: (context: VerificationContext) => Promise<FeatureResult>;
}
