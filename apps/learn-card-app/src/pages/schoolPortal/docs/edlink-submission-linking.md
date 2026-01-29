# Ed.link API: Linking Students to Submitted Assignments

This document describes the API calls and logic used to associate students with their assignment submissions in the School Portal LMS integration.

## Overview

To display which student completed which assignment, we need to:
1. Fetch all people (students/teachers) from the LMS
2. Fetch assignments and submissions per class
3. Link submissions to people via `person_id`

---

## API Endpoints

All endpoints use the **Graph API v2** with an Integration Access Token.

### 1. Fetch All People

```http
GET https://ed.link/api/v2/graph/people
Authorization: Bearer {integration_access_token}
Content-Type: application/json
```

**Response:**
```json
{
  "$data": [
    {
      "id": "30a2b442-83d0-4dfd-9d36-fcbf72450918",
      "first_name": "Studentv2",
      "last_name": "test",
      "display_name": "Studentv2 test",
      "email": "studentv2@devbolt.io",
      "roles": ["student"],
      "created_date": "2025-01-28T...",
      "updated_date": "2025-01-28T..."
    }
  ],
  "$next": "cursor_for_pagination"
}
```

### 2. Fetch Classes

```http
GET https://ed.link/api/v2/graph/classes
Authorization: Bearer {integration_access_token}
```

**Response:**
```json
{
  "$data": [
    {
      "id": "cls_abc123",
      "name": "Algebra 101",
      "state": "active"
    }
  ]
}
```

### 3. Fetch Assignments Per Class

```http
GET https://ed.link/api/v2/graph/classes/{classId}/assignments
Authorization: Bearer {integration_access_token}
```

**Response:**
```json
{
  "$data": [
    {
      "id": "asn_xyz789",
      "title": "test assignment 123",
      "state": "active",
      "due_date": "2025-02-01T...",
      "points_possible": 100
    }
  ]
}
```

### 4. Fetch Submissions Per Assignment

```http
GET https://ed.link/api/v2/graph/classes/{classId}/assignments/{assignmentId}/submissions
Authorization: Bearer {integration_access_token}
```

**Response:**
```json
{
  "$data": [
    {
      "id": "sub_def456",
      "person_id": "30a2b442-83d0-4dfd-9d36-fcbf72450918",
      "state": "returned",
      "grade": 95,
      "graded_date": "2025-01-28T...",
      "submitted_date": "2025-01-27T..."
    }
  ]
}
```

**Key field:** `person_id` links the submission to a person in the `/people` response.

⚠️ **Important:** Not all submissions have `person_id`. See [Limitations](#limitations) below.

---

## Submission States

| State | Description | Credential Action |
|-------|-------------|-------------------|
| `created` | Assignment exists, student hasn't started | None |
| `submitted` | Student submitted, awaiting grading | None (wait for grade) |
| `returned` | Teacher graded and returned | **Issue credential** |
| `reclaimed` | Student reclaimed for revision | None |

The `returned` state is the **completion signal** - it means the teacher has finalized the grade.

---

## Linking Logic

### Step 1: Build a Person Lookup Map

```typescript
// Fetch all people
const peopleResponse = await fetch(
  'https://ed.link/api/v2/graph/people',
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const peopleData = await peopleResponse.json();

// Create lookup map: person.id → EdlinkPerson
const peopleMap = new Map<string, EdlinkPerson>();
peopleData.$data.forEach((person: EdlinkPerson) => {
  peopleMap.set(person.id, person);
});
```

### Step 2: Fetch Submissions and Link to People

```typescript
// For each class → for each assignment → fetch submissions
const submissionsResponse = await fetch(
  `https://ed.link/api/v2/graph/classes/${classId}/assignments/${assignmentId}/submissions`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const submissionsData = await submissionsResponse.json();

// Link each submission to a person
for (const submission of submissionsData.$data) {
  // The person_id field directly references the person's id
  const personId = submission.person_id;
  const person = peopleMap.get(personId);

  if (person && submission.state === 'returned') {
    console.log(`${person.display_name} (${person.email}) completed the assignment`);
    // → "Studentv2 test (studentv2@devbolt.io) completed the assignment"
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Ed.link Graph API v2                        │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
    GET /people           GET /classes      GET /classes/{id}/assignments
         │                      │                      │
         ▼                      │                      ▼
    Build Map:                  │           GET .../assignments/{id}/submissions
    id → Person                 │                      │
         │                      │                      │
         │                      │                      ▼
         │                      │              submission.person_id
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  peopleMap.get(       │
                    │    submission.person_id│
                    │  ) → EdlinkPerson     │
                    │                       │
                    │  person.email         │
                    │  person.display_name  │
                    └───────────────────────┘
```

---

## Code Locations

| File | Function/Lines | Purpose |
|------|----------------|---------|
| `services/edlinkApi.ts` | `fetchPeople()` | Fetch all people from LMS |
| `services/edlinkApi.ts` | `fetchClasses()` | Fetch all classes |
| `services/edlinkService.ts` | `fetchAllLmsData()` | Parallel fetch of all LMS data |
| `components/ConnectionDetail.tsx` | `handleFetchCoursework()` | Fetch assignments + submissions per class |
| `components/ConnectionDetail.tsx` | Lines 1335-1338 | Link `person_id` to person object |

---

## Important Notes

### API Hierarchy
Submissions **must** be fetched at the assignment level:
```
/classes/{classId}/assignments/{assignmentId}/submissions  ✅ Works
/classes/{classId}/submissions                              ❌ 404
/submissions                                                ❌ 404
```

### Google Classroom Specifics
- The `roles[]` array may be empty for some users
- Students without explicit roles should still be processed
- The `person_id` field is reliably present when sharing permissions are configured correctly

### Authentication
- Use the **Integration Access Token** (from Ed.link onboarding or Meta API)
- This is different from User Access Tokens (per-user auth)
- Token is stored in `connection.accessToken`

---

## Example: Complete Workflow

```typescript
async function getCompletedAssignments(accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 1. Get all people
  const people = await fetch('https://ed.link/api/v2/graph/people', { headers })
    .then(r => r.json());
  const peopleMap = new Map(people.$data.map(p => [p.id, p]));

  // 2. Get all classes
  const classes = await fetch('https://ed.link/api/v2/graph/classes', { headers })
    .then(r => r.json());

  const completions = [];

  for (const cls of classes.$data) {
    // 3. Get assignments for this class
    const assignments = await fetch(
      `https://ed.link/api/v2/graph/classes/${cls.id}/assignments`,
      { headers }
    ).then(r => r.json());

    for (const assignment of assignments.$data) {
      // 4. Get submissions for this assignment
      const submissions = await fetch(
        `https://ed.link/api/v2/graph/classes/${cls.id}/assignments/${assignment.id}/submissions`,
        { headers }
      ).then(r => r.json());

      // 5. Find returned (completed) submissions
      for (const sub of submissions.$data) {
        if (sub.state === 'returned') {
          const person = peopleMap.get(sub.person_id);
          if (person) {
            completions.push({
              studentName: person.display_name,
              studentEmail: person.email,
              assignmentTitle: assignment.title,
              className: cls.name,
              grade: sub.grade,
              gradedDate: sub.graded_date,
            });
          }
        }
      }
    }
  }

  return completions;
}
```

---

## Limitations

### Not All Submissions Have `person_id`

Based on testing with Google Classroom (January 2025), **not all submissions include `person_id`**:

| Scenario | `person_id` Present? |
|----------|---------------------|
| New submission (after Ed.link sync) | ✅ Yes |
| Historical/older submissions | ❌ Often missing |
| Submissions from users not yet synced | ❌ No |

**Example from real data:**
```
✅ test assignment 123      → person_id: "3c5db4da-..." → "Studentv2 test (studentv2@devbolt.io)"
❌ assignment version 3     → NO person_id              → "Unknown student (submission: Cg4IuL6ptL0Y...)"
❌ test title               → NO person_id              → "Unknown student (submission: Cg4IuL6ptL0Y...)"
```

### Google ID Format Mismatch

Submissions have a `google_id` in their `identifiers[]` array, but the format is **incompatible** with the `google_id` on people:

| Entity | google_id Format | Example |
|--------|------------------|---------|
| Submission | Base64-encoded | `Cg4IuL6ptL0YEISTxry_GA` |
| Person | Numeric string | `118418718501799591919` |

This means **google_id cannot be used as a fallback** for matching submissions to people.

### Workarounds

1. **Wait for Ed.link sync**: New submissions created after the integration is established should have `person_id`
2. **Contact Ed.link support**: Ask about backfilling `person_id` for historical submissions
3. **Accept partial data**: Display "Unknown student" for unlinked submissions (current implementation)

---

## Related Documentation

- [Ed.link Graph API Docs](https://ed.link/docs/api/v2.0)
- [Ed.link Submission States](https://ed.link/docs/api/v2.0/enums/submission-state)
- [Ed.link Authentication](https://ed.link/docs/guides/v2.0/getting-started/graph-user-meta-apis)
