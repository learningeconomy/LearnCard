/**
 * Ed.link API Client
 *
 * Pure API calls to Ed.link endpoints. No transformation logic.
 *
 * @see https://ed.link/docs/api
 * @see https://ed.link/docs/guides/v2.0/getting-started/graph-user-meta-apis
 */

import type {
    EdlinkClass,
    EdlinkPerson,
    EdlinkEnrollment,
    EdlinkAssignment,
    EdlinkSubmission,
    EdlinkIntegration,
    EdlinkGraphResponse,
    EdlinkListIntegrationsResponse,
    EdlinkEventsResponse,
} from '../types';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Ed.link configuration constants.
 *
 * - APP_ID: Your Ed.link application ID (found in Ed.link Dashboard)
 * - GRAPH_API_BASE: Base URL for Graph API v2 endpoints
 * - META_API_BASE: Base URL for Meta API v1 endpoints
 * - THEME_COLOR: Primary color for the onboarding widget
 *
 * @see https://ed.link/docs/guides/v2.0/getting-started/quickstart
 */
export const EDLINK_CONFIG = {
    APP_ID: 'c15dc116-ba0c-4fc0-bfb9-9e50ba7a8eaa',
    GRAPH_API_BASE: 'https://ed.link/api/v2/graph',
    META_API_BASE: 'https://ed.link/api/v1',
    THEME_COLOR: '#06b6d4',
} as const;

// =============================================================================
// Graph API (uses Integration Access Token)
// =============================================================================

/**
 * Creates authorization headers for Graph API requests.
 *
 * The Graph API requires an Integration Access Token, which is obtained
 * either from the onboarding widget callback or from the Meta API.
 *
 * @see https://ed.link/docs/guides/v2.0/getting-started/graph-user-meta-apis
 */
const createGraphHeaders = (accessToken: string): HeadersInit => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
});

/**
 * Fetches classes from the connected LMS.
 *
 * **Endpoint:** `GET https://ed.link/api/v2/graph/classes`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * **Response:** Paginated list of classes with `$data` array and optional `$next` cursor.
 *
 * **Example Response:**
 * ```json
 * {
 *   "$data": [
 *     {
 *       "id": "cls_abc123",
 *       "name": "Algebra 101",
 *       "description": "Introduction to Algebra",
 *       "state": "active",
 *       "created_date": "2024-01-15T10:30:00Z",
 *       "updated_date": "2024-01-15T10:30:00Z"
 *     }
 *   ],
 *   "$next": "cursor_token_for_next_page"
 * }
 * ```
 *
 * @see https://ed.link/docs/api/v2.0/classes/graph-list-classes
 */
export const fetchClasses = async (accessToken: string): Promise<EdlinkGraphResponse<EdlinkClass>> => {
    const response = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/classes`, {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (classes):', errorBody);
        throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

/**
 * Fetches people (students, teachers, administrators) from the connected LMS.
 *
 * **Endpoint:** `GET https://ed.link/api/v2/graph/people`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * **Response:** Paginated list of people with `$data` array and optional `$next` cursor.
 *
 * **Example Response:**
 * ```json
 * {
 *   "$data": [
 *     {
 *       "id": "per_abc123",
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "display_name": "John Doe",
 *       "email": "john.doe@school.edu",
 *       "roles": ["student"],
 *       "created_date": "2024-01-15T10:30:00Z",
 *       "updated_date": "2024-01-15T10:30:00Z"
 *     }
 *   ]
 * }
 * ```
 *
 * @see https://ed.link/docs/api/v2.0/people/graph-list-people
 */
export const fetchPeople = async (accessToken: string): Promise<EdlinkGraphResponse<EdlinkPerson>> => {
    const response = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/people`, {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (people):', errorBody);
        throw new Error(`Failed to fetch people: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

/**
 * Fetches enrollments (who is in which class with what role) from the connected LMS.
 *
 * **Endpoint:** `GET https://ed.link/api/v2/graph/enrollments`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * **Response:** Paginated list of enrollments linking people to classes.
 *
 * **Example Response:**
 * ```json
 * {
 *   "$data": [
 *     {
 *       "id": "enr_abc123",
 *       "role": "student",
 *       "state": "active",
 *       "created_date": "2024-01-15T10:30:00Z",
 *       "updated_date": "2024-01-15T10:30:00Z",
 *       "person": { "id": "per_abc123", ... },
 *       "class": { "id": "cls_abc123", ... }
 *     }
 *   ]
 * }
 * ```
 *
 * @see https://ed.link/docs/api/v2.0/enrollments/graph-list-enrollments
 */
export const fetchEnrollments = async (accessToken: string): Promise<EdlinkGraphResponse<EdlinkEnrollment>> => {
    const response = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/enrollments`, {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (enrollments):', errorBody);
        throw new Error(`Failed to fetch enrollments: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

/**
 * Fetches assignments from the connected LMS.
 *
 * **Endpoint:** `GET https://ed.link/api/v2/graph/assignments`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * Assignments represent coursework that students need to complete.
 * Useful for credential issuance based on assignment completion.
 *
 * @see https://ed.link/docs/api/v2.0/assignments/graph-list-assignments
 */
export const fetchAssignments = async (accessToken: string): Promise<EdlinkGraphResponse<EdlinkAssignment>> => {
    const response = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/assignments`, {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (assignments):', errorBody);
        throw new Error(`Failed to fetch assignments: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

/**
 * Fetches submissions from the connected LMS.
 *
 * **Endpoint:** `GET https://ed.link/api/v2/graph/submissions`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * Submissions represent student work submitted for assignments.
 * Contains grade, submission state, and timestamps useful for credentials.
 *
 * @see https://ed.link/docs/api/v2.0/submissions/graph-list-submissions
 */
export const fetchSubmissions = async (accessToken: string): Promise<EdlinkGraphResponse<EdlinkSubmission>> => {
    const response = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/submissions`, {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (submissions):', errorBody);
        throw new Error(`Failed to fetch submissions: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

// =============================================================================
// Event Deltas API (v1 Graph API - for change tracking)
// =============================================================================

/**
 * Fetches events from the Event Deltas API.
 *
 * **Endpoint:** `GET https://ed.link/api/v1/graph/events`
 *
 * **Authentication:** Integration Access Token (Bearer)
 *
 * **Purpose:** Track incremental changes to roster data (people, enrollments, terms, orgs).
 * This is useful for detecting course completion via enrollment state changes.
 *
 * **Supported Event Types:**
 * - `enrollment.created`, `enrollment.updated`, `enrollment.deleted`
 * - `person.created`, `person.updated`, `person.deleted`
 * - `term.created`, `term.updated`, `term.deleted`
 * - `organization.created`, `organization.updated`, `organization.deleted`
 *
 * **NOT Supported (must poll directly):**
 * - submission.*, assignment.*, grade.*, class.*
 *
 * **Pagination:** Cursor-based with `$first` and `$after` parameters.
 * - Always use forward pagination only
 * - Store the `$next` cursor to resume polling from where you left off
 * - Events are retained for 30 days
 *
 * **Example Response:**
 * ```json
 * {
 *   "$data": [
 *     {
 *       "id": "evt_abc123",
 *       "created_date": "2024-01-15T10:30:00Z",
 *       "type": "enrollment.updated",
 *       "data": {
 *         "id": "enr_abc123",
 *         "state": "completed",
 *         "role": "student",
 *         "person": { "id": "per_abc123", "email": "student@school.edu", ... },
 *         "class": { "id": "cls_abc123", "name": "Algebra 101", ... }
 *       }
 *     }
 *   ],
 *   "$next": "cursor_for_next_page"
 * }
 * ```
 *
 * @param accessToken - Integration Access Token
 * @param afterCursor - Optional cursor from previous response's $next field
 * @param limit - Number of events to fetch (default 100)
 *
 * @see https://ed.link/docs/api/v1.0/graph/events
 * @see https://ed.link/docs/guides/v2.0/rostering/events
 */
export const fetchEvents = async (
    accessToken: string,
    afterCursor?: string,
    limit: number = 100
): Promise<EdlinkEventsResponse> => {
    // Note: Event Deltas API is v1, not v2
    const url = new URL('https://ed.link/api/v1/graph/events');
    url.searchParams.set('$first', String(limit));
    if (afterCursor) {
        url.searchParams.set('$after', afterCursor);
    }

    const response = await fetch(url.toString(), {
        headers: createGraphHeaders(accessToken),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ed.link API error (events):', errorBody);
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

// =============================================================================
// Meta API (uses Application Secret)
// =============================================================================

// DEV ONLY: Get secret from localStorage
// Set it in browser console: localStorage.setItem('EDLINK_APP_SECRET', 'your-secret')
const EDLINK_APP_SECRET = typeof window !== 'undefined' ? localStorage.getItem('EDLINK_APP_SECRET') : null;

/**
 * Fetches all integrations for your Ed.link application.
 *
 * **Endpoint:** `GET https://ed.link/api/v1/integrations`
 *
 * **Authentication:** Application Secret Key (Bearer) - found in Ed.link Dashboard
 *
 * **⚠️ WARNING:** This endpoint requires your Application Secret, which must
 * NEVER be exposed client-side. Call this from a backend service only.
 *
 * **Response:** List of all integrations (connected schools/districts).
 *
 * **Example Response:**
 * ```json
 * {
 *   "$data": [
 *     {
 *       "id": "3c58530b-53c5-4fff-b87b-14b6979bd3b2",
 *       "status": "active",
 *       "scope": "all",
 *       "created_date": "2024-01-15T10:30:00Z",
 *       "updated_date": "2024-01-15T10:30:00Z",
 *       "permissions": [],
 *       "targets": [],
 *       "access_token": "ZLQkLniHyIrw6AbcaNtlKMRyfSutuvIY",
 *       "source": {
 *         "id": "64d8f1fa-d68a-4096-84ad-a64104759aaf",
 *         "status": "active",
 *         "name": "Springfield High School",
 *         "created_date": "2024-01-15T10:30:00Z",
 *         "updated_date": "2024-01-15T10:30:00Z",
 *         "sync_interval": 86400
 *       },
 *       "provider": {
 *         "id": "47eda4bf-7440-4cd8-9ee7-44cafb98486b",
 *         "name": "Google Classroom",
 *         "icon_url": "/source/google_classroom.png",
 *         "application": "google_classroom",
 *         "allows_data_sync": true
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @see https://ed.link/docs/guides/v2.0/integration-management/configuring-integrations-via-api
 */
export const fetchIntegrations = async (applicationSecret: string): Promise<EdlinkListIntegrationsResponse> => {
    const response = await fetch(`${EDLINK_CONFIG.META_API_BASE}/integrations`, {
        headers: {
            Authorization: `Bearer ${applicationSecret}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

/**
 * Destroys (disconnects) an integration via Ed.link Meta API.
 *
 * **Endpoint:** `DELETE https://ed.link/api/v1/integrations/:id`
 *
 * **Authentication:** Application Secret Key (Bearer)
 *
 * **⚠️ DEV ONLY:** This function hardcodes the Application Secret client-side.
 * For production, this MUST be called from a backend service.
 *
 * @param integrationId - The integration ID to destroy
 */
export const destroyIntegration = async (integrationId: string): Promise<void> => {
    if (!EDLINK_APP_SECRET) {
        throw new Error(
            'EDLINK_APP_SECRET not found in localStorage. Set it with: ' +
            "localStorage.setItem('EDLINK_APP_SECRET', 'your-secret-here')"
        );
    }

    const response = await fetch(
        `${EDLINK_CONFIG.META_API_BASE}/integrations/${integrationId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${EDLINK_APP_SECRET}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to destroy integration: ${response.status} ${response.statusText}`);
    }
};

/**
 * Destroys (deletes) a source via Ed.link Meta API.
 *
 * **Endpoint:** `DELETE https://ed.link/api/v1/sources/:id`
 *
 * **Authentication:** Application Secret Key (Bearer)
 *
 * **⚠️ DEV ONLY:** This function hardcodes the Application Secret client-side.
 * For production, this MUST be called from a backend service.
 *
 * A Source represents the LMS itself (e.g., Springfield High's Canvas instance).
 * Deleting a source will also remove all integrations connected to it.
 *
 * @param sourceId - The source ID to destroy
 */
export const destroySource = async (sourceId: string): Promise<void> => {
    if (!EDLINK_APP_SECRET) {
        throw new Error(
            'EDLINK_APP_SECRET not found in localStorage. Set it with: ' +
            "localStorage.setItem('EDLINK_APP_SECRET', 'your-secret-here')"
        );
    }

    const response = await fetch(
        `${EDLINK_CONFIG.META_API_BASE}/sources/${sourceId}`,
        {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${EDLINK_APP_SECRET}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to destroy source: ${response.status} ${response.statusText}`);
    }
};

/**
 * Convenience object grouping all Ed.link API functions.
 */
export const edlinkApi = {
    config: EDLINK_CONFIG,
    fetchClasses,
    fetchPeople,
    fetchEnrollments,
    fetchAssignments,
    fetchSubmissions,
    fetchEvents,
    fetchIntegrations,
    destroyIntegration,
    destroySource,
};

export default edlinkApi;
