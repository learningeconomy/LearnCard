---
description: >-
  How-To Guide: Delegating Credential Issuance with Your Own AWS-Hosted Signing
  Authority
---

# Signing Authority

Welcome! This how-to guide will walk you through deploying, configuring, and using your own self-hosted "Signing Authority" on AWS. This allows a primary identity (the "Owner") to delegate the ability to sign and issue credentials to this AWS-hosted service, without exposing the Owner's primary private keys. It's a robust pattern for enhanced security and operational flexibility in a cloud environment.

## **What is a Signing Authority and Why Use It?**

Imagine your organization (the Owner) wants to allow a specific department's application or a trusted partner service to issue "Course Completion" badges on its behalf. You wouldn't want to give that application your organization's main private key. Let's use a Signing Authority!

{% hint style="info" %}
A **Signing Authority** is a separate service with its own unique identity and keys. The Owner can authorize this Signing Authority to issue specific credentials on their behalf.[ Learn more about Signing Authorities.](../../core-concepts/identities-and-keys/signing-authorities.md)
{% endhint %}

**What you'll accomplish in this tutorial:**

1. Deploy the `simple-signing-service` to AWS Lambda and API Gateway using the Serverless Framework (this will be your Signing Authority).
2. Configure an "Owner" LearnCard instance that will delegate issuance.
3. Instruct your AWS-hosted Signing Authority (via its configuration) to be ready to sign for your Owner.
4. Register your AWS-hosted Signing Authority with the LearnCloud Network, linking it to your Owner's profile.
5. Create a "Boost" (credential template) as the Owner.
6. Issue an instance of this Boost to a recipient, with the signing performed by your AWS-hosted Signing Authority.

**Prerequisites:**

* **Node.js (v16+ recommended)** and **pnpm** (or npm/yarn, but `simple-signing-service` uses pnpm for its scripts).
* **Git** installed.
* **AWS Account:** An active AWS account with permissions to create IAM roles, Lambda functions, API Gateway, and SQS (if used by the service for async tasks, though `simple-signing-service` is primarily synchronous).
* **AWS CLI Installed and Configured:** With credentials and a default region set up. (e.g., `aws configure`).
* **Serverless Framework Installed:** `npm install -g serverless` (or `pnpm add -g serverless`).
* **MongoDB Instance:** A running MongoDB instance accessible from AWS (e.g., MongoDB Atlas free tier, or Amazon DocumentDB). You'll need its full connection URI.
* **Two Secure Seeds:** You'll need two distinct, 64-character hexadecimal seed phrases:
  * One for the **Owner** profile.
  * One for your **Simple Signing Service** (this will be its master key, configured as an environment variable in AWS).
  * _Remember: These must be cryptographically random and kept extremely secure._
* **Basic Understanding:** Familiarity with [Verifiable Credentials](../../core-concepts/credentials-and-data/verifiable-credentials-vcs.md), [DIDs](../../core-concepts/identities-and-keys/decentralized-identifiers-dids.md), AWS Lambda, API Gateway, and the [Create a Claimable Boost Quickstart](../../quick-start/your-first-integration.md).
*   **LearnCard SDK Packages:**

    ```bash
    # In a new project folder for this tutorial's main script (Owner's side)
    npm install @learncard/init @learncard/simple-signing-plugin
    # or pnpm/yarn
    ```

## Part 1: Deploying the `simple-signing-service` to AWS

This service, once deployed on AWS, will act as your dedicated Signing Authority.

### **Step 1.1: Clone and Setup the Service**

```bash
git clone https://github.com/learningeconomy/LearnCard.git
cd services/learn-card-network/simple-signing-service
pnpm install
```

### **Step 1.2: Configure for AWS Deployment (`serverless.yml` and Environment Variables)**

The `simple-signing-service` is designed for serverless deployment. Key configurations are managed via `serverless.yml` and environment variables.

1. **Review `serverless.yml`:** Open the [`serverless.yml`](https://github.com/learningeconomy/LearnCard/blob/main/services/learn-card-network/simple-signing-service/serverless.yml) file in the [`simple-signing-service`](https://github.com/learningeconomy/LearnCard/blob/main/services/learn-card-network/simple-signing-service) directory. Familiarize yourself with its structure. It defines the AWS Lambda function, API Gateway trigger, and expected environment variables.
2.  Set Environment Variables for Deployment:

    For AWS deployment, environment variables should not be hardcoded in a .env file that gets committed. Instead, they should be configured securely for your Lambda function. You can do this via the environment section in serverless.yml (for values safe to commit, or using Serverless Framework's variable system like ${env:VAR\_NAME} or ${ssm:/path/to/param} for secrets), or directly in the AWS Lambda console after deployment (less ideal for IaC).

    For this guide, we'll focus on setting them in `serverless.yml` using environment variables you'll set in your terminal _before deploying_, or by directly editing `serverless.yml` (for non-sensitive defaults).&#x20;
3.  Modify serverless.yml (example for environment variables): Open serverless.yml and locate the provider.environment section. It might look something like this initially:

    <pre class="language-yaml"><code class="lang-yaml"><strong>provider:
    </strong>    name: aws
        runtime: nodejs16.x
        memorySize: 2048
        timeout: 29
        stage: ${opt:stage, "dev"}
        region: ${opt:region, "us-east-1"}
        environment:
            LAMBDA_STAGE: ${opt:stage, "dev"}
            SEED: ${env:SEED}
            MONGO_URI: ${env:MONGO_URI}
            MONGO_DB_NAME: ${env:MONGO_DB_NAME}
            AUTHORIZED_DIDS: ${env:AUTHORIZED_DIDS}
            PORT: ${opt:httpPort, "3000"}

    </code></pre>


4. **Before deploying, you will need to set these environment variables in your terminal, or replace `${env:VAR_NAME}` with actual values if you're not using terminal env vars for deployment.**
   * `SIGNING_SERVICE_SEED`: Your unique, secure 64-character hex seed for this Signing Authority.
   * `AUTHORIZED_DIDS`: The DID of the "Owner" profile (you'll get this in Part 2). For initial deployment, you can set a placeholder like `"did:key:zPlaceholderOwnerDID"`. You will need to update this environment variable and redeploy the Lambda function after obtaining the Owner's actual DID.
   * `MONGO_URI`: Your full MongoDB connection string (e.g., from MongoDB Atlas).
   * `MONGO_DB_NAME`: The name of your MongoDB database (e.g., `my_signing_service_db`).

### **Step 1.3: Deploy to AWS**

Ensure your AWS CLI is configured with the correct account and region. Then, from the `simple-signing-service` directory:

1.  **Set environment variables in your terminal (example):**

    ```bash
    export SIGNING_SERVICE_SEED="YOUR_ACTUAL_SIGNING_AUTHORITY_64_CHAR_HEX_SEED"
    export AUTHORIZED_DIDS="did:key:zPlaceholderOwnerDID" # Will update later
    export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/mySigningDB?retryWrites=true&w=majority"
    export MONGO_DB_NAME="my_signing_service_db"

    ```
2.  **Deploy using Serverless Framework:**

    ```bash
    pnpm serverless-deploy --stage dev --region us-east-1 
    # Or 'sls deploy --stage dev --region us-east-1' if you have 'sls' alias
    # Replace 'dev' and 'us-east-1' with your desired stage and AWS region
    ```

{% hint style="info" %}
This command will package the service, create necessary AWS resources (Lambda, API Gateway endpoint, IAM roles), and deploy your code.
{% endhint %}

### **Step 1.4: Obtain Your Deployed API Endpoint**

After a successful deployment, the Serverless Framework output will show your API endpoint URL. It will look something like:

```bash
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/trpc
```

{% hint style="warning" %}
**Note this URL. This is `YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT`.**
{% endhint %}

## Part 2: Setting Up the "Owner" LearnCard Instance

This script will represent the organization or individual who owns the credentials and wants to delegate their issuance. Create a new file (e.g., `delegateIssuanceTutorial.ts`) in a _separate project folder_.

```typescript
// delegateIssuanceTutorial.ts
import { initLearnCard } from '@learncard/init';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

// --- Configuration ---
const OWNER_SEED = 'YOUR_OWNER_PROFILE_64_CHAR_HEX_SEED'; // Replace!
const OWNER_PROFILE_ID = 'my-org-aws-delegation';
const OWNER_PROFILE_NAME = 'My Organization (Owner via AWS SA)';

// This is the endpoint of YOUR AWS-HOSTED Simple Signing Service from Part 1
const YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT = 'https://YOUR_AWS_API_GATEWAY_ENDPOINT/dev/trpc'; // Replace!
const YOUR_SIGNING_AUTHORITY_NAME = 'my-org-signing-authority'; // A friendly name

let learnCardOwner: any;

async function setupOwnerLearnCard() {
    console.log('Initializing Owner LearnCard SDK...');
    if (OWNER_SEED === 'YOUR_OWNER_PROFILE_64_CHAR_HEX_SEED' || YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT.includes('YOUR_AWS_API_GATEWAY_ENDPOINT')) {
        console.error("CRITICAL: Replace placeholder values for OWNER_SEED and YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT in the script!");
        throw new Error("Configuration placeholders not replaced.");
    }

    learnCardOwner = await initLearnCard({
        seed: OWNER_SEED,
        network: true,
        allowRemoteContexts: true,
    });
    const ownerDid = learnCardOwner.id.did();
    console.log('Owner LearnCard Initialized.');
    console.log(`Owner DID: ${ownerDid}`);

    console.warn(`\nACTION REQUIRED: Update the AUTHORIZED_DIDS environment variable for your AWS Lambda function for the Simple Signing Service. Add the Owner DID "${ownerDid}". Then, redeploy the Lambda function (e.g., 'pnpm serverless-deploy --stage dev').`);
    console.log("Press Enter in this console when you have updated and redeployed the Signing Authority on AWS...");
    // In a real script, you might not pause like this, but for the "how-to guide" flow:
    // For Node.js console:
    await new Promise(resolve => process.stdin.once('data', () => resolve(null)));
    // For browser console, this won't work. You'd instruct user to do it manually.

    console.log('Adding SimpleSigningPlugin to Owner LearnCard, configured for your AWS authority...');
    learnCardOwner = await learnCardOwner.addPlugin(
        await getSimpleSigningPlugin(learnCardOwner, YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT)
    );
    console.log('SimpleSigningPlugin added to Owner.');

    console.log(`Ensuring Owner profile "${OWNER_PROFILE_ID}" exists on LearnCloud Network...`);
    try {
        let profile = await learnCardOwner.invoke.getProfile(OWNER_PROFILE_ID);
        if (!profile) {
            await learnCardOwner.invoke.createProfile({
                profileId: OWNER_PROFILE_ID,
                displayName: OWNER_PROFILE_NAME,
            });
            console.log(`Owner profile "${OWNER_PROFILE_ID}" created.`);
        } else {
            console.log(`Owner profile "${OWNER_PROFILE_ID}" already exists.`);
        }
    } catch (error: any) {
        if (error.message?.includes('Profile ID already exists')) {
            console.log(`Owner profile "${OWNER_PROFILE_ID}" already exists (confirmed by error).`);
        } else {
            console.error(`Failed to ensure Owner profile: ${error.message}`);
            throw error;
        }
    }
    return learnCardOwner;
}

```

{% hint style="info" %}
## **Action Required (Critical)**

1. Run `setupOwnerLearnCard()` once (e.g., by calling it in your `main` function and running the script).
2. Copy the `Owner DID` printed to your console.
3. Go to your `simple-signing-service` project. Update the `AUTHORIZED_DIDS` environment variable for your Lambda function (either in `serverless.yml` and redeploy, or directly in the Lambda console's environment variables section) to include this Owner's DID.
4. **Redeploy your `simple-signing-service` to AWS** with the updated environment variable: `pnpm serverless-deploy --stage dev --region your-region`.
5. Once redeployed, you can proceed with the rest of the tutorial script.
{% endhint %}

## Part 3: Registering Your AWS-Hosted Signing Authority with LearnCloud Network

The Owner informs the LearnCloud Network about their trust in your AWS-hosted Signing Authority.

```typescript
// Add this function to delegateIssuanceTutorial.ts

async function registerAuthorityWithLCN(ownerInstance: any, actualAuthorityServiceDid: string) {
    console.log(`Registering your AWS Signing Authority (DID: ${actualAuthorityServiceDid}, Endpoint: ${YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT}, Name: ${YOUR_SIGNING_AUTHORITY_NAME}) with LearnCloud Network on behalf of Owner (${ownerInstance.id.did()})...`);
    try {
        const success = await ownerInstance.invoke.registerSigningAuthority(
            YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT,
            YOUR_SIGNING_AUTHORITY_NAME,
            actualAuthorityServiceDid // The actual DID of your AWS-hosted Simple Signing Service
        );
        if (success) {
            console.log('AWS Signing Authority successfully registered with LearnCloud Network!');
        } else {
            console.error('Failed to register AWS Signing Authority with LearnCloud Network.');
        }
        return success;
    } catch (error: any) {
        console.error(`Error registering AWS Signing Authority with LCN: ${error.message}`);
        throw error;
    }
}

```

## Part 4: Creating a Boost (as Owner)

The Owner creates a Boost template. This is the same as in previous tutorials.

```typescript
// Add this function to delegateIssuanceTutorial.ts

let exampleBoostUri: string;

async function createOwnerBoost(ownerInstance: any) {
    console.log('Owner creating a Boost template...');
    const boostTemplateContent = {
        type: 'boost', 
        boostName: 'AWS Delegated Contributor Badge',
        boostImage: 'https://placehold.co/400x400/FF9900/FFFFFF?text=AWS+SA!',
        achievementType: 'Badge',
        achievementName:'Community Contributor (AWS Delegated)',
        achievementDescription: 'Recognizes valuable contributions, issued via AWS-hosted delegated authority.',
        achievementNarrative: 'This individual has shown outstanding commitment (signed by AWS SA).',
    };

    const boostMetadata = {
        name: 'Community Contributor Badge (AWS Delegated)',
        description: 'Issued by My Organization via our trusted AWS-hosted Signing Authority.',
        category: 'Achievement'
    };

    try {
        const unsignedTemplateVc = await ownerInstance.invoke.newCredential(boostTemplateContent);
        const signedTemplateVc = await ownerInstance.invoke.issueCredential(unsignedTemplateVc);

        exampleBoostUri = await ownerInstance.invoke.createBoost(signedTemplateVc, boostMetadata);
        console.log(`Boost created by Owner. URI: ${exampleBoostUri}`);
        return exampleBoostUri;
    } catch (error: any) {
        console.error(`Error creating Boost: ${error.message}`);
        throw error;
    }
}

```

## Part 5: Issuing the Boost via Your AWS-Hosted Signing Authority

The Owner requests to issue the Boost. The LearnCloud Network, knowing about the registered Signing Authority, will route the signing request to your AWS Lambda function.

1. [Generate an API token for LearnCloud Network API](generate-api-tokens.md).
2. Use that token to send the boost via Signing Authority over REST endpoint:

```typescript
// Add this function to delegateIssuanceTutorial.ts

// Generate an API Token for LearnCloud Network API
const API_TOKEN = '...'

async function sendBoostViaAwsAuthority(ownerInstance: any, boostUriToSend: string, recipientProfileId: string) {
    console.log(`Owner requesting to send Boost (${boostUriToSend}) to ${recipientProfileId} via AWS Signing Authority "${YOUR_SIGNING_AUTHORITY_NAME}"...`);
    
    try {
        const boostContentToSign = await ownerInstance.invoke.getBoost(boostUriToSend);
        if (!boostContentToSign || !boostContentToSign.boost) {
            throw new Error("Could not retrieve boost content to sign.");
        }

        const payload = {
            boostUri:boostUriToSend,
            signingAuthority: YOUR_SIGNING_AUTHORITY_NAME
        };
        
  

        console.log("Preparing to issue credential via AWS Signing Authority for recipient:", recipientProfileId);
        console.log("Watch the AWS CloudWatch Logs for your 'simple-signing-service' Lambda function. It should log a signing request if LCN routes it correctly.");

      // Make an authenticated HTTP request using the token
        const response = await fetch(
            `https://api.learncard.network/api/boost/send/via-signing-authority/${recipientProfileId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            }
        );
        
        let sentBoostUri;
        // Process the response
        if (response.status === 200) {
            sentBoostUri = await response.json();
            console.log(`Owner sent the AWS authority-signed credential to ${recipientProfileId}. Sent URI: ${sentBoostUri}`);
        } else {
            console.error(`Error sending boost: ${response.status}`);
            const errorDetails = await response.json();
            console.error(errorDetails);
        }
        
        return sentBoostUri;

    } catch (error: any) {
        console.error(`Error sending Boost via AWS Signing Authority: ${error.message}`);
        console.error("Ensure your Simple Signing Service is deployed on AWS, its AUTHORIZED_DIDS includes the Owner's DID, and the authority is registered with LCN.");
        throw error;
    }
}

```

## Part 6: Putting It All Together (Main Script)

```typescript
// Add this main execution block at the end of delegateIssuanceTutorial.ts

async function main() {
    console.log("--- Tutorial: Delegating Credential Issuance with AWS-Hosted SA ---");

    // --- Critical: User must fill these in ---
    if (OWNER_SEED === 'YOUR_OWNER_PROFILE_64_CHAR_HEX_SEED' || 
        YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT.includes('YOUR_AWS_API_GATEWAY_ENDPOINT')) {
        console.error("FATAL: Please update OWNER_SEED and YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT in the script with your actual values.");
        return;
    }
    const saSeedFromAwsEnv = "YOUR_SIGNING_AUTHORITY_64_CHAR_HEX_SEED"; // The SEED you set for your Lambda on AWS
    if (saSeedFromAwsEnv === 'YOUR_SIGNING_AUTHORITY_64_CHAR_HEX_SEED') {
         console.error("FATAL: Update 'saSeedFromAwsEnv' in this script with the SEED used for your AWS Lambda's environment variables!");
         return;
    }
    const recipientProfileId = 'test-aws-recipient-456'; // Replace with a real Profile ID you can check
    // --- End Critical User Input ---

    try {
        const ownerLC = await setupOwnerLearnCard(); // This will pause for user to update SA .env and redeploy
        
        // Get the DID of your AWS-hosted SA (derived from its SEED)
        const tempAuthorityLc = await initLearnCard({ seed: saSeedFromAwsEnv });
        const actualAwsAuthorityServiceDid = tempAuthorityLc.id.did();
        console.log(`Your AWS-hosted Signing Authority Service DID is expected to be: ${actualAwsAuthorityServiceDid}`);

        // Register your AWS SA with LearnCloud Network
        await registerAuthorityWithLCN(ownerLC, actualAwsAuthorityServiceDid);

        // Owner creates a Boost
        const boostUri = await createOwnerBoost(ownerLC);
        if (!boostUri) throw new Error("Boost creation failed.");

        // Owner issues the Boost via the registered AWS Signing Authority
        console.log(`\nAttempting to issue Boost to recipient: ${recipientProfileId} using AWS SA.`);
        
        await sendBoostViaAwsAuthority(ownerLC, boostUri, recipientProfileId);

        console.log("\n✅ Tutorial Potentially Complete!");
        console.log("If your AWS Simple Signing Service's CloudWatch Logs show a signing request and no errors occurred here, the delegated issuance worked.");
        console.log(`The recipient (${recipientProfileId}) should receive a credential issued by ${ownerLC.id.did()} but signed by your AWS Signing Authority (${actualAwsAuthorityServiceDid}).`);
        console.log("Check the recipient's LearnCard app (if using a real recipient ID).");

    } catch (error: any) {
        console.error("\n❌ Tutorial FAILED:", error.message);
        console.error("Full error object:", error);
    }
}

main();

```

## Running the Tutorial

1. **Deploy `simple-signing-service` to AWS (Part 1):**
   * Follow Step 1.1 to 1.4 carefully. Ensure you set the `SIGNING_SERVICE_SEED`, `MONGO_URI`, and `MONGO_DB_NAME` environment variables correctly for your Lambda function during deployment. Initially, `AUTHORIZED_DIDS` can be a placeholder.
   * Note down your deployed AWS API Gateway endpoint.
2. **Prepare `delegateIssuanceTutorial.ts` (Part 2 script):**
   * Create a new project folder, install `@learncard/init` and `@learncard/simple-signing-plugin`.
   * Save the code from Parts 2-6 into `delegateIssuanceTutorial.ts`.
   * **Crucially, update the placeholder constants at the top of the script:**
     * `OWNER_SEED` with a unique 64-char hex seed for the Owner.
     * `YOUR_AWS_SIGNING_AUTHORITY_ENDPOINT` with the actual endpoint from your AWS deployment.
     * In the `main` function, update `saSeedFromAwsEnv` with the _exact same seed_ you configured for your AWS Lambda's `SIGNING_SERVICE_SEED` environment variable.
     * Update `recipientProfileId` with a real Profile ID you can check.
3. **First Run of `delegateIssuanceTutorial.ts` (to get Owner DID):**
   * Run `npx ts-node delegateIssuanceTutorial.ts`.
   * The script will initialize `learnCardOwner` and print its DID. It will then pause, prompting you to update the AWS Lambda environment.
4. **Update AWS Lambda Environment for `simple-signing-service`:**
   * Go to the AWS Lambda console, find your deployed `simple-signing-service` function.
   * Under "Configuration" -> "Environment variables," edit `AUTHORIZED_DIDS`. Add the Owner's DID that was just printed by your script. If there are other DIDs, separate them with a space.
   * Save the Lambda environment variable changes. (This change takes effect immediately, no full redeploy needed for just env var changes via console, but a `sls deploy` is cleaner if you change `serverless.yml`).
5. **Continue `delegateIssuanceTutorial.ts`:**
   * Go back to the terminal running `delegateIssuanceTutorial.ts` and press Enter.
   * The script will now attempt the remaining steps.

## Verification & What Happened

* **AWS CloudWatch Logs:** Monitor the CloudWatch Logs for your `simple-signing-service` Lambda function. When Part 5 of the tutorial runs (`sendBoostViaAwsAuthority`), you should see logs from your Lambda indicating it received a request from the LearnCloud Network and performed a signing operation. This is the key confirmation that delegation is working through AWS.
* **`delegateIssuanceTutorial.ts` Console:** Look for success messages. Any errors here or in CloudWatch will help debug.
* **Recipient's LearnCard App:** If you used a real `recipientProfileId`, they should receive the "Community Contributor Badge (AWS Delegated)". Inspecting this credential will show it's issued by the Owner's DID, but the proof section will reference the key/DID of your AWS-hosted Signing Authority.

## Next Steps & Production Considerations

* **Security for AWS:**
  * Manage the `SIGNING_SERVICE_SEED` and `MONGO_URI` for your Lambda using secure methods like AWS Secrets Manager or Systems Manager Parameter Store, referenced in your `serverless.yml`, rather than plain text environment variables if possible.
  * Configure appropriate IAM roles and permissions for your Lambda function, granting only necessary access (e.g., to MongoDB).
  * Secure your API Gateway endpoint (e.g., with API Keys, IAM authorization, or custom authorizers if needed beyond LCN's calls).
* **`AUTHORIZED_DIDS` on AWS:** Manage this list carefully.
* **Error Handling & Logging:** Implement comprehensive logging in your AWS Lambda for easier debugging.
* **Cost & Scalability:** Be mindful of AWS Lambda, API Gateway, and any database costs. Design for scalability if you expect high volumes.

This tutorial provides a robust foundation for implementing delegated credential issuance using a self-hosted Signing Authority on AWS, enhancing the security and flexibility of your LearnCard solutions!
