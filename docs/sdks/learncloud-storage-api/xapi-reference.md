# xAPI Reference

## Understanding Key Concepts

{% hint style="success" %}
#### What is xAPI?

xAPI (Experience API) is a specification that allows you to track learning experiences. It uses a simple structure of "Actor - Verb - Object" to describe activities, similar to how you might say "John completed the course" in plain English.

[Learn more about xAPI in LearnCard](../../core-concepts/credentials-and-data/xapi-data.md)
{% endhint %}

{% hint style="info" %}
#### What is a DID?

A DID (Decentralized Identifier) is a unique identifier for your user that works across different systems. Think of it like an email address that works everywhere but is more secure and private.

[Learn more about DIDs in LearnCard](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md)
{% endhint %}

## Sending xAPI Statements

Here's how to send an xAPI statement to LearnCloud:

```typescript
interface XAPIStatement {
    actor: {
        objectType: "Agent";
        name: string;
        account: {
            homePage: string;
            name: string;
        };
    };
    verb: {
        id: string;
        display: {
            "en-US": string;
        };
    };
    object: {
        id: string;
        definition: {
            name: { "en-US": string };
            description: { "en-US": string };
            type: string;
        };
    };
}

async function sendXAPIStatement(
    statement: XAPIStatement, 
    jwt: string, 
    endpoint: string = "https://cloud.learncard.com/xapi"
) {
    const response = await fetch(`${endpoint}/statements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Experience-API-Version': '1.0.3',
            'X-VP': jwt
        },
        body: JSON.stringify(statement)
    });
    
    return response;
}
```

## Example: Tracking Game Activities

Here are examples of tracking different activities in a skills-building game:

### 1. Tracking Activity Attempts

```typescript
// When a player starts a new challenge
const attemptStatement = {
    actor: {
        objectType: "Agent",
        name: userDid,  // Use the user's DID here
        account: {
            homePage: "https://www.w3.org/TR/did-core/",
            name: userDid
        }
    },
    verb: {
        id: "http://adlnet.gov/expapi/verbs/attempted",
        display: {
            "en-US": "attempted"
        }
    },
    object: {
        id: "http://yourgame.com/activities/level-1-challenge",
        definition: {
            name: { "en-US": "Level 1 Challenge" },
            description: { "en-US": "First challenge of the game" },
            type: "http://adlnet.gov/expapi/activities/simulation"
        }
    }
};
```

### 2. Tracking Skill Development

```typescript
// When a player demonstrates a skill
const skillStatement = {
    actor: {
        objectType: "Agent",
        name: userDid,
        account: {
            homePage: "https://www.w3.org/TR/did-core/",
            name: userDid
        }
    },
    verb: {
        id: "http://adlnet.gov/expapi/verbs/demonstrated",
        display: {
            "en-US": "demonstrated"
        }
    },
    object: {
        id: "http://yourgame.com/skills/problem-solving",
        definition: {
            name: { "en-US": "Problem Solving" },
            description: { "en-US": "Successfully solved a complex game challenge" },
            type: "http://adlnet.gov/expapi/activities/skill"
        }
    }
};
```

### 3. Tracking Achievements with Results

```typescript
// When a player completes a milestone with specific metrics
const achievementStatement = {
    actor: {
        objectType: "Agent",
        name: userDid,
        account: {
            homePage: "https://www.w3.org/TR/did-core/",
            name: userDid
        }
    },
    verb: {
        id: "http://adlnet.gov/expapi/verbs/mastered",
        display: {
            "en-US": "mastered"
        }
    },
    object: {
        id: "http://yourgame.com/achievements/speed-runner",
        definition: {
            name: { "en-US": "Speed Runner" },
            description: { "en-US": "Completed level with exceptional speed" },
            type: "http://adlnet.gov/expapi/activities/performance"
        }
    },
    result: {
        success: true,
        completion: true,
        extensions: {
            "http://yourgame.com/xapi/extensions/completion-time": "120_seconds",
            "http://yourgame.com/xapi/extensions/score": "95"
        }
    }
};
```

### Common Gotchas and Tips

1. **DID Usage**: Always use the same DID in both `actor.name` and `actor.account.name`. This DID should come from your authentication process.
2. **Verb Selection**: Use standard xAPI verbs when possible. Common ones include:
   * attempted
   * completed
   * mastered
   * demonstrated
   * failed
   * progressed
3. **Activity IDs**: Use consistent, unique URLs for your activity IDs. They don't need to be real URLs, but they should be unique identifiers following URL format.
4. **Authentication**: The JWT token should be sent in the `X-VP` header. This is specific to LearnCloud's implementation.
5. **Error Handling**: Always implement proper error handling:

```typescript
try {
    const response = await sendXAPIStatement(statement, jwt);
    if (!response.ok) {
        const error = await response.json();
        console.error('xAPI Statement Error:', error);
    }
} catch (err) {
    console.error('Network Error:', err);
}
```

### Testing Your Implementation

Before sending real user data, test your implementation with sample statements. Verify that:

1. The authentication works (200 status code)
2. The statements are properly formatted
3. The DIDs are correctly included in both required locations
4. The verbs and activity types make sense for your use case

## Reading xAPI Statements

After sending xAPI statements, you can retrieve them using the same endpoint:

```typescript
// Basic GET request for statements
const actor = {
    account: { 
        homePage: "https://www.w3.org/TR/did-core/",
        name: userDid  // Your user's DID
    },
    name: userDid
};

// Convert actor to URL parameter
const params = new URLSearchParams({ 
    agent: JSON.stringify(actor) 
});

// Fetch statements
const response = await fetch(`${endpoint}/statements?${params}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3',
        'X-VP': jwt  // Your authentication JWT
    }
});
```

### Important Security Notes

1. Users can only read statements about themselves
2. The DID in the JWT (X-VP header) must match the actor's DID
3. A 401 error means either:
   * Invalid authentication
   * Trying to read another user's statements
   * Expired or malformed JWT

### Delegated Access

If you need to allow another party to read statements:

1. Create a delegate credential:

```typescript
const delegateCredential = await userA.invoke.issueCredential({
    type: 'delegate',
    subject: userB.id.did(),
    access: ['read']  // Can be ['read'], ['write'], or ['read', 'write']
});
```

2. Use the delegate credential to create a presentation:

```typescript
const unsignedPresentation = await userB.invoke.newPresentation(delegateCredential);
const delegateJwt = await userB.invoke.issuePresentation(unsignedPresentation, {
    proofPurpose: 'authentication',
    proofFormat: 'jwt'
});
```

3. Use this JWT in the X-VP header to read statements

### Voiding Statements

To remove a statement (mark it as void):

```typescript
// First get the statement ID from the original POST response
const statementId = (await postResponse.json())[0];

// Create void statement
const voidStatement = {
    actor,
    verb: XAPI.Verbs.VOIDED,
    object: { 
        objectType: 'StatementRef', 
        id: statementId 
    }
};

// Send void request
const voidResponse = await fetch(`${endpoint}/statements`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3',
        'X-VP': jwt
    },
    body: JSON.stringify(voidStatement)
});
```

Important: You can only void statements that you created.

### Validation Tips

1. Check Response Status:
   * 200: Success
   * 401: Authentication/permission error
   * Other: Server/request error
2. Common Implementation Issues:
   * JWT not matching actor DID
   * Missing or malformed agent parameter
   * Incorrect content type header
   * Missing xAPI version header
3. Testing Checklist:
   * Can read own statements
   * Cannot read others' statements
   * Delegate access works as expected
   * Can void own statements
   * Cannot void others' statements

Remember: The xAPI server maintains strict permissions - users can only read and modify their own statements unless explicitly delegated access by the statement owner.

## Advanced xAPI Statement Queries

### Filtering Large Statement Sets

When dealing with large statement volumes or statements with extensive data in extensions, you can use the following techniques to retrieve more manageable subsets of data.

### Basic Query Parameters

The xAPI API supports several query parameters to limit and filter your results:

```typescript
// Basic query with filtering
const queryParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  limit: "10",                             // Limit to 10 results
  since: "2024-03-01T00:00:00Z",           // Only statements after this date
  until: "2024-03-31T23:59:59Z",           // Only statements before this date
  verb: "http://adlnet.gov/expapi/verbs/completed" // Only specific verb
});

const response = await fetch(`${endpoint}/statements?${queryParams}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
    'X-VP': jwt
  }
});
```

### Key Filtering Parameters

| Parameter   | Description                               | Example                                           |
| ----------- | ----------------------------------------- | ------------------------------------------------- |
| `limit`     | Maximum number of statements to return    | `limit=20`                                        |
| `since`     | ISO 8601 date to filter statements after  | `since=2024-03-01T00:00:00Z`                      |
| `until`     | ISO 8601 date to filter statements before | `until=2024-03-31T23:59:59Z`                      |
| `verb`      | Filter by verb ID                         | `verb=http://adlnet.gov/expapi/verbs/completed`   |
| `activity`  | Filter by activity ID                     | `activity=http://yourgame.com/activities/level-1` |
| `ascending` | Return in ascending order (oldest first)  | `ascending=true`                                  |

### Using Pagination

For very large datasets, implement pagination:

```typescript
// First page
let more = "";
const getPage = async (more) => {
  const url = more || `${endpoint}/statements?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Experience-API-Version': '1.0.3',
      'X-VP': jwt
    }
  });
  
  const data = await response.json();
  
  // Process the statements
  processStatements(data.statements);
  
  // Check if there are more pages
  return data.more || null;
};

// Initial request
more = await getPage();

// Get next page if available
if (more) {
  more = await getPage(more);
}
```

### Reducing Statement Size

If dealing with extremely large data in extensions:

1. **Reference Instead of Embed**: Store large data elsewhere and include a reference URL in your statement:

```javascript
extensions: {
  "http://yourdomain.com/xapi/extensions/detailed-data": {
    dataId: "123abc",
    dataUrl: "https://storage.yourdomain.com/data/123abc.json"
  }
}
```

2. **Summarize Data**: Include only essential information in statements:

```javascript
extensions: {
  "http://yourdomain.com/xapi/extensions/user-progress": {
    level: "intermediate",
    completionPercentage: 68,
    keyMetrics: ["accuracy:85%", "speed:72", "participation:high"]
  }
}
```

### Specialized Queries

#### Activity-Specific Statements

To retrieve all statements about a specific activity regardless of verb:

```typescript
const activityParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  activity: "http://yourdomain.com/activities/skill-assessment"
});

const response = await fetch(`${endpoint}/statements?${activityParams}`, {
  // headers as before
});
```

#### Timeline Analysis

To analyze progress over time, sort statements in chronological order:

```typescript
const timelineParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  ascending: "true",
  since: "2024-01-01T00:00:00Z"
});

const response = await fetch(`${endpoint}/statements?${timelineParams}`, {
  // headers as before
});
```

#### Skill-Based Filtering

To filter statements related to a specific skill or competency:

```typescript
const skillParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  activity: "http://yourdomain.com/skills/problem-solving"
});

const response = await fetch(`${endpoint}/statements?${skillParams}`, {
  // headers as before
});
```

#### Completion Status

To find all completed activities:

```typescript
const completedParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  verb: "http://adlnet.gov/expapi/verbs/completed",
  since: "2024-01-01T00:00:00Z"
});

const response = await fetch(`${endpoint}/statements?${completedParams}`, {
  // headers as before
});
```

#### Aggregation Queries

To retrieve summary data rather than individual statements:

```typescript
// First, retrieve statements with aggregation parameter
const aggregateParams = new URLSearchParams({
  agent: JSON.stringify(actor),
  verb: "http://adlnet.gov/expapi/verbs/experienced",
  since: "2024-01-01T00:00:00Z",
  format: "ids" // Retrieve only IDs for faster processing
});

const response = await fetch(`${endpoint}/statements?${aggregateParams}`, {
  // headers as before
});

// Then process locally to generate summaries
const statements = await response.json();
const activityCounts = {};

statements.forEach(statement => {
  const activityId = statement.object.id;
  activityCounts[activityId] = (activityCounts[activityId] || 0) + 1;
});

// Now activityCounts shows frequency of each activity
```

### Best Practices for Large Data Sets

1. **Use IDs Effectively**: Query by specific activity IDs to get only statements related to particular challenges or learning objectives
2. **Time-Based Queries**: Filter by recent time periods when monitoring current progress
3. **Aggregate First**: If analyzing patterns, consider creating aggregated statements that summarize multiple detailed statements
4. **Batch Processing**: For analysis, retrieve data in small batches and process incrementally
5. **Cache Common Queries**: If your application frequently needs the same filtered view, consider caching the results
