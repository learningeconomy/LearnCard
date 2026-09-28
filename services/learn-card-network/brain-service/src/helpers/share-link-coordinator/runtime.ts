import {
    abandonRecoveredReservation,
    abandonReservation,
    claimCleanupJobs,
    claimRecoverableReservation,
    completeCleanupJob,
    discoverRecoverableReservations,
    finalizeReservation,
    getCurrentShareContent,
    getShareLink,
    readShareLinkRecoveryTarget,
    reserveCreate,
    reserveReplacement,
    revokeShareLink,
} from '@accesslayer/share-link';

import { createShareLinkCoordinator } from './coordinator';
import type {
    CleanupRunnerDependencies,
    RecoveryRunnerDependencies,
    ShareLinkCoordinator,
    ShareLinkCoordinatorDependencies,
    ShareLinkLifecycleRepository,
    ShareLinkRecoveryRepository,
} from './types';

/**
 * Production wiring for the coordinator over the reviewed C3 lifecycle
 * repository. Kept out of the coordinator barrel so unit tests never import
 * `@instance`/the Neo4j graph.
 *
 * The scheduler is deliberately absent: nothing here starts a timer or worker.
 */
const runtimeRepository: ShareLinkLifecycleRepository = {
    reserveCreate,
    reserveReplacement,
    finalizeReservation,
    abandonReservation,
    revokeShareLink,
    getShareLink,
    getCurrentShareContent,
    claimCleanupJobs,
    completeCleanupJob,
};

/**
 * Production wiring for durable reservation recovery. It is separate from the
 * lifecycle repository so no runner can accidentally accept a serialized caller
 * reservation as authority.
 */
const runtimeRecoveryRepository: ShareLinkRecoveryRepository = {
    discoverRecoverableReservations,
    readShareLinkRecoveryTarget,
    claimRecoverableReservation,
    abandonRecoveredReservation,
    finalizeReservation,
};

export const createRuntimeShareLinkCoordinator = (
    options: Omit<ShareLinkCoordinatorDependencies, 'repository'> & {
        repository?: ShareLinkLifecycleRepository;
    }
): ShareLinkCoordinator =>
    createShareLinkCoordinator({
        ...options,
        repository: options.repository ?? runtimeRepository,
    });

export const createRuntimeCleanupRunnerDependencies = (
    options: Omit<CleanupRunnerDependencies, 'repository'> & {
        repository?: CleanupRunnerDependencies['repository'];
    }
): CleanupRunnerDependencies => ({
    ...options,
    repository: options.repository ?? runtimeRepository,
});

export const createRuntimeRecoveryRunnerDependencies = (
    options: Omit<RecoveryRunnerDependencies, 'repository'> & {
        repository?: ShareLinkRecoveryRepository;
    }
): RecoveryRunnerDependencies => ({
    ...options,
    repository: options.repository ?? runtimeRecoveryRepository,
});
