/**
 * Ed.link Service
 *
 * Convenience layer combining API calls with transformations.
 * Use this for high-level operations that fetch data and return our internal models.
 *
 * @see https://ed.link/docs/api
 */

import { edlinkApi, EDLINK_CONFIG } from './edlinkApi';
import { transformers, transformIntegration } from './transformers';
import type {
    LMSConnection,
    EdlinkClass,
    EdlinkPerson,
    EdlinkEnrollment,
    EdlinkAssignment,
    EdlinkSubmission,
    EdlinkEvent,
    EdlinkEventsResponse,
    LmsData,
} from '../types';

/**
 * Fetches all integrations and transforms them to LMSConnection objects.
 *
 * This is a convenience method that:
 * 1. Calls the Meta API to get all integrations
 * 2. Transforms each integration into our LMSConnection model
 *
 * **⚠️ WARNING:** Requires Application Secret - use server-side only!
 *
 * **Underlying API:** `GET https://ed.link/api/v1/integrations`
 *
 * @param applicationSecret - Your Ed.link Application Secret (from Dashboard)
 * @returns Array of LMSConnection objects
 *
 * @example
 * ```typescript
 * // Server-side only!
 * const connections = await getConnections(process.env.EDLINK_APP_SECRET);
 * console.log(connections);
 * // [{ id: '...', provider: 'google', providerName: 'Google Classroom', ... }]
 * ```
 */
export const getConnections = async (applicationSecret: string): Promise<LMSConnection[]> => {
    const response = await edlinkApi.fetchIntegrations(applicationSecret);
    return response.$data.map(transformIntegration);
};

/**
 * Fetches classes for a connection and returns the data array.
 *
 * **Underlying API:** `GET https://ed.link/api/v2/graph/classes`
 *
 * @param accessToken - Integration Access Token (from onboarding callback or Meta API)
 * @returns Array of EdlinkClass objects
 *
 * @example
 * ```typescript
 * const classes = await getClasses(connection.accessToken);
 * console.log(classes);
 * // [{ id: 'cls_...', name: 'Algebra 101', state: 'active', ... }]
 * ```
 */
export const getClasses = async (accessToken: string): Promise<EdlinkClass[]> => {
    const response = await edlinkApi.fetchClasses(accessToken);
    return response.$data;
};

/**
 * Fetches people for a connection and returns the data array.
 *
 * **Underlying API:** `GET https://ed.link/api/v2/graph/people`
 *
 * @param accessToken - Integration Access Token (from onboarding callback or Meta API)
 * @returns Array of EdlinkPerson objects
 *
 * @example
 * ```typescript
 * const people = await getPeople(connection.accessToken);
 * const students = people.filter(p => p.roles.includes('student'));
 * const teachers = people.filter(p => p.roles.includes('teacher'));
 * ```
 */
export const getPeople = async (accessToken: string): Promise<EdlinkPerson[]> => {
    const response = await edlinkApi.fetchPeople(accessToken);
    return response.$data;
};

/**
 * Fetches enrollments for a connection and returns the data array.
 *
 * Enrollments link people to classes with their role (student, teacher, etc.).
 *
 * **Underlying API:** `GET https://ed.link/api/v2/graph/enrollments`
 *
 * @param accessToken - Integration Access Token (from onboarding callback or Meta API)
 * @returns Array of EdlinkEnrollment objects
 *
 * @example
 * ```typescript
 * const enrollments = await getEnrollments(connection.accessToken);
 * // Find all students in a specific class
 * const classStudents = enrollments.filter(
 *   e => e.class.id === 'cls_123' && e.role === 'student'
 * );
 * ```
 */
export const getEnrollments = async (accessToken: string): Promise<EdlinkEnrollment[]> => {
    const response = await edlinkApi.fetchEnrollments(accessToken);
    return response.$data;
};

/**
 * Fetches assignments for a connection and returns the data array.
 *
 * **Underlying API:** `GET https://ed.link/api/v2/graph/assignments`
 *
 * @param accessToken - Integration Access Token
 * @returns Array of EdlinkAssignment objects
 */
export const getAssignments = async (accessToken: string): Promise<EdlinkAssignment[]> => {
    const response = await edlinkApi.fetchAssignments(accessToken);
    return response.$data;
};

/**
 * Fetches submissions for a connection and returns the data array.
 *
 * **Underlying API:** `GET https://ed.link/api/v2/graph/submissions`
 *
 * @param accessToken - Integration Access Token
 * @returns Array of EdlinkSubmission objects
 */
export const getSubmissions = async (accessToken: string): Promise<EdlinkSubmission[]> => {
    const response = await edlinkApi.fetchSubmissions(accessToken);
    return response.$data;
};

/**
 * Fetches events from the Event Deltas API.
 *
 * This is useful for tracking roster changes (people, enrollments, terms, orgs).
 * Use this to detect course completion by monitoring enrollment state changes.
 *
 * **Underlying API:** `GET https://ed.link/api/v1/graph/events`
 *
 * **Key Insight:** When an enrollment's state changes to `completed`,
 * an `enrollment.updated` event is generated with the full enrollment object
 * including the student's email (via person.email) and class name.
 *
 * @param accessToken - Integration Access Token
 * @param afterCursor - Optional cursor to resume from (from previous $next)
 * @returns Full events response with $data array and optional $next cursor
 *
 * @example
 * ```typescript
 * // Fetch events, filter for completions
 * const response = await getEvents(connection.accessToken);
 * const completions = response.$data.filter(
 *   e => e.type === 'enrollment.updated' &&
 *        (e.data as EdlinkEnrollment).state === 'completed'
 * );
 *
 * // Issue credentials for each completion
 * for (const event of completions) {
 *   const enrollment = event.data as EdlinkEnrollment;
 *   await issueCredential(enrollment.person.email, enrollment.class.name);
 * }
 *
 * // Store cursor for next poll
 * if (response.$next) {
 *   localStorage.setItem('cursor', response.$next);
 * }
 * ```
 */
export const getEvents = async (
    accessToken: string,
    afterCursor?: string
): Promise<EdlinkEventsResponse> => {
    return edlinkApi.fetchEvents(accessToken, afterCursor);
};

/**
 * Fetches ALL LMS data in parallel for credential issuance.
 *
 * This is the main helper for getting everything needed to issue credentials:
 * - Classes, People, Enrollments (roster data)
 * - Assignments, Submissions (credential-relevant data)
 * - Summary statistics
 *
 * @param accessToken - Integration Access Token
 * @returns Combined LmsData object with all data and summary stats
 *
 * @example
 * ```typescript
 * const data = await fetchAllLmsData(connection.accessToken);
 * console.log(`Found ${data.summary.students} students`);
 * console.log(`${data.summary.completedSubmissions} completed submissions`);
 *
 * // Issue credentials for completed assignments
 * data.submissions
 *   .filter(s => s.state === 'submitted' && s.grade !== null)
 *   .forEach(s => issueCredential(s));
 * ```
 */
export const fetchAllLmsData = async (accessToken: string): Promise<LmsData> => {
    console.log('Fetching all LMS data in parallel...');

    // Fetch core roster data (these should always work)
    const [classes, people, enrollments] = await Promise.all([
        getClasses(accessToken),
        getPeople(accessToken),
        getEnrollments(accessToken),
    ]);

    // Fetch credential data (may not be available for all integrations)
    // Assignments/submissions are class-scoped in Ed.link, so top-level fetch may fail
    let assignments: EdlinkAssignment[] = [];
    let submissions: EdlinkSubmission[] = [];

    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        // Fetch assignments and submissions for each class
        // Ed.link endpoint: /classes/:class_id/assignments/:assignment_id/submissions
        for (const cls of classes) {
            // Fetch assignments for this class
            let classAssignments: EdlinkAssignment[] = [];
            try {
                const response = await fetch(
                    `${EDLINK_CONFIG.GRAPH_API_BASE}/classes/${cls.id}/assignments`,
                    { headers }
                );
                if (response.ok) {
                    const data = await response.json();
                    classAssignments = data.$data || [];
                    // Tag assignments with class ID for reference
                    classAssignments.forEach(a => {
                        if (!a.class) a.class = { id: cls.id };
                    });
                    assignments.push(...classAssignments);
                }
            } catch {
                // Ignore errors
            }

            // Fetch submissions for each assignment in this class
            for (const assignment of classAssignments) {
                try {
                    const response = await fetch(
                        `${EDLINK_CONFIG.GRAPH_API_BASE}/classes/${cls.id}/assignments/${assignment.id}/submissions`,
                        { headers }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        submissions.push(...(data.$data || []));
                    }
                } catch {
                    // Ignore errors for individual assignments
                }
            }
        }
    } catch (error) {
        console.warn('Could not fetch assignments/submissions:', error);
    }

    // Calculate summary statistics
    const students = people.filter(p => p.roles.includes('student')).length;
    const teachers = people.filter(p => p.roles.includes('teacher')).length;
    const completedSubmissions = submissions.filter(s => s.state === 'submitted' || s.state === 'returned').length;
    const gradedSubmissions = submissions.filter(s => s.grade !== null).length;

    const summary = {
        totalClasses: classes.length,
        totalPeople: people.length,
        totalEnrollments: enrollments.length,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        students,
        teachers,
        completedSubmissions,
        gradedSubmissions,
    };

    const result = {
        classes,
        people,
        enrollments,
        assignments,
        submissions,
        summary,
    };

    console.log('=== All LMS Data Fetched ===');
    console.log('Full LMS Data:', result);
    console.table(summary);

    return result;
};

/**
 * Verifies a connection is working by attempting to fetch classes.
 *
 * This is a lightweight check to confirm the access token is valid
 * and the LMS is responding.
 *
 * @param accessToken - Integration Access Token to verify
 * @returns `true` if the connection is working, `false` otherwise
 *
 * @example
 * ```typescript
 * const isWorking = await verifyConnection(connection.accessToken);
 * if (!isWorking) {
 *   // Handle disconnected/invalid state
 * }
 * ```
 */
export const verifyConnection = async (accessToken: string): Promise<boolean> => {
    try {
        await getClasses(accessToken);
        return true;
    } catch {
        return false;
    }
};

/**
 * Disconnects (destroys) an LMS connection via Ed.link Meta API using integration ID.
 *
 * **⚠️ DEV ONLY:** Uses hardcoded Application Secret. For production,
 * this must be called from a backend service.
 *
 * @param connectionId - The integration/connection ID to disconnect
 *
 * @example
 * ```typescript
 * await disconnectConnection(connection.id);
 * // Connection is now removed from Ed.link
 * ```
 */
export const disconnectConnection = async (connectionId: string): Promise<void> => {
    await edlinkApi.destroyIntegration(connectionId);
};

/**
 * Disconnects (destroys) an LMS source via Ed.link Meta API using source ID.
 *
 * **⚠️ DEV ONLY:** Uses hardcoded Application Secret. For production,
 * this must be called from a backend service.
 *
 * Deleting a source will also remove all integrations connected to it.
 *
 * @param sourceId - The source ID to disconnect
 *
 * @example
 * ```typescript
 * await disconnectBySourceId(connection.sourceId);
 * // Source and all its integrations are now removed from Ed.link
 * ```
 */
export const disconnectBySourceId = async (sourceId: string): Promise<void> => {
    await edlinkApi.destroySource(sourceId);
};

/**
 * Convenience object grouping all service functions.
 *
 * @example
 * ```typescript
 * import { edlinkService } from './services';
 *
 * // Use high-level methods
 * const classes = await edlinkService.getClasses(accessToken);
 *
 * // Access raw API if needed
 * const response = await edlinkService.api.fetchClasses(accessToken);
 *
 * // Access transformers if needed
 * const provider = edlinkService.transformers.mapProviderString('google_classroom');
 * ```
 */
export const edlinkService = {
    // Config
    config: EDLINK_CONFIG,

    // High-level operations
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

    // Re-export for convenience
    api: edlinkApi,
    transformers,
};

export default edlinkService;
