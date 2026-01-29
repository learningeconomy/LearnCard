import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, Award, Loader2, Users, BookOpen, UserCheck, Clock, RefreshCw, ClipboardList, CheckCircle, Activity, ChevronDown, ChevronUp } from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import { fetchAllLmsData, getClasses, getEvents, getEnrollments, getPeople, EDLINK_CONFIG } from '../services';
import type { LMSConnection, LmsData, EdlinkEventsResponse, EdlinkEnrollment, EdlinkClass, EdlinkAssignment, EdlinkSubmission, EdlinkPerson } from '../types';

interface ConnectionDetailProps {
    connection: LMSConnection;
    onBack: () => void;
    onStatusChange?: (connectionId: string, newStatus: LMSConnection['status']) => void;
}

export const ConnectionDetail: React.FC<ConnectionDetailProps> = ({
    connection,
    onBack,
    onStatusChange,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [lmsData, setLmsData] = useState<LmsData | null>(null);

    // Event Deltas state (for Phase 1 verification)
    const [eventsResponse, setEventsResponse] = useState<EdlinkEventsResponse | null>(null);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [eventsError, setEventsError] = useState<string | null>(null);
    const [isEventsExpanded, setIsEventsExpanded] = useState(false);

    // Raw Polling state (direct enrollment check)
    const [allEnrollments, setAllEnrollments] = useState<EdlinkEnrollment[] | null>(null);
    const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
    const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);
    const [isEnrollmentsExpanded, setIsEnrollmentsExpanded] = useState(false);

    // People state (all users in the LMS)
    const [allPeople, setAllPeople] = useState<EdlinkPerson[] | null>(null);
    const [isLoadingPeople, setIsLoadingPeople] = useState(false);
    const [peopleError, setPeopleError] = useState<string | null>(null);
    const [isPeopleExpanded, setIsPeopleExpanded] = useState(false);

    // Coursework Completion state (the REAL completion signal)
    interface ClassCoursework {
        classInfo: EdlinkClass;
        assignments: EdlinkAssignment[];
        submissions: EdlinkSubmission[];
        people: Map<string, EdlinkPerson>;
    }
    interface StudentProgress {
        person: EdlinkPerson;
        totalAssignments: number;
        returnedCount: number;
        submittedCount: number;
        createdCount: number;
        isComplete: boolean;
        submissions: EdlinkSubmission[];
    }
    const [courseworkData, setCourseworkData] = useState<ClassCoursework[] | null>(null);
    const [isLoadingCoursework, setIsLoadingCoursework] = useState(false);
    const [courseworkError, setCourseworkError] = useState<string | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [isCourseworkExpanded, setIsCourseworkExpanded] = useState(false);

    const connectedDate = new Date(connection.connectedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const isPendingApproval = connection.status === 'PENDING_APPROVAL';

    // Fetch ALL LMS data when connection is selected (only if approved)
    useEffect(() => {
        const loadLmsData = async () => {
            if (!connection.accessToken || isPendingApproval) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            console.log('Fetching all LMS data for connection:', connection.id);
            console.log('Using access token:', connection.accessToken?.substring(0, 8) + '...');

            try {
                const data = await fetchAllLmsData(connection.accessToken);
                setLmsData(data);
            } catch (error) {
                console.error('Failed to fetch LMS data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLmsData();
    }, [connection.id, connection.accessToken, isPendingApproval]);

    // Check if the integration has been approved by attempting to fetch data
    const handleCheckStatus = async () => {
        if (!connection.accessToken) return;

        setIsCheckingStatus(true);
        try {
            // Try to fetch classes - if it works, the integration is now active
            await getClasses(connection.accessToken);

            // If we get here, the integration is approved!
            console.log('Integration is now active!');
            onStatusChange?.(connection.id, 'CONNECTED');
        } catch (error) {
            console.log('Integration still pending approval');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Fetch events from Event Deltas API (Phase 1 verification)
    const handleFetchEvents = async () => {
        if (!connection.accessToken) return;

        setIsLoadingEvents(true);
        setEventsError(null);

        try {
            console.log('Fetching events from Event Deltas API...');
            const response = await getEvents(connection.accessToken);

            console.log('=== Event Deltas Response ===');
            console.log('Total events:', response.$data.length);
            console.log('Next cursor:', response.$next);
            console.log('Full response:', response);

            // Log enrollment events specifically
            const enrollmentEvents = response.$data.filter(e => e.type.startsWith('enrollment.'));
            console.log('Enrollment events:', enrollmentEvents.length);

            // Check for completed enrollments
            const completedEnrollments = response.$data.filter(
                e => e.type === 'enrollment.updated' &&
                     (e.data as EdlinkEnrollment).state === 'completed'
            );
            console.log('Completed enrollment events:', completedEnrollments);

            setEventsResponse(response);
            setIsEventsExpanded(true);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setEventsError(error instanceof Error ? error.message : 'Failed to fetch events');
        } finally {
            setIsLoadingEvents(false);
        }
    };

    // Direct polling: fetch all enrollments and check their current state
    const handlePollEnrollments = async () => {
        if (!connection.accessToken) return;

        setIsLoadingEnrollments(true);
        setEnrollmentsError(null);

        try {
            console.log('Polling enrollments directly...');
            const enrollments = await getEnrollments(connection.accessToken);

            console.log('=== Raw Enrollment Poll Results ===');
            console.log('Total enrollments:', enrollments.length);

            // Group by state
            const byState = enrollments.reduce((acc, e) => {
                acc[e.state] = (acc[e.state] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            console.log('Enrollments by state:', byState);

            // Find completed enrollments
            const completed = enrollments.filter(e => e.state === 'completed');
            console.log('Completed enrollments:', completed);

            // Find enrollments with emails (for credential issuance)
            const withEmails = enrollments.filter(e => e.person?.email);
            console.log('Enrollments with emails:', withEmails.length);

            // Log full data for inspection
            console.log('All enrollments:', enrollments);

            setAllEnrollments(enrollments);
            setIsEnrollmentsExpanded(true);
        } catch (error) {
            console.error('Failed to poll enrollments:', error);
            setEnrollmentsError(error instanceof Error ? error.message : 'Failed to fetch enrollments');
        } finally {
            setIsLoadingEnrollments(false);
        }
    };

    // Fetch all people from the LMS
    const handleFetchPeople = async () => {
        if (!connection.accessToken) return;

        setIsLoadingPeople(true);
        setPeopleError(null);

        try {
            console.log('Fetching all people from LMS...');
            const people = await getPeople(connection.accessToken);

            console.log('=== People Data ===');
            console.log('Total people:', people.length);

            // Group by role
            const byRole = people.reduce((acc, p) => {
                for (const role of p.roles || []) {
                    acc[role] = (acc[role] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            console.log('By role:', byRole);

            // Count with emails
            const withEmails = people.filter(p => p.email);
            console.log('With emails:', withEmails.length);

            console.log('All people:', people);

            setAllPeople(people);
            setIsPeopleExpanded(true);
        } catch (error) {
            console.error('Failed to fetch people:', error);
            setPeopleError(error instanceof Error ? error.message : 'Failed to fetch people');
        } finally {
            setIsLoadingPeople(false);
        }
    };

    // Fetch coursework data: assignments + submissions per class (THE REAL COMPLETION SIGNAL)
    const handleFetchCoursework = async () => {
        if (!connection.accessToken) return;

        setIsLoadingCoursework(true);
        setCourseworkError(null);

        const headers = {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
        };

        try {
            console.log('=== Fetching Coursework Data for Completion Detection ===');

            // 1. Get all classes
            const classes = await getClasses(connection.accessToken);
            console.log('Classes:', classes.length);

            // 2. Get all people (for email mapping)
            const peopleResponse = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/people`, { headers });
            const peopleData = await peopleResponse.json();
            const peopleMap = new Map<string, EdlinkPerson>();
            (peopleData.$data || []).forEach((p: EdlinkPerson) => peopleMap.set(p.id, p));
            console.log('People loaded:', peopleMap.size);

            // 3. For each class, fetch assignments and submissions
            const courseworkByClass: ClassCoursework[] = [];

            for (const cls of classes) {
                console.log(`\nProcessing class: ${cls.name} (${cls.id})`);

                // Fetch assignments for this class
                let assignments: EdlinkAssignment[] = [];
                try {
                    const assignmentsResponse = await fetch(
                        `${EDLINK_CONFIG.GRAPH_API_BASE}/classes/${cls.id}/assignments`,
                        { headers }
                    );
                    if (assignmentsResponse.ok) {
                        const assignmentsData = await assignmentsResponse.json();
                        assignments = assignmentsData.$data || [];
                        console.log(`  Assignments: ${assignments.length}`);
                    } else {
                        console.log(`  Assignments: fetch failed (${assignmentsResponse.status})`);
                    }
                } catch (e) {
                    console.log(`  Assignments: error`, e);
                }

                // Try fetching submissions at TOP level first (may include person_id)
                let submissions: EdlinkSubmission[] = [];
                console.log(`  Trying top-level submissions endpoint...`);
                try {
                    const topSubmissionsResponse = await fetch(
                        `${EDLINK_CONFIG.GRAPH_API_BASE}/submissions`,
                        { headers }
                    );
                    if (topSubmissionsResponse.ok) {
                        const topSubmissionsData = await topSubmissionsResponse.json();
                        submissions = topSubmissionsData.$data || [];
                        console.log(`  Top-level submissions: ${submissions.length}`);
                        if (submissions.length > 0) {
                            console.log(`  RAW top-level submission:`, JSON.stringify(submissions[0], null, 2));
                            console.log(`  RAW top-level submission keys:`, Object.keys(submissions[0]));
                        }
                    } else {
                        console.log(`  Top-level submissions failed (${topSubmissionsResponse.status}), falling back to per-assignment`);
                    }
                } catch (e) {
                    console.log(`  Top-level submissions error:`, e);
                }

                // Fallback: Fetch submissions PER ASSIGNMENT if class-level didn't work
                if (submissions.length === 0 && assignments.length > 0) {
                    console.log(`  Fetching submissions for ${assignments.length} assignments...`);
                    for (const assignment of assignments) {
                        try {
                            const submissionsResponse = await fetch(
                                `${EDLINK_CONFIG.GRAPH_API_BASE}/classes/${cls.id}/assignments/${assignment.id}/submissions`,
                                { headers }
                            );
                            if (submissionsResponse.ok) {
                                const submissionsData = await submissionsResponse.json();
                                const assignmentSubmissions = submissionsData.$data || [];

                                // Debug: Log RAW response before modification
                                if (assignmentSubmissions.length > 0) {
                                    console.log(`    RAW submission from API:`, JSON.stringify(assignmentSubmissions[0], null, 2));
                                    console.log(`    RAW submission keys:`, Object.keys(assignmentSubmissions[0]));
                                }

                                // Add assignment info to each submission for reference
                                assignmentSubmissions.forEach((s: EdlinkSubmission) => {
                                    (s as any).assignmentTitle = assignment.title;
                                    (s as any).assignmentId = assignment.id;
                                });
                                submissions.push(...assignmentSubmissions);
                                console.log(`    ${assignment.title}: ${assignmentSubmissions.length} submissions`);
                            } else {
                                console.log(`    ${assignment.title}: fetch failed (${submissionsResponse.status})`);
                            }
                        } catch (e) {
                            console.log(`    ${assignment.title}: error`, e);
                        }
                    }
                }

                console.log(`  Total submissions: ${submissions.length}`);

                // Log submission states
                if (submissions.length > 0) {
                    const byState = submissions.reduce((acc, s) => {
                        acc[s.state] = (acc[s.state] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    console.log(`  Submission states:`, byState);
                }

                courseworkByClass.push({
                    classInfo: cls,
                    assignments,
                    submissions,
                    people: peopleMap,
                });
            }

            // Log summary
            console.log('\n=== Coursework Summary ===');
            for (const cw of courseworkByClass) {
                const returnedCount = cw.submissions.filter(s => s.state === 'returned').length;
                const submittedCount = cw.submissions.filter(s => s.state === 'submitted').length;
                console.log(`${cw.classInfo.name}: ${cw.assignments.length} assignments, ${cw.submissions.length} submissions (${returnedCount} returned, ${submittedCount} submitted)`);
            }

            setCourseworkData(courseworkByClass);
            if (courseworkByClass.length > 0) {
                setSelectedClassId(courseworkByClass[0].classInfo.id);
            }
            setIsCourseworkExpanded(true);

        } catch (error) {
            console.error('Failed to fetch coursework:', error);
            setCourseworkError(error instanceof Error ? error.message : 'Failed to fetch coursework');
        } finally {
            setIsLoadingCoursework(false);
        }
    };

    // Debug: Fetch ALL possible data from Ed.link API
    const handleFetchAllData = async () => {
        if (!connection.accessToken) return;

        const headers = {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
        };

        const endpoints = [
            '/schools',
            '/districts',
            '/classes',
            '/courses',
            '/people',
            '/enrollments',
            '/sections',
            '/terms',
            '/agents',
            '/assignments',
            '/submissions',
            '/categories',
        ];

        console.log('\n========================================');
        console.log('=== FETCHING ALL ED.LINK DATA ===');
        console.log('========================================\n');

        for (const endpoint of endpoints) {
            try {
                const url = `${EDLINK_CONFIG.GRAPH_API_BASE}${endpoint}`;
                console.log(`Fetching: ${url}`);
                const response = await fetch(url, { headers });

                if (response.ok) {
                    const data = await response.json();
                    const items = data.$data || [];
                    console.log(`✅ ${endpoint}: ${items.length} items`);
                    if (items.length > 0) {
                        console.log(`   Sample keys:`, Object.keys(items[0]));
                        console.log(`   Sample item:`, JSON.stringify(items[0], null, 2));
                        // For people, log ALL emails
                        if (endpoint === '/people') {
                            console.log('   📧 ALL PEOPLE EMAILS:');
                            items.forEach((p: any, i: number) => {
                                console.log(`      ${i + 1}. ${p.email} (${p.display_name}) - roles: ${p.roles?.join(', ') || 'none'} - id: ${p.id}`);
                            });
                        }
                        // For enrollments, log ALL
                        if (endpoint === '/enrollments') {
                            console.log('   📋 ALL ENROLLMENTS:');
                            items.forEach((e: any, i: number) => {
                                console.log(`      ${i + 1}. person_id: ${e.person_id}, role: ${e.role}, class_id: ${e.class_id}`);
                            });
                        }
                    }
                } else {
                    console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
                }
            } catch (e) {
                console.log(`❌ ${endpoint}: Error -`, e);
            }
        }

        // Now fetch class-specific data for first class
        console.log('\n--- Class-specific endpoints ---');
        try {
            const classesResponse = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/classes`, { headers });
            if (classesResponse.ok) {
                const classesData = await classesResponse.json();
                const firstClass = classesData.$data?.[0];
                if (firstClass) {
                    const classId = firstClass.id;
                    console.log(`\nUsing class: ${firstClass.name} (${classId})`);

                    const classEndpoints = [
                        `/classes/${classId}/enrollments`,
                        `/classes/${classId}/assignments`,
                        `/classes/${classId}/people`,
                    ];

                    for (const endpoint of classEndpoints) {
                        try {
                            const url = `${EDLINK_CONFIG.GRAPH_API_BASE}${endpoint}`;
                            console.log(`Fetching: ${url}`);
                            const response = await fetch(url, { headers });

                            if (response.ok) {
                                const data = await response.json();
                                const items = data.$data || [];
                                console.log(`✅ ${endpoint}: ${items.length} items`);
                                if (items.length > 0) {
                                    console.log(`   Sample keys:`, Object.keys(items[0]));
                                    console.log(`   Sample item:`, JSON.stringify(items[0], null, 2));
                                }
                            } else {
                                console.log(`❌ ${endpoint}: ${response.status}`);
                            }
                        } catch (e) {
                            console.log(`❌ ${endpoint}: Error`);
                        }
                    }

                    // Fetch assignment-specific submissions
                    console.log('\n--- Assignment-specific submissions ---');
                    const assignmentsResponse = await fetch(`${EDLINK_CONFIG.GRAPH_API_BASE}/classes/${classId}/assignments`, { headers });
                    if (assignmentsResponse.ok) {
                        const assignmentsData = await assignmentsResponse.json();
                        const firstAssignment = assignmentsData.$data?.[0];
                        if (firstAssignment) {
                            const assignmentId = firstAssignment.id;
                            console.log(`Using assignment: ${firstAssignment.title} (${assignmentId})`);

                            // Try with different query params
                            const submissionVariants = [
                                `/classes/${classId}/assignments/${assignmentId}/submissions`,
                                `/classes/${classId}/assignments/${assignmentId}/submissions?$expand=person`,
                                `/classes/${classId}/assignments/${assignmentId}/submissions?$expand=person,assignment`,
                            ];

                            for (const endpoint of submissionVariants) {
                                try {
                                    const url = `${EDLINK_CONFIG.GRAPH_API_BASE}${endpoint}`;
                                    console.log(`Fetching: ${url}`);
                                    const response = await fetch(url, { headers });

                                    if (response.ok) {
                                        const data = await response.json();
                                        const items = data.$data || [];
                                        console.log(`✅ submissions: ${items.length} items`);
                                        if (items.length > 0) {
                                            console.log(`   ALL KEYS:`, Object.keys(items[0]));
                                            console.log(`   FULL ITEM:`, JSON.stringify(items[0], null, 2));
                                        }
                                    } else {
                                        console.log(`❌ ${response.status}`);
                                    }
                                } catch (e) {
                                    console.log(`❌ Error`);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Error fetching class-specific data:', e);
        }

        console.log('\n========================================');
        console.log('=== DONE FETCHING ALL DATA ===');
        console.log('========================================\n');
    };

    // Helper: Calculate student progress for a class
    const calculateStudentProgress = (classData: ClassCoursework): StudentProgress[] => {
        const { assignments, submissions, people } = classData;

        // Group submissions by person
        const submissionsByPerson = new Map<string, EdlinkSubmission[]>();
        for (const sub of submissions) {
            // Handle different API response formats:
            // - person_id: direct string (actual Ed.link response)
            // - person.id: object with id (typed interface)
            // - person: string (fallback)
            const personId = (sub as any).person_id || sub.person?.id || (sub.person as unknown as string);
            if (!personId) continue;
            if (!submissionsByPerson.has(personId)) {
                submissionsByPerson.set(personId, []);
            }
            submissionsByPerson.get(personId)!.push(sub);
        }

        // Calculate progress for each student
        const progress: StudentProgress[] = [];
        for (const [personId, subs] of submissionsByPerson) {
            const person = people.get(personId);
            if (!person) continue;

            // Skip teachers/admins (but include students AND users with no roles - Google Classroom often has empty roles)
            const isTeacherOrAdmin = person.roles?.includes('teacher') || person.roles?.includes('administrator');
            if (isTeacherOrAdmin) continue;

            const returnedCount = subs.filter(s => s.state === 'returned').length;
            const submittedCount = subs.filter(s => s.state === 'submitted').length;
            const createdCount = subs.filter(s => s.state === 'created').length;

            // "Complete" = all assignments have returned submissions
            const isComplete = assignments.length > 0 && returnedCount === assignments.length;

            progress.push({
                person,
                totalAssignments: assignments.length,
                returnedCount,
                submittedCount,
                createdCount,
                isComplete,
                submissions: subs,
            });
        }

        // Sort: completed first, then by returned count
        return progress.sort((a, b) => {
            if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
            return b.returnedCount - a.returnedCount;
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">C</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                            {connection.institutionName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-500">{connection.providerName}</span>
                            <StatusBadge status={connection.status} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Connection Info */}
                <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Connection Info</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Connected</p>
                                <p className="text-sm text-gray-700">{connectedDate}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LMS Data Stats */}
                <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">LMS Data</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        {isPendingApproval ? (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Awaiting Approval
                                </p>
                                <p className="text-xs text-gray-500 mb-4">
                                    This integration needs to be approved in the Ed.link Dashboard
                                    before data can be synced.
                                </p>
                                <button
                                    onClick={handleCheckStatus}
                                    disabled={isCheckingStatus}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-600 border border-cyan-300 rounded-lg hover:bg-cyan-50 disabled:opacity-50 transition-colors"
                                >
                                    {isCheckingStatus ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    {isCheckingStatus ? 'Checking...' : 'Check Status'}
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                                <span className="ml-2 text-sm text-gray-500">Fetching all LMS data...</span>
                            </div>
                        ) : lmsData ? (
                            <div className="space-y-4">
                                {/* Roster Data */}
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Roster</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <BookOpen className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">{lmsData.summary.totalClasses}</p>
                                            <p className="text-xs text-gray-500">Classes</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <Users className="w-4 h-4 text-green-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">
                                                {lmsData.summary.students > 0
                                                    ? lmsData.summary.students
                                                    : lmsData.summary.totalPeople - lmsData.summary.teachers}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {lmsData.summary.students > 0 ? 'Students' : 'Non-Teachers'}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <UserCheck className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">{lmsData.summary.teachers}</p>
                                            <p className="text-xs text-gray-500">Teachers</p>
                                        </div>
                                    </div>
                                    {lmsData.summary.students === 0 && lmsData.summary.totalPeople > 0 && (
                                        <p className="text-[10px] text-amber-600 mt-2">
                                            ⚠️ Google Classroom has empty roles[] - counting non-teachers as students
                                        </p>
                                    )}
                                </div>
                                {/* Credential Data */}
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Credentials</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <ClipboardList className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">{lmsData.summary.totalAssignments}</p>
                                            <p className="text-xs text-gray-500">Assignments</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">{lmsData.summary.completedSubmissions}</p>
                                            <p className="text-xs text-gray-500">Completed</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <Award className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                                            <p className="text-lg font-semibold text-gray-800">{lmsData.summary.gradedSubmissions}</p>
                                            <p className="text-xs text-gray-500">Graded</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Unable to fetch LMS data
                            </p>
                        )}
                    </div>
                </section>

                {/* Credentials Placeholder */}
                <section>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Credentials</h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <Award className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">Credential issuance coming soon</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Issue credentials based on LMS data
                        </p>
                    </div>
                </section>

                {/* Fetch ALL Data Debug Button */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            🔍 API Explorer (Debug)
                        </h3>
                        <div className="bg-white rounded-xl border border-orange-200 p-4">
                            <p className="text-xs text-gray-500 mb-3">
                                Fetch ALL possible data from Ed.link API and log to console.
                                Check browser DevTools for complete output.
                            </p>
                            <button
                                onClick={handleFetchAllData}
                                disabled={!connection.accessToken}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 transition-colors"
                            >
                                🚀 Fetch ALL API Data (check console)
                            </button>
                        </div>
                    </section>
                )}

                {/* Event Deltas Debug Panel (Phase 1) */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Event Deltas (Debug)
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-3">
                                Fetch events from Ed.link's Event Deltas API to verify what data we receive
                                when roster changes occur (people, enrollments, terms, organizations).
                            </p>

                            <button
                                onClick={handleFetchEvents}
                                disabled={isLoadingEvents || !connection.accessToken}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                            >
                                {isLoadingEvents ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Activity className="w-4 h-4" />
                                )}
                                {isLoadingEvents ? 'Fetching...' : 'Fetch Events'}
                            </button>

                            {eventsError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{eventsError}</p>
                                </div>
                            )}

                            {eventsResponse && (
                                <div className="mt-4">
                                    {/* Summary */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="text-center p-2 bg-indigo-50 rounded-lg">
                                            <p className="text-lg font-semibold text-indigo-700">
                                                {eventsResponse.$data.length}
                                            </p>
                                            <p className="text-xs text-indigo-500">Total Events</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded-lg">
                                            <p className="text-lg font-semibold text-green-700">
                                                {eventsResponse.$data.filter(e => e.type.startsWith('enrollment.')).length}
                                            </p>
                                            <p className="text-xs text-green-500">Enrollment Events</p>
                                        </div>
                                    </div>

                                    {/* Completed enrollments highlight */}
                                    {(() => {
                                        const completedEvents = eventsResponse.$data.filter(
                                            e => e.type === 'enrollment.updated' &&
                                                 (e.data as EdlinkEnrollment).state === 'completed'
                                        );
                                        if (completedEvents.length > 0) {
                                            return (
                                                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                    <p className="text-sm font-medium text-emerald-700 mb-1">
                                                        🎉 Found {completedEvents.length} completed enrollment(s)!
                                                    </p>
                                                    <p className="text-xs text-emerald-600">
                                                        These can trigger credential issuance.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Collapsible raw JSON */}
                                    <button
                                        onClick={() => setIsEventsExpanded(!isEventsExpanded)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        {isEventsExpanded ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                        {isEventsExpanded ? 'Hide' : 'Show'} raw response
                                    </button>

                                    {isEventsExpanded && (
                                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                            {JSON.stringify(eventsResponse, null, 2)}
                                        </pre>
                                    )}

                                    {eventsResponse.$next && (
                                        <p className="mt-2 text-xs text-gray-400">
                                            More events available. Next cursor: {eventsResponse.$next.substring(0, 20)}...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* People (all users in LMS) */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            People (Debug)
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-3">
                                Fetch all people (students, teachers, administrators) from the LMS.
                            </p>

                            <button
                                onClick={handleFetchPeople}
                                disabled={isLoadingPeople || !connection.accessToken}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                                {isLoadingPeople ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Users className="w-4 h-4" />
                                )}
                                {isLoadingPeople ? 'Fetching...' : 'Fetch People'}
                            </button>

                            {peopleError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{peopleError}</p>
                                </div>
                            )}

                            {allPeople && (
                                <div className="mt-4">
                                    {/* Summary stats */}
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-blue-700">{allPeople.length}</p>
                                            <p className="text-xs text-blue-500">Total</p>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-green-700">
                                                {allPeople.filter(p => p.roles?.includes('student')).length}
                                            </p>
                                            <p className="text-xs text-green-500">Students</p>
                                        </div>
                                        <div className="p-2 bg-purple-50 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-purple-700">
                                                {allPeople.filter(p => p.roles?.includes('teacher')).length}
                                            </p>
                                            <p className="text-xs text-purple-500">Teachers</p>
                                        </div>
                                        <div className="p-2 bg-amber-50 rounded-lg text-center">
                                            <p className="text-lg font-semibold text-amber-700">
                                                {allPeople.filter(p => !p.roles || p.roles.length === 0).length}
                                            </p>
                                            <p className="text-xs text-amber-500">No Role</p>
                                        </div>
                                    </div>

                                    {/* Warning if many have no roles */}
                                    {allPeople.filter(p => !p.roles || p.roles.length === 0).length > 0 && (
                                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-xs text-amber-700">
                                                ⚠️ <strong>{allPeople.filter(p => !p.roles || p.roles.length === 0).length}</strong> people have empty <code className="bg-amber-100 px-1 rounded">roles[]</code> array.
                                                Google Classroom may not be setting roles properly.
                                            </p>
                                        </div>
                                    )}

                                    {/* Email availability */}
                                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">
                                            <strong>{allPeople.filter(p => p.email).length}</strong> of{' '}
                                            <strong>{allPeople.length}</strong> people have emails
                                            {allPeople.filter(p => p.email).length === allPeople.length ? ' ✅' : ' ⚠️'}
                                        </p>
                                    </div>

                                    {/* Role breakdown */}
                                    <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Roles:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(
                                                allPeople.reduce((acc, p) => {
                                                    for (const role of p.roles || []) {
                                                        acc[role] = (acc[role] || 0) + 1;
                                                    }
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([role, count]) => (
                                                <span
                                                    key={role}
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        role === 'student'
                                                            ? 'bg-green-100 text-green-700'
                                                            : role === 'teacher'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : role === 'administrator'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {role}: {count}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* People list */}
                                    <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-2">People:</p>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {allPeople.slice(0, 50).map(person => (
                                                <div
                                                    key={person.id}
                                                    className="text-xs p-2 bg-gray-50 rounded flex justify-between items-center"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-gray-700 font-medium">
                                                            {person.display_name || `${person.first_name} ${person.last_name}`}
                                                        </span>
                                                        {person.email && (
                                                            <span className="text-gray-400 ml-2 text-[10px]">{person.email}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 ml-2">
                                                        {person.roles?.map(role => (
                                                            <span
                                                                key={role}
                                                                className={`px-1 text-[10px] rounded ${
                                                                    role === 'student'
                                                                        ? 'bg-green-100 text-green-600'
                                                                        : role === 'teacher'
                                                                        ? 'bg-purple-100 text-purple-600'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}
                                                            >
                                                                {role}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {allPeople.length > 50 && (
                                                <p className="text-xs text-gray-400 text-center py-1">
                                                    ...and {allPeople.length - 50} more
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Collapsible raw JSON */}
                                    <button
                                        onClick={() => setIsPeopleExpanded(!isPeopleExpanded)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        {isPeopleExpanded ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                        {isPeopleExpanded ? 'Hide' : 'Show'} raw JSON ({allPeople.length})
                                    </button>

                                    {isPeopleExpanded && (
                                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                            {JSON.stringify(allPeople, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Raw Enrollment Polling (Phase 1 - Alternative approach) */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Raw Enrollment Poll (Debug)
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-xs text-gray-500 mb-3">
                                Directly fetch all enrollments and check their current <code className="bg-gray-100 px-1 rounded">state</code> field.
                                This shows if any enrollments have <code className="bg-gray-100 px-1 rounded">completed</code> status right now.
                            </p>

                            <button
                                onClick={handlePollEnrollments}
                                disabled={isLoadingEnrollments || !connection.accessToken}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
                            >
                                {isLoadingEnrollments ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                {isLoadingEnrollments ? 'Polling...' : 'Poll Enrollments'}
                            </button>

                            {enrollmentsError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{enrollmentsError}</p>
                                </div>
                            )}

                            {allEnrollments && (
                                <div className="mt-4">
                                    {/* State breakdown */}
                                    <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Enrollments by State:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(
                                                allEnrollments.reduce((acc, e) => {
                                                    acc[e.state] = (acc[e.state] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([state, count]) => (
                                                <span
                                                    key={state}
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        state === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                            : state === 'active'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {state}: {count}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Completed enrollments highlight */}
                                    {(() => {
                                        const completed = allEnrollments.filter(e => e.state === 'completed');
                                        if (completed.length > 0) {
                                            return (
                                                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                    <p className="text-sm font-medium text-emerald-700 mb-2">
                                                        🎉 Found {completed.length} completed enrollment(s)!
                                                    </p>
                                                    <div className="space-y-2">
                                                        {completed.slice(0, 5).map(e => (
                                                            <div key={e.id} className="text-xs text-emerald-600 bg-emerald-100 p-2 rounded">
                                                                <strong>{e.person?.display_name || e.person?.first_name}</strong>
                                                                {e.person?.email && <span className="ml-1">({e.person.email})</span>}
                                                                <span className="mx-1">→</span>
                                                                <span>{e.class?.name || 'Unknown class'}</span>
                                                            </div>
                                                        ))}
                                                        {completed.length > 5 && (
                                                            <p className="text-xs text-emerald-500">
                                                                ...and {completed.length - 5} more
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <p className="text-sm text-amber-700">
                                                    No enrollments with <code className="bg-amber-100 px-1 rounded">completed</code> state found.
                                                </p>
                                                <p className="text-xs text-amber-600 mt-1">
                                                    This could mean: (1) No courses have ended, or (2) Google Classroom doesn't set this state.
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* Email availability check */}
                                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">
                                            <strong>{allEnrollments.filter(e => e.person?.email).length}</strong> of{' '}
                                            <strong>{allEnrollments.length}</strong> enrollments have student emails
                                            {allEnrollments.filter(e => e.person?.email).length === allEnrollments.length
                                                ? ' ✅'
                                                : ' ⚠️'}
                                        </p>
                                    </div>

                                    {/* Collapsible raw JSON */}
                                    <button
                                        onClick={() => setIsEnrollmentsExpanded(!isEnrollmentsExpanded)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        {isEnrollmentsExpanded ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )}
                                        {isEnrollmentsExpanded ? 'Hide' : 'Show'} raw enrollments ({allEnrollments.length})
                                    </button>

                                    {isEnrollmentsExpanded && (
                                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                            {JSON.stringify(allEnrollments, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Coursework Completion Tracking (THE REAL SIGNAL) */}
                {!isPendingApproval && (
                    <section>
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Course Completion (Debug) ⭐
                        </h3>
                        <div className="bg-white rounded-xl border border-emerald-200 p-4">
                            <div className="mb-3 p-2 bg-emerald-50 rounded-lg">
                                <p className="text-xs text-emerald-700 font-medium">
                                    This is the REAL completion signal!
                                </p>
                                <p className="text-xs text-emerald-600 mt-1">
                                    <code className="bg-emerald-100 px-1 rounded">Submission.state = "returned"</code> means
                                    the teacher finalized the grade. Course complete = all assignments returned.
                                </p>
                            </div>

                            <button
                                onClick={handleFetchCoursework}
                                disabled={isLoadingCoursework || !connection.accessToken}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                            >
                                {isLoadingCoursework ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ClipboardList className="w-4 h-4" />
                                )}
                                {isLoadingCoursework ? 'Fetching...' : 'Fetch Coursework & Submissions'}
                            </button>

                            {courseworkError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{courseworkError}</p>
                                </div>
                            )}

                            {courseworkData && (
                                <div className="mt-4">
                                    {/* Class selector */}
                                    <div className="mb-4">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Select Class:</label>
                                        <select
                                            value={selectedClassId || ''}
                                            onChange={(e) => setSelectedClassId(e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg"
                                        >
                                            {courseworkData.map(cw => (
                                                <option key={cw.classInfo.id} value={cw.classInfo.id}>
                                                    {cw.classInfo.name} ({cw.assignments.length} assignments, {cw.submissions.length} submissions)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Selected class details */}
                                    {(() => {
                                        const selectedClass = courseworkData.find(cw => cw.classInfo.id === selectedClassId);
                                        if (!selectedClass) return null;

                                        const studentProgress = calculateStudentProgress(selectedClass);
                                        const completedStudents = studentProgress.filter(s => s.isComplete);

                                        // Submission state breakdown
                                        const stateBreakdown = selectedClass.submissions.reduce((acc, s) => {
                                            acc[s.state] = (acc[s.state] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>);

                                        return (
                                            <div className="space-y-4">
                                                {/* Summary stats */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg text-center">
                                                        <p className="text-lg font-semibold text-blue-700">
                                                            {selectedClass.assignments.length}
                                                        </p>
                                                        <p className="text-xs text-blue-500">Assignments</p>
                                                    </div>
                                                    <div className="p-2 bg-purple-50 rounded-lg text-center">
                                                        <p className="text-lg font-semibold text-purple-700">
                                                            {studentProgress.length}
                                                        </p>
                                                        <p className="text-xs text-purple-500">Students</p>
                                                    </div>
                                                </div>

                                                {/* Submission states */}
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-2">Submission States:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(stateBreakdown).map(([state, count]) => (
                                                            <span
                                                                key={state}
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    state === 'returned'
                                                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                                                        : state === 'submitted'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : state === 'created'
                                                                        ? 'bg-gray-100 text-gray-600'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {state}: {count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Completed Assignments by Student */}
                                                {(() => {
                                                    // Debug: show people map size
                                                    const peopleCount = selectedClass.people.size;

                                                    // Get all returned submissions grouped by assignment
                                                    type CompletionRecord = {
                                                        person: EdlinkPerson | null;
                                                        personId: string;
                                                        gradedDate: string | null;
                                                        grade: number | null;
                                                    };
                                                    const completedByAssignment = new Map<string, {
                                                        assignmentTitle: string;
                                                        completions: CompletionRecord[];
                                                    }>();

                                                    // Build a map of google_id -> person for matching
                                                    const googleIdToPerson = new Map<string, EdlinkPerson>();
                                                    for (const [, person] of selectedClass.people) {
                                                        const googleId = person.identifiers?.find((i: any) => i.type === 'google_id')?.value;
                                                        if (googleId) {
                                                            googleIdToPerson.set(googleId, person);
                                                        }
                                                    }
                                                    console.log('People with google_id:', googleIdToPerson.size);

                                                    // Debug: log google_id values to compare
                                                    if (selectedClass.submissions.length > 0) {
                                                        const subGoogleId = (selectedClass.submissions[0] as any).identifiers?.find((i: any) => i.type === 'google_id')?.value;
                                                        console.log('Sample submission google_id:', subGoogleId);
                                                    }
                                                    console.log('All people google_ids:', Array.from(googleIdToPerson.keys()));

                                                    for (const sub of selectedClass.submissions) {
                                                        if (sub.state !== 'returned') continue;

                                                        const assignmentId = (sub as any).assignmentId || sub.assignment?.id;
                                                        const assignmentTitle = (sub as any).assignmentTitle || 'Unknown Assignment';

                                                        // Try to find person via:
                                                        // 1. person_id field (if Ed.link returns it)
                                                        // 2. google_id matching (workaround for Google Classroom)
                                                        let person: EdlinkPerson | null = null;
                                                        let personId = 'unknown';

                                                        // Method 1: Direct person_id
                                                        const directPersonId = (sub as any).person_id || sub.person?.id;
                                                        if (directPersonId) {
                                                            person = selectedClass.people.get(directPersonId) || null;
                                                            personId = directPersonId;
                                                        }

                                                        // Method 2: Match via google_id
                                                        if (!person) {
                                                            const subGoogleId = (sub as any).identifiers?.find((i: any) => i.type === 'google_id')?.value;
                                                            if (subGoogleId) {
                                                                person = googleIdToPerson.get(subGoogleId) || null;
                                                                personId = subGoogleId;
                                                            }
                                                        }

                                                        // Skip teachers/admins (only if we have person data)
                                                        if (person) {
                                                            const isTeacherOrAdmin = person.roles?.includes('teacher') || person.roles?.includes('administrator');
                                                            if (isTeacherOrAdmin) continue;
                                                        }

                                                        if (!completedByAssignment.has(assignmentId)) {
                                                            completedByAssignment.set(assignmentId, { assignmentTitle, completions: [] });
                                                        }
                                                        completedByAssignment.get(assignmentId)!.completions.push({
                                                            person,
                                                            personId,
                                                            gradedDate: sub.graded_date,
                                                            grade: sub.grade,
                                                        });
                                                    }

                                                    const totalCompletions = Array.from(completedByAssignment.values())
                                                        .reduce((sum, a) => sum + a.completions.length, 0);

                                                    if (totalCompletions === 0) {
                                                        return (
                                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                                <p className="text-sm text-amber-700">
                                                                    No completed assignments yet.
                                                                </p>
                                                                <p className="text-xs text-amber-600 mt-1">
                                                                    Assignments are completed when submissions have <code className="bg-amber-100 px-1 rounded">returned</code> state.
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Debug: {peopleCount} people loaded, {selectedClass.submissions.filter(s => s.state === 'returned').length} returned submissions
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                            <p className="text-sm font-medium text-emerald-700 mb-2">
                                                                {totalCompletions} assignment completion(s)
                                                            </p>
                                                            <p className="text-xs text-emerald-600 mb-3">
                                                                {peopleCount} people in directory
                                                            </p>
                                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                                {Array.from(completedByAssignment.entries()).map(([assignmentId, data]) => (
                                                                    <div key={assignmentId} className="bg-white rounded-lg p-2 border border-emerald-100">
                                                                        <p className="text-xs font-semibold text-emerald-800 mb-2">
                                                                            {data.assignmentTitle}
                                                                        </p>
                                                                        <div className="space-y-1">
                                                                            {data.completions.map((c, idx) => (
                                                                                <div key={`${assignmentId}-${c.personId}-${idx}`} className="text-xs flex justify-between items-center bg-emerald-50 px-2 py-1 rounded">
                                                                                    <div>
                                                                                        {c.person ? (
                                                                                            <>
                                                                                                <span className="font-medium text-emerald-700">
                                                                                                    {c.person.display_name || `${c.person.first_name} ${c.person.last_name}`}
                                                                                                </span>
                                                                                                {c.person.email && (
                                                                                                    <span className="text-emerald-600 ml-1">({c.person.email})</span>
                                                                                                )}
                                                                                            </>
                                                                                        ) : (
                                                                                            <span className="font-medium text-amber-600">
                                                                                                Unknown student (submission: {c.personId.substring(0, 12)}...)
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right text-emerald-600">
                                                                                        {c.grade !== null && <span className="mr-2">{c.grade}pts</span>}
                                                                                        {c.gradedDate && (
                                                                                            <span className="text-[10px] text-emerald-500">
                                                                                                {new Date(c.gradedDate).toLocaleDateString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* All students progress */}
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-2">All Students Progress:</p>
                                                    <div className="space-y-1 max-h-48 overflow-y-auto">
                                                        {studentProgress.map(sp => (
                                                            <div
                                                                key={sp.person.id}
                                                                className={`text-xs p-2 rounded flex justify-between items-center ${
                                                                    sp.isComplete ? 'bg-emerald-50' : 'bg-gray-50'
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <span className={sp.isComplete ? 'text-emerald-700 font-medium' : 'text-gray-700'}>
                                                                        {sp.person.display_name || `${sp.person.first_name} ${sp.person.last_name}`}
                                                                    </span>
                                                                    {sp.person.email && (
                                                                        <span className="text-gray-400 ml-1 text-[10px]">{sp.person.email}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-1 text-[10px] ml-2">
                                                                    <span className="px-1 bg-emerald-100 text-emerald-600 rounded" title="Returned (graded)">
                                                                        R:{sp.returnedCount}
                                                                    </span>
                                                                    <span className="px-1 bg-blue-100 text-blue-600 rounded" title="Submitted">
                                                                        S:{sp.submittedCount}
                                                                    </span>
                                                                    <span className="px-1 bg-gray-100 text-gray-500 rounded" title="Created (not submitted)">
                                                                        C:{sp.createdCount}
                                                                    </span>
                                                                    <span className="px-1 bg-purple-100 text-purple-600 rounded" title="Total assignments">
                                                                        /{sp.totalAssignments}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        R=Returned (graded), S=Submitted, C=Created (not started)
                                                    </p>
                                                </div>

                                                {/* Raw data toggle */}
                                                <button
                                                    onClick={() => setIsCourseworkExpanded(!isCourseworkExpanded)}
                                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                                >
                                                    {isCourseworkExpanded ? (
                                                        <ChevronUp className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronDown className="w-3 h-3" />
                                                    )}
                                                    {isCourseworkExpanded ? 'Hide' : 'Show'} raw data
                                                </button>

                                                {isCourseworkExpanded && (
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Assignments:</p>
                                                            <pre className="p-2 bg-gray-900 text-gray-100 rounded text-[10px] overflow-x-auto max-h-32 overflow-y-auto">
                                                                {JSON.stringify(selectedClass.assignments, null, 2)}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Submissions:</p>
                                                            <pre className="p-2 bg-gray-900 text-gray-100 rounded text-[10px] overflow-x-auto max-h-32 overflow-y-auto">
                                                                {JSON.stringify(selectedClass.submissions, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};
