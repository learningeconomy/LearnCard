# Ed.link API Reference

Documentation for integrating with Ed.link to connect LMS systems and fetch educational data.

---

## API Architecture

Ed.link provides **three APIs** for different purposes:

| API | Purpose | Authentication |
|-----|---------|----------------|
| **Graph API** | Institution-level bulk data (schools, classes, people) | Integration Access Token |
| **User API** | Individual user context (student/teacher data) | User Access Token |
| **Meta API** | System info about integrations/sources | Application Secret Key |

---

## Data Flow After Onboarding

### 1. Onboarding Widget Callback

When the embedded onboarding widget completes, `onSuccess` receives:

```typescript
interface EdlinkIntegrationData {
    integration_id: string;      // Unique ID for this LMS connection
    access_token: string;        // Token for Graph API calls
    source?: {
        id: string;
        name: string;            // e.g., "Springfield High School"
        provider: string;        // e.g., "google_classroom", "canvas"
    };
}
```

### 2. List Integrations Endpoint (Meta API)

**Endpoint**: `GET https://ed.link/api/v1/integrations`

**Authentication**: Application Secret Key (from Ed.link Dashboard)

```javascript
const response = await fetch('https://ed.link/api/v1/integrations', {
    headers: {
        authorization: `Bearer ${application_secret_key}`
    }
});
```

**Response**:

```json
{
  "$data": [
    {
      "id": "3c58530b-53c5-4fff-b87b-14b6979bd3b2",
      "status": "active",
      "scope": "all",
      "created_date": "2020-02-09T00:52:54.970Z",
      "updated_date": "2020-02-09T00:52:54.970Z",
      "permissions": [],
      "targets": [],
      "access_token": "ZLQkLniHyIrw6AbcaNtlKMRyfSutuvIY",
      "source": {
        "id": "64d8f1fa-d68a-4096-84ad-a64104759aaf",
        "status": "active",
        "name": "Springfield High School",
        "created_date": "2020-02-09T00:52:54.970Z",
        "updated_date": "2020-02-09T00:52:54.970Z",
        "sync_interval": 86400
      },
      "provider": {
        "id": "47eda4bf-7440-4cd8-9ee7-44cafb98486b",
        "name": "Google Classroom",
        "icon_url": "/source/google_classroom.png",
        "application": "google_classroom",
        "allows_data_sync": true
      }
    }
  ]
}
```

### 3. Graph API - Fetch LMS Data

**Base URL**: `https://ed.link/api/v2/graph`

**Authentication**: Integration Access Token

```javascript
const response = await fetch('https://ed.link/api/v2/graph/classes', {
    headers: {
        authorization: `Bearer ${integration_access_token}`
    }
});
```

**Key Endpoints**:

| Endpoint | Description | Docs |
|----------|-------------|------|
| `GET /classes` | List all classes | [graph-list-classes](https://ed.link/docs/api/v2.0/classes/graph-list-classes) |
| `GET /people` | List all people (students, teachers, staff) | [graph-list-people](https://ed.link/docs/api/v2.0/people/graph-list-people) |
| `GET /enrollments` | List enrollments | [graph-list-enrollments](https://ed.link/docs/api/v2.0/enrollments/graph-list-enrollments) |
| `GET /districts` | List districts/organizations | [graph-list-districts](https://ed.link/docs/api/v2.0/districts/graph-list-districts) |
| `GET /schools` | List schools | [graph-list-schools](https://ed.link/docs/api/v2.0/schools/graph-list-schools) |
| `GET /courses` | List courses | [graph-list-courses](https://ed.link/docs/api/v2.0/courses/graph-list-courses) |
| `GET /assignments` | List assignments | [graph-list-assignments](https://ed.link/docs/api/v2.0/assignments/graph-list-assignments) |

---

## Data Models

### Integration Object

```typescript
interface EdlinkIntegration {
    id: string;                  // integration_id
    status: 'active' | 'paused' | 'disabled';
    scope: 'all' | 'specified';
    created_date: string;        // ISO 8601
    updated_date: string;
    access_token: string;        // For Graph API calls
    source: EdlinkSource;
    provider: EdlinkProvider;
}
```

### Source Object (Institution Info)

```typescript
interface EdlinkSource {
    id: string;
    status: 'active' | 'inactive';
    name: string;               // "Springfield High School"
    created_date: string;
    updated_date: string;
    sync_interval: number;      // seconds (86400 = daily)
}
```

### Provider Object (LMS Type)

```typescript
interface EdlinkProvider {
    id: string;
    name: string;               // "Google Classroom", "Canvas", etc.
    icon_url: string;           // "/source/google_classroom.png"
    application: string;        // "google_classroom", "canvas", etc.
    allows_data_sync: boolean;
}
```

---

## Implementation Strategies

### Option A: Use Onboarding Callback Only (Simplest)

Capture `source.name` and `source.provider` from the onSuccess callback. This gives institution name and LMS type immediately with no additional API calls.

### Option B: Verify via Meta API (More Robust)

After onboarding, call `GET /api/v1/integrations` with your app secret. Confirm the integration exists with `status: "active"` and get full provider details including icon.

### Option C: Fetch LMS Data via Graph API (Full Proof)

Use the `access_token` to call `GET /api/v2/graph/schools`. If it returns data, the connection is working and shows actual synced data from the LMS.

---

## Security Considerations

- The `access_token` is **sensitive** - it grants full read access to the institution's LMS data
- The Meta API requires your **application secret**, which should **never** be exposed client-side
- Backend endpoints are required for Meta API calls
- Store tokens securely and never log them

---

## External Resources

- [Edlink API Reference](https://ed.link/docs/api)
- [The Graph, User, and Meta API](https://ed.link/docs/guides/v2.0/getting-started/graph-user-meta-apis)
- [Configuring Integrations via API](https://ed.link/docs/guides/v2.0/integration-management/configuring-integrations-via-api)
- [User Interface Widgets](https://ed.link/docs/widgets/overview)
- [Edlink Node SDK](https://github.com/edlink/edlink-node-sdk)
