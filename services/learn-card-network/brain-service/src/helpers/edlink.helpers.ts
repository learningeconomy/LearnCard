/**
 * Ed.link API Helpers
 *
 * Server-side functions for making Ed.link Graph API calls.
 * These are called from tRPC routes to fetch LMS data.
 */

import type {
    EdlinkCompletionsResponse,
    EdlinkAssignmentCompletion,
    EdlinkCourseCompletion,
} from '@learncard/types';

const EDLINK_GRAPH_API = 'https://ed.link/api/v2/graph';

interface EdlinkPerson {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    email: string | null;
    roles?: string[];
}

interface EdlinkClass {
    id: string;
    name: string;
}

interface EdlinkEnrollment {
    id: string;
    state: string;
    person?: EdlinkPerson;
    class?: EdlinkClass;
}

interface EdlinkAssignment {
    id: string;
    title: string;
}

interface EdlinkSubmission {
    id: string;
    state: string;
    grade: number | null;
    graded_date: string | null;
    person_id?: string;
    person?: { id: string };
}

interface EdlinkGraphResponse<T> {
    $data: T[];
    $next?: string;
}

const createHeaders = (accessToken: string): HeadersInit => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
});

/**
 * Fetch all pages of a paginated Ed.link endpoint
 */
async function fetchAllPages<T>(
    url: string,
    accessToken: string,
    maxPages: number = 10
): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | undefined = url;
    let pageCount = 0;

    while (nextUrl && pageCount < maxPages) {
        const response = await fetch(nextUrl, { headers: createHeaders(accessToken) });
        if (!response.ok) {
            throw new Error(`Ed.link API error: ${response.status} ${response.statusText}`);
        }

        const data: EdlinkGraphResponse<T> = await response.json();
        results.push(...(data.$data || []));
        nextUrl = data.$next;
        pageCount++;
    }

    return results;
}

/**
 * Fetches completion data for a connection.
 *
 * Returns:
 * - Course completions: Enrollments with state = 'completed'
 * - Assignment completions: Submissions with state = 'returned'
 */
export async function getEdlinkCompletions(accessToken: string): Promise<EdlinkCompletionsResponse> {
    // 1. Fetch classes
    const classes = await fetchAllPages<EdlinkClass>(
        `${EDLINK_GRAPH_API}/classes`,
        accessToken
    );

    // 2. Fetch people (for name/email mapping)
    const peopleList = await fetchAllPages<EdlinkPerson>(
        `${EDLINK_GRAPH_API}/people`,
        accessToken
    );
    const people = new Map<string, EdlinkPerson>();
    peopleList.forEach(p => people.set(p.id, p));

    // 3. Fetch enrollments (for course completions)
    const enrollments = await fetchAllPages<EdlinkEnrollment>(
        `${EDLINK_GRAPH_API}/enrollments`,
        accessToken
    );

    const courseCompletions: EdlinkCourseCompletion[] = enrollments
        .filter(e => e.state === 'completed' && e.person?.id && e.class?.id)
        .map(e => ({
            classId: e.class!.id,
            personId: e.person!.id,
            personName: e.person?.display_name || `${e.person?.first_name} ${e.person?.last_name}`,
            personEmail: e.person?.email || null,
            className: e.class?.name || 'Unknown',
        }));

    // 4. Fetch assignments and submissions for each class (in parallel batches)
    const assignmentCompletions: EdlinkAssignmentCompletion[] = [];

    // Process classes in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < classes.length; i += batchSize) {
        const batch = classes.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async cls => {
                const completions: EdlinkAssignmentCompletion[] = [];

                try {
                    // Fetch assignments for this class
                    const assignmentsResponse = await fetch(
                        `${EDLINK_GRAPH_API}/classes/${cls.id}/assignments`,
                        { headers: createHeaders(accessToken) }
                    );
                    if (!assignmentsResponse.ok) return completions;

                    const assignmentsData: EdlinkGraphResponse<EdlinkAssignment> =
                        await assignmentsResponse.json();
                    const assignments = assignmentsData.$data || [];

                    // Fetch submissions for each assignment (in parallel)
                    const submissionResults = await Promise.all(
                        assignments.map(async assignment => {
                            try {
                                const subResponse = await fetch(
                                    `${EDLINK_GRAPH_API}/classes/${cls.id}/assignments/${assignment.id}/submissions`,
                                    { headers: createHeaders(accessToken) }
                                );
                                if (!subResponse.ok) return [];

                                const subData: EdlinkGraphResponse<EdlinkSubmission> =
                                    await subResponse.json();
                                const submissions = subData.$data || [];

                                // Find returned (completed) submissions
                                return submissions
                                    .filter(sub => sub.state === 'returned')
                                    .map(sub => {
                                        const personId = sub.person_id || sub.person?.id;
                                        const person = personId ? people.get(personId) : null;

                                        // Skip teachers and submissions without person ID
                                        if (person?.roles?.includes('teacher')) return null;
                                        if (!personId) return null;

                                        return {
                                            // IDs for tracking/deduplication
                                            classId: cls.id,
                                            assignmentId: assignment.id,
                                            submissionId: sub.id,
                                            personId,
                                            // Display data
                                            className: cls.name,
                                            assignmentTitle: assignment.title,
                                            personName:
                                                person?.display_name || person?.first_name || 'Unknown',
                                            personEmail: person?.email || null,
                                            gradedDate: sub.graded_date,
                                            grade: sub.grade,
                                        };
                                    })
                                    .filter((c): c is NonNullable<typeof c> => c !== null);
                            } catch {
                                return [];
                            }
                        })
                    );

                    completions.push(...submissionResults.flat());
                } catch {
                    // Skip this class on error
                }

                return completions;
            })
        );

        assignmentCompletions.push(...batchResults.flat());
    }

    return {
        summary: {
            classes: classes.length,
            assignmentCompletions: assignmentCompletions.length,
            courseCompletions: courseCompletions.length,
        },
        courseCompletions,
        assignmentCompletions,
    };
}

/**
 * Creates an unsigned OpenBadgeCredential for an assignment completion.
 * This follows the OBv3 format used by learnCard.invoke.send({ type: 'boost', template: {...} })
 */
export function createAssignmentCompletionCredential(
    completion: EdlinkAssignmentCompletion,
    issuerDid: string
): Record<string, unknown> {
    const gradeDisplay = completion.grade != null ? `${completion.grade}%` : 'Completed';

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: issuerDid,
        name: `Assignment Completed: ${completion.assignmentTitle}`,
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                type: ['Achievement'],
                name: completion.assignmentTitle,
                description: `Completed assignment '${completion.assignmentTitle}' in ${completion.className}`,
                criteria: {
                    narrative: 'Successfully completed and submitted the assignment.',
                },
            },
            result: [
                {
                    type: ['Result'],
                    value: gradeDisplay,
                },
            ],
        },
    };
}
