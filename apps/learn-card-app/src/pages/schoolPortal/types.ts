// =============================================================================
// Our Application Types
// =============================================================================

export type LMSProvider = 'canvas' | 'google' | 'schoology' | 'blackboard' | 'moodle' | 'brightspace' | 'other';

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'ERROR' | 'PENDING_APPROVAL';

export interface LMSConnection {
    id: string;
    integrationId: string;
    sourceId: string;
    provider: LMSProvider;
    providerName: string;
    institutionName: string;
    status: ConnectionStatus;
    connectedAt: string;
    accessToken?: string;
}

// =============================================================================
// Ed.link Widget SDK Types (Client-side)
// =============================================================================

export interface EdlinkIntegrationData {
    integration: {
        id: string;
        access_token: string;
        source: {
            id: string;
        };
        application: {
            id: string;
        };
        status: string;
        state: string;
        created_date: string;
        updated_date: string;
    };
}

export interface EdlinkOnboardingOptions {
    provider?: string;
    theme?: {
        primary_color?: string;
    };
    email?: string;
    onSuccess?: (data: EdlinkIntegrationData) => void;
    onError?: (error: Error) => void;
}

export interface EdlinkOnboardingInstance {
    show: () => void;
    destroy: () => void;
    on: (event: string, callback: (data: unknown) => void) => void;
}

export interface EdlinkClient {
    createOnboarding: (options: EdlinkOnboardingOptions) => EdlinkOnboardingInstance;
}

declare global {
    interface Window {
        Edlink?: new (config: { client_id: string }) => EdlinkClient;
    }
}

// =============================================================================
// Ed.link API Response Types (Server-side)
// =============================================================================

export interface EdlinkProvider {
    id: string;
    name: string;
    icon_url: string;
    application: string; // e.g., "google_classroom", "canvas", "schoology"
    allows_data_sync: boolean;
}

export interface EdlinkSource {
    id: string;
    status: 'active' | 'inactive';
    name: string;
    created_date: string;
    updated_date: string;
    sync_interval: number;
}

export interface EdlinkIntegration {
    id: string;
    status: 'active' | 'paused' | 'disabled';
    scope: 'all' | 'specified';
    created_date: string;
    updated_date: string;
    permissions: string[];
    targets: string[];
    access_token: string;
    source: EdlinkSource;
    provider: EdlinkProvider;
}

export interface EdlinkListIntegrationsResponse {
    $data: EdlinkIntegration[];
}

// =============================================================================
// Ed.link Graph API Types
// =============================================================================

export interface EdlinkPerson {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    email: string | null;
    roles: ('student' | 'teacher' | 'administrator' | 'observer')[];
    created_date: string;
    updated_date: string;
}

export interface EdlinkClass {
    id: string;
    name: string;
    description: string | null;
    state: 'active' | 'inactive' | 'archived';
    locale: string | null;
    time_zone: string | null;
    created_date: string;
    updated_date: string;
}

/**
 * Enrollment State enum values
 * @see https://ed.link/docs/api/v2.0/enums/enrollment-state
 */
export type EdlinkEnrollmentState =
    | 'active'     // The enrollment is active
    | 'inactive'   // The enrollment is not active
    | 'dropped'    // The person has dropped out of the class
    | 'upcoming'   // The enrollment period has not yet started
    | 'pending'    // The person has been invited to enroll, but has not yet accepted
    | 'completed'; // The enrollment has concluded ← KEY FOR COURSE COMPLETION

export interface EdlinkEnrollment {
    id: string;
    role: 'student' | 'teacher' | 'administrator' | 'observer';
    state: EdlinkEnrollmentState;
    created_date: string;
    updated_date: string;
    person: EdlinkPerson;
    class: EdlinkClass;
}

export interface EdlinkAssignment {
    id: string;
    title: string;
    description: string | null;
    state: 'active' | 'inactive' | 'deleted';
    due_date: string | null;
    lock_date: string | null;
    unlock_date: string | null;
    points_possible: number | null;
    grading_type: 'points' | 'percentage' | 'pass_fail' | 'letter_grade' | 'not_graded' | null;
    submission_types: string[];
    created_date: string;
    updated_date: string;
    class: { id: string };
}

export interface EdlinkSubmission {
    id: string;
    state: 'created' | 'submitted' | 'returned' | 'reclaimed';
    grade: number | null;
    grade_comment: string | null;
    attempts: number;
    created_date: string;
    updated_date: string;
    submitted_date: string | null;
    graded_date: string | null;
    assignment: { id: string };
    person: { id: string };
}

export interface EdlinkGraphResponse<T> {
    $data: T[];
    $next?: string;
}

// =============================================================================
// Combined LMS Data (for credential issuance)
// =============================================================================

export interface LmsData {
    // Roster data
    classes: EdlinkClass[];
    people: EdlinkPerson[];
    enrollments: EdlinkEnrollment[];
    // Credential-relevant data
    assignments: EdlinkAssignment[];
    submissions: EdlinkSubmission[];
    // Summary stats
    summary: {
        totalClasses: number;
        totalPeople: number;
        totalEnrollments: number;
        totalAssignments: number;
        totalSubmissions: number;
        students: number;
        teachers: number;
        completedSubmissions: number;
        gradedSubmissions: number;
    };
}

// =============================================================================
// Ed.link Event Deltas API Types (for change tracking)
// =============================================================================

/**
 * Event types returned by the Event Deltas API.
 * @see https://ed.link/docs/api/v1.0/graph/events
 */
export type EdlinkEventType =
    | 'enrollment.created'
    | 'enrollment.updated'
    | 'enrollment.deleted'
    | 'person.created'
    | 'person.updated'
    | 'person.deleted'
    | 'term.created'
    | 'term.updated'
    | 'term.deleted'
    | 'organization.created'
    | 'organization.updated'
    | 'organization.deleted';

/**
 * A single event from the Event Deltas API.
 * Events track changes to roster data (people, enrollments, terms, organizations).
 *
 * NOTE: Coursework data (submissions, assignments, grades) is NOT supported.
 */
export interface EdlinkEvent {
    /** Unique event identifier */
    id: string;
    /** When the event occurred */
    created_date: string;
    /** Event type in format {entity}.{action} */
    type: EdlinkEventType;
    /**
     * The full object that was created/updated/deleted.
     * For enrollment events, this includes nested person and class objects.
     */
    data: EdlinkEnrollment | EdlinkPerson | unknown;
}

/**
 * Response from GET /api/v1/graph/events
 */
export interface EdlinkEventsResponse {
    $data: EdlinkEvent[];
    /** Cursor for next page of results. Use with $after parameter. */
    $next?: string;
}
