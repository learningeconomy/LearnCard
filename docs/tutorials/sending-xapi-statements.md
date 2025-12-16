# Send xAPI Statements

This tutorial will walk you through the essential steps to send an xAPI statement to LearnCloud Storage and then read it back. We'll keep it simple so you can get up and running quickly!

## **What you'll accomplish:**

* Construct a basic xAPI statement.
* Send the statement to the LearnCloud xAPI endpoint.
* Retrieve and verify the statement you sent.

{% embed url="https://codepen.io/Jacks-n-Smith/pen/xbbBmBV" fullWidth="false" %}

## **Prerequisites:**

1. **Understanding Key Concepts:**
   * **What is xAPI?** xAPI (Experience API) is a way to track learning experiences using a simple "Actor - Verb - Object" structure (e.g., "Sarah completed 'Safety Course'"). For a deeper dive, see our [Understanding xAPI Data in LearnCard](../core-concepts/credentials-and-data/xapi-data.md) core concept page.
   * **What is a DID?** A DID (Decentralized Identifier) is a unique identifier for your user. Think of it as a secure, private digital ID. More details can be found on our [Understanding DIDs](../core-concepts/identities-and-keys/decentralized-identifiers-dids.md) core concept page.
2. **Your Environment:**
   * You have the [LearnCard SDK ](../sdks/learncard-core/)initialized in your project.
   * You have obtained a **JSON Web Token (JWT)** for authentication. This JWT represents the authenticated user (the "actor"). As an example of how to create this JWT, check out the[ "Create a Connected Website Tutorial."](create-a-connected-website.md)
   * You have the **DID** of the authenticated user.
   * The default LearnCloud xAPI endpoint is `https://cloud.learncard.com/xapi/statements`.

***

## Part 1: Sending an xAPI Statement

Let's send a statement indicating a user has attempted a challenge in a game.

{% stepper %}
{% step %}
### **Define Your xAPI Statement**

An xAPI statement has three main parts: an `actor` (who did it), a `verb` (what they did), and an `object` (what they did it to).

```typescript
// Placeholders: Replace with your actual data
const userDid = 'did:example:YOUR_USER_DID'; // The DID of the user performing the action
const jwtToken = 'YOUR_JWT_TOKEN';          // Your authentication JWT
const xapiEndpoint = 'https://cloud.learncard.com/xapi/statements';

const attemptStatement = {
    actor: {
        objectType: "Agent",
        name: userDid,  // Use the user's DID here
        account: {
            homePage: "https://www.w3.org/TR/did-core/", // Standard homepage for DID accounts
            name: userDid  // Crucial: Also use the user's DID here
        }
    },
    verb: {
        id: "http://adlnet.gov/expapi/verbs/attempted", // A standard xAPI verb URI
        display: {
            "en-US": "attempted" // Human-readable display for the verb
        }
    },
    object: {
        id: "http://yourgame.com/activities/level-1-challenge", // A unique URI for your activity
        definition: {
            name: { "en-US": "Level 1 Challenge" },
            description: { "en-US": "The first exciting challenge of the game." },
            type: "http://adlnet.gov/expapi/activities/simulation" // Type of activity
        }
    }
};

// Type interface for clarity (optional, but good practice)
interface XAPIStatement {
    actor: {
        objectType: "Agent";
        name: string;
        account: { homePage: string; name: string; };
    };
    verb: {
        id: string;
        display: { "en-US": string; };
    };
    object: {
        id: string;
        definition: {
            name: { "en-US": string };
            description: { "en-US": string };
            type: string;
        };
    };
    result?: any; // Optional result object
}
```

✨ **Good to know:**

* **DID Usage:** For LearnCloud, ensure the `userDid` is used in both `actor.name` and `actor.account.name`.
* **Verb Selection:** Use standard xAPI verb URIs when possible. You can find lists of common verbs online (e.g., on the ADLNet website).
* **Activity IDs:** Make your `object.id` URIs unique for each distinct activity. They don't need to be real, live URLs.
{% endstep %}

{% step %}
**Prepare and Send the Statement**

We'll use a `Workspace` request to send this statement. The key things are the `POST` method, correct headers, and the statement in the body.

```typescript
async function sendStatement(statement: XAPIStatement, token: string, endpointUrl: string) {
    console.log("Sending xAPI Statement:", JSON.stringify(statement, null, 2));

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Experience-API-Version': '1.0.3', // Standard xAPI version header
                'X-VP': token                       // LearnCloud specific: Your JWT for authentication
            },
            body: JSON.stringify(statement)
        });

        if (!response.ok) {
            // If the server response is not OK (e.g., 400, 401, 500)
            let errorData;
            try {
                errorData = await response.json(); // Try to parse a JSON error response
            } catch (e) {
                errorData = { status: response.status, statusText: response.statusText }; // Fallback if no JSON body
            }
            console.error('xAPI Statement Error:', errorData);
            throw new Error(`Failed to send xAPI statement: ${response.status} ${response.statusText}`);
        }

        // If successful, the LRS usually returns an array with the ID of the stored statement
        const responseData = await response.json();
        console.log('xAPI Statement Sent Successfully! Response:', responseData);
        return responseData; // This often is an array with the statement ID(s)

    } catch (networkError) {
        console.error('Network or other error sending xAPI statement:', networkError);
        throw networkError;
    }
}

// Let's send our 'attemptStatement'
// (Ensure userDid and jwtToken are defined as in Step 1)
sendStatement(attemptStatement, jwtToken, xapiEndpoint)
    .then(ids => {
        if (ids && ids.length > 0) {
            console.log("Statement ID received:", ids[0]);
            // You might want to store this ID if you plan to void the statement later.
        }
    })
    .catch(error => {
        // Error already logged in sendStatement, but you can do more here if needed
    });
```
{% endstep %}

{% step %}
**Check the Response**

If successful, the LearnCloud Storage API will typically return an HTTP status like `200 OK` or `204 No Content`. Often, a `200 OK` response to a `POST` will include an array containing the unique ID(s) of the statement(s) just stored. Our `sendStatement` function logs this.
{% endstep %}
{% endstepper %}

***

## Part 2: Reading xAPI Statements

Now that we've sent a statement, let's try to read statements for that user.

{% stepper %}
{% step %}
### **Prepare Your Request Parameters**

To read statements, you'll usually query for statements related to a specific `agent` (the actor). The `agent` parameter must be a JSON string.

```typescript
// (Ensure userDid and jwtToken are defined as in Part 1, Step 1)
// And xapiEndpoint is also defined: const xapiEndpoint = 'https://cloud.learncard.com/xapi/statements';


// Define the actor (agent) for whom you want to retrieve statements
const actorToQuery = {
    objectType: "Agent",
    name: userDid,
    account: {
        homePage: "https://www.w3.org/TR/did-core/",
        name: userDid
    }
};

// Construct URL parameters
const params = new URLSearchParams({
    agent: JSON.stringify(actorToQuery) // Key parameter: filter by agent
    // You can add other parameters like 'verb', 'activity', 'since', 'limit' here
    // For example: limit: '10'
});
```
{% endstep %}

{% step %}
**Make the API Call to Read Statements**

This will be a `GET` request.

```typescript
async function readStatements(queryParams: URLSearchParams, token: string, endpointUrl: string) {
    console.log(`Reading xAPI Statements with params: ${queryParams.toString()}`);

    try {
        const response = await fetch(`${endpointUrl}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                // 'Content-Type': 'application/json', // Not strictly needed for GET, but often included
                'X-Experience-API-Version': '1.0.3',
                'X-VP': token // Your authentication JWT
            }
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { status: response.status, statusText: response.statusText };
            }
            console.error('Error Reading xAPI Statements:', errorData);
            throw new Error(`Failed to read xAPI statements: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Successfully Read xAPI Statements:', data);
        return data; // Contains 'statements' array and possibly a 'more' link for pagination

    } catch (networkError) {
        console.error('Network or other error reading xAPI statements:', networkError);
        throw networkError;
    }
}

// Let's read statements for our user
// (Ensure params, jwtToken, and xapiEndpoint are defined)
readStatements(params, jwtToken, xapiEndpoint)
    .then(data => {
        if (data.statements && data.statements.length > 0) {
            console.log(`Found ${data.statements.length} statement(s).`);
            // You can now iterate through data.statements
            // Try to find the statement you sent earlier!
            const myStatement = data.statements.find(stmt => stmt.object.id === "http://yourgame.com/activities/level-1-challenge");
            if (myStatement) {
                console.log("Found the statement we sent:", myStatement);
            }
        } else {
            console.log("No statements found for this agent or an error occurred.");
        }
        if (data.more) {
            console.log("More statements available at:", data.more);
        }
    })
    .catch(error => {
        // Error already logged
    });
```
{% endstep %}

{% step %}
**Process the Response**

The response from a `GET` request to the `/statements` endpoint will be a JSON object. This object typically contains an array called `statements` and optionally a `more` property. The `more` property provides a URL to fetch the next page of results if pagination is active.
{% endstep %}
{% endstepper %}

***

## Important Considerations (Recap)

* **Authentication (`X-VP` Header):** All requests to the LearnCloud xAPI endpoint must include a valid JWT in the `X-VP` header.
* **Permissions:**
  * Users can only send statements where they are the actor (or have delegated authority).
  * Users can typically only read statements where they are the actor. The DID in your JWT (`X-VP` header) must match the actor's DID you are querying for. A `401 Unauthorized` error often means a DID mismatch or an invalid/expired JWT.
* **Error Handling:** Always check response statuses and handle potential errors from the API or network issues.
* **Delegated Access:** For scenarios where another party needs to read statements, LearnCloud supports a delegated access mechanism using Verifiable Credentials. (See Advanced Topics: Delegated Access for more info).
* **Voiding Statements:** You can invalidate previously sent statements. (See [Advanced Topics: Voiding Statements](../sdks/learncloud-storage-api/xapi-reference.md#voiding-statements) for how).

***

## Next Steps

Congratulations! You've now seen how to send and read basic xAPI statements with LearnCloud.

From here, you can explore:

* Sending different types of xAPI statements (e.g., `completed`, `mastered`, with `result` objects).
* Using the other examples provided in our [xAPI Concepts Guide](../core-concepts/credentials-and-data/xapi-data.md).
* Implementing more advanced queries to filter and retrieve statements. (See [Advanced xAPI Statement Queries](../sdks/learncloud-storage-api/xapi-reference.md#advanced-xapi-statement-queries)).
* Connecting these xAPI statements as evidence for Verifiable Credentials.

Happy tracking!
