// Ed.link API (pure API calls)
export {
    EDLINK_CONFIG,
    fetchClasses,
    fetchPeople,
    fetchEnrollments,
    fetchAssignments,
    fetchSubmissions,
    fetchEvents,
    fetchIntegrations,
    destroyIntegration,
    destroySource,
    edlinkApi,
} from './edlinkApi';

// Transformers (mapping logic)
export {
    mapProviderString,
    formatProviderName,
    transformOnboardingData,
    transformIntegration,
    transformers,
} from './transformers';

// Service (convenience layer)
export {
    getConnections,
    getClasses,
    getPeople,
    getEnrollments,
    getAssignments,
    getSubmissions,
    getEvents,
    fetchAllLmsData,
    verifyConnection,
    disconnectConnection,
    disconnectBySourceId,
    edlinkService,
} from './edlinkService';

export { edlinkService as default } from './edlinkService';
