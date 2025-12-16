# Claimable Boosts

## @learncard/claimable-boosts-plugi

This plugin for LearnCard enables the creation of "Claimable Boosts," which are credentials that users can claim via a unique link or QR code. It allows external partners or systems to easily generate and distribute credentials (boosts) without needing direct interaction with the end-user's wallet initially.

### Installation

Choose your preferred package manager:

```bash
# Using npm
npm install @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin

# Using yarn
yarn add @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin

# Using pnpm
pnpm add @learncard/init @learncard/claimable-boosts-plugin @learncard/simple-signing-plugin
```

### Quickstart

This example shows the minimum setup to generate your first claimable boost link.

#### Prerequisites:

* Node.js (v14 or later) installed.
* A secure seed phrase for initializing LearnCard. Never hardcode your seed in production code. Use environment variables or a secure secrets management system. For this example, we'll use an environment variable `SECURE_SEED`.
* A unique ID for your issuer profile (e.g., `my-awesome-org-profile`).

#### Steps:

1. Create a script (e.g., `createBoost.js`):

```javascript
import { initLearnCard } from '@learncard/init';
import { getClaimableBoostsPlugin } from '@learncard/claimable-boosts-plugin';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

// Ensure you have set the SECURE_SEED environment variable
const seed = process.env.SECURE_SEED;
const profileId = 'my-awesome-org-profile'; // Choose a unique ID for your organization
const profileName = 'My Awesome Org';

if (!seed) {
  console.error('Error: SECURE_SEED environment variable is not set.');
  process.exit(1);
}

async function quickstartBoost() {
  try {
    console.log('Initializing LearnCard...');
    // 1. Initialize LearnCard with network and signing capabilities
    const learnCard = await initLearnCard({
      seed: seed,
      network: true,
      allowRemoteContexts: true
    });

    const signingLearnCard = learnCard.addPlugin(
      await getSimpleSigningPlugin(learnCard, 'https://api.learncard.app/trpc')
    );

    const claimableLearnCard = await signingLearnCard.addPlugin(
      await getClaimableBoostsPlugin(signingLearnCard)
    );
    console.log('LearnCard initialized with plugins.');

    // 2. Create an Issuer Profile (run once per profileId)
    try {
      console.log(`Creating profile "${profileId}"...`);
      await claimableLearnCard.invoke.createProfile({
        profileId: profileId,
        displayName: profileName,
        description: 'Issuing awesome credentials.',
      });
      console.log(`Profile "${profileId}" created successfully.`);
    } catch (error) {
      if (error.message?.includes('Profile ID already exists')) {
         console.log(`Profile "${profileId}" already exists, continuing.`);
      } else {
        throw new Error(`Failed to create profile: ${error.message}`);
      }
    }

    // 3. Create a Boost Template (the credential structure)
    console.log('Creating boost template...');
    const boostTemplate = await claimableLearnCard.invoke.newCredential({
      type: 'boost', 
      boostName: 'Quickstart Achievement',
      boostImage: 'https://placehold.co/400x400?text=Quickstart', // Optional placeholder image
      achievementType: 'Influencer',
      achievementName:'Quickstart Achievement',
      achievementDescription: 'Completed the quickstart guide!',
      achievementNarrative: 'User successfully ran the quickstart script.'
      achievementImage: 'https://placehold.co/400x400?text=Quickstart', // Optional placeholder image
    });
    console.log('Boost template created.');

    // 4. Create the Boost (register it on the network)
    console.log('Creating boost on the network...');
    const boostUri = await claimableLearnCard.invoke.createBoost(
      boostTemplate,
      {
        // Metadata for the boost itself
        name: boostTemplate.name,
        description: boostTemplate.achievementDescription,
        // profileId is automatically linked from the initialized LearnCard instance
      }
    );
    console.log(`Boost created with URI: ${boostUri}`);

    // 5. Generate a Claim Link
    console.log('Generating claim link...');
    const claimLink = await claimableLearnCard.invoke.generateBoostClaimLink(boostUri);
    console.log('\n✅ Success! Your Claimable Boost link is ready:');
    console.log(claimLink);

    return claimLink;

  } catch (error) {
    console.error('\n❌ Error during quickstart process:', error);
    process.exit(1);
  }
}

quickstartBoost();
```

2.  Run the script:

    Set the environment variable:

    ```bash
    export SECURE_SEED="your-very-secret-seed-phrase-here"
    # Or on Windows CMD: set SECURE_SEED="your-very-secret-seed-phrase-here"
    # Or on Windows PowerShell: $env:SECURE_SEED="your-very-secret-seed-phrase-here"
    ```

    Execute the script:

    ```bash
    node createBoost.js
    ```
3. Output: The script will print the generated claim link to your console. Anyone with this link can claim the "Quickstart Achievement" boost.
4. Next Steps: Explore the "Detailed Usage" section below for customizing claim links (e.g., setting expiry times, usage limits), generating QR codes, and understanding the process in more detail.

### Detailed Usage

This section provides a comprehensive walkthrough of creating and managing Claimable Boosts.

#### Prerequisites:

* Node.js (v14 or later)
* npm, yarn, or pnpm
* A LearnCard Network account (implied by using the plugin with `network: true`)
* A secure seed phrase for your issuer identity.

#### Setup Process

1. Import Required Plugins:

```javascript
import { initLearnCard } from '@learncard/init';
import { getClaimableBoostsPlugin } from '@learncard/claimable-boosts-plugin';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';
```

2. Initialize LearnCard: Instantiate LearnCard, enabling network features and adding necessary plugins. The seed should be kept secure and never exposed in client-side code or committed to repositories.

```javascript
const seed = process.env.SECURE_SEED; // Load from secure source

const learnCard = await initLearnCard({
  seed: seed,
  network: true,             // Enable network features
  allowRemoteContexts: true  // Required for standard credential contexts
});

// Add signing capability
const signingLearnCard = learnCard.addPlugin(
  await getSimpleSigningPlugin(learnCard, 'https://api.learncard.app/trpc') // Use the LearnCard API endpoint
);

// Add claimable boosts capability
const claimableLearnCard = await signingLearnCard.addPlugin(
  await getClaimableBoostsPlugin(signingLearnCard)
);
```

#### Creating Claimable Boosts Flow

1. Create an Issuer Profile (One-time Setup per Profile ID): Define your organization's identity on the network. The profileId must be unique.

```javascript
try {
  await claimableLearnCard.invoke.createProfile({
    profileId: 'your-unique-profile-id',   // Choose a unique identifier
    displayName: 'Your Organization Name',
    description: 'Brief description of your organization',
  });
  console.log('Profile created successfully!');
} catch (error) {
   if (error.message?.includes('Profile ID already exists')) {
       console.log('Profile already exists, proceeding.');
   } else {
       console.error('Error creating profile:', error);
       throw error; // Re-throw if it's a different error
   }
}
```

**Note**: Your initialized learnCard instance (via its seed) becomes the controller/owner of this profile ID.

2. Create a Boost Template: Define the structure and content of the credential (boost) you want to issue. This follows the W3C Verifiable Credential data model, often using specific LearnCard contexts.

```javascript
const boostTemplate = await claimableLearnCard.invoke.newCredential({
    type: 'boost', 
    boostName: 'Advanced Course Completion',
    boostImage: 'https://placehold.co/400x400?text=Course', // Optional placeholder image
    achievementType: 'Achievement',
    achievementName:'Advanced Course Completion',
    achievementDescription: 'Recognizes successful completion of the advanced curriculum.',
    achievementNarrative: 'Student must pass all modules with a score of 85% or higher.'
    achievementImage: 'https://placehold.co/400x400?text=Course', // Optional placeholder image   
});
```

**Note**: The `newCredential` method helps structure the credential but doesn't sign or issue it yet. The `issuer` field will typically be derived from your learnCard instance's DID. The `credentialSubject.id` is intentionally omitted; it will be assigned to the claimant upon claiming. [More info on creating verifiable credentials for LearnCard here](../../core-concepts/credentials-and-data/building-verifiable-credentials.md).&#x20;

3. Create the Boost: Register the boost template on the LearnCard Network, making it potentially claimable. This associates the template with your profile.

```javascript
const boostUri = await claimableLearnCard.invoke.createBoost(
  boostTemplate.credentialSubject, // Pass the credentialSubject part of the template
  {
    // Metadata associated with the boost listing itself
    name: boostTemplate.credentialSubject.name,
    description: boostTemplate.credentialSubject.achievementDescription,
    // profileId will be inferred from the initialized claimableLearnCard instance
  }
);

console.log('Boost created and registered with URI:', boostUri);
```

The returned `boostUri` is a unique identifier for this specific registered boost on the network.

4. Generate Claim Links: Create a unique URL that users can visit to claim their instance of the boost.

```javascript
const claimLink = await claimableLearnCard.invoke.generateBoostClaimLink(boostUri);
console.log('Claim Link:', claimLink);
```

#### Claim Link Options

You can customize the behavior of claim links by providing an options object:

```javascript
const claimLinkWithOptions = await claimableLearnCard.invoke.generateBoostClaimLink(
  boostUri,
  {
    ttlSeconds: 86400,  // Link expires after 24 hours (86400 seconds)
    totalUses: 50,      // Link can only be successfully claimed 50 times
  }
);

console.log('Limited Use Claim Link:', claimLinkWithOptions);
```

**Available Options:**

| Option     | Type    | Description                                                   | Default          |
| ---------- | ------- | ------------------------------------------------------------- | ---------------- |
| ttlSeconds | Integer | Number of seconds until the link expires.                     | null (no expiry) |
| totalUses  | Integer | Maximum number of times the link can be successfully claimed. | null (unlimited) |

**Use Cases for Options:**

* **Limited-time offers**: Set `ttlSeconds` for time-sensitive campaigns or events.
* **Limited quantity**: Set `totalUses` for exclusive rewards or limited-enrollment programs.
* **Unique links per user**: Set `totalUses: 1`. You would generate a unique link for each intended recipient.

#### QR Code Generation

Easily generate data suitable for QR code generation, which encodes the claim link.

```javascript
// Option 1: Generate QR code data from boost URI directly
const qrCodeData = await claimableLearnCard.invoke.generateBoostClaimQR(boostUri);
// qrCodeData is typically the claim link URL itself, ready for a QR code library

// Option 2: Generate QR code data with options
const qrCodeDataWithOptions = await claimableLearnCard.invoke.generateBoostClaimQR(
  boostUri,
  { ttlSeconds: 3600, totalUses: 1 } // QR represents a link valid for 1 hour, 1 use
);

// Use a library like 'qrcode' (npm install qrcode) to generate the image/SVG:
import QRCode from 'qrcode';

QRCode.toFile('./claim-qr-code.png', qrCodeData, (err) => {
  if (err) throw err;
  console.log('QR code saved to claim-qr-code.png');
});

QRCode.toString(qrCodeDataWithOptions, { type: 'svg' }, (err, svgString) => {
  if (err) throw err;
  console.log('QR Code SVG:\n', svgString); // Output SVG string
});
```

### Common Issues & Troubleshooting

* **"Profile ID already exists"**: This error occurs during `createProfile` if the profileId is already registered on the network. You can either choose a different unique profileId or safely ignore this error if you intend to use the existing profile (as shown in the Quickstart and Setup examples). Ensure the learnCard instance you're using is the controller of the existing profile if you intend to manage it.
* **"Invalid credential format"**: Double-check that your boostTemplate conforms to the expected structure. Refer to LearnCard documentation for specific schema requirements.
* **"Network error" / "Failed to fetch"**: Verify your internet connection. Ensure the LearnCard API endpoint (https://api.learncard.app/trpc by default) is accessible. Check for any network proxies or firewalls that might be blocking the connection.
* **"Authentication Error" / "Unauthorized"**: Ensure your seed is correct and corresponds to the DID that controls the profileId you are trying to manage (especially when creating boosts under an existing profile).
* **Seed Security**: Remember to handle your seed phrase securely using environment variables or a dedicated secrets manager. Avoid hardcoding it directly in your source code.

### Complete Example Script

This script combines all steps, including basic error handling for profile creation.

```javascript
import { initLearnCard } from '@learncard/init';
import { getClaimableBoostsPlugin } from '@learncard/claimable-boosts-plugin';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';
import QRCode from 'qrcode'; // Make sure to install: npm install qrcode

async function createClaimableBadgeFull() {
  const seed = process.env.SECURE_SEED;
  const profileId = 'my-org-profile-full';
  const profileName = 'My Full Example Org';

  if (!seed) {
    console.error('Error: SECURE_SEED environment variable is not set.');
    process.exit(1);
  }

  try {
    // 1. Initialize LearnCard
    console.log('Initializing LearnCard...');
    const learnCard = await initLearnCard({
      seed: seed,
      network: true,
      allowRemoteContexts: true
    });
    const signingLearnCard = learnCard.addPlugin(
      await getSimpleSigningPlugin(learnCard, 'https://api.learncard.app/trpc')
    );
    const claimableLearnCard = await signingLearnCard.addPlugin(
      await getClaimableBoostsPlugin(signingLearnCard)
    );
    console.log(`LearnCard Initialized. DID: ${claimableLearnCard.did}`);


    // 2. Create profile (handle if exists)
    console.log(`Attempting to create/verify profile: ${profileId}`);
    try {
      await claimableLearnCard.invoke.createProfile({
        profileId: profileId,
        displayName: profileName,
        description: 'Demonstrating the full example script'
      });
      console.log(`Profile "${profileId}" created.`);
    } catch (error) {
       if (error.message?.includes('Profile ID already exists')) {
           console.log(`Profile "${profileId}" already exists.`);
       } else {
        console.error('Error creating profile:', error);
        throw error; // Re-throw unexpected errors
       }
    }

    // 3. Create boost template
    console.log('Creating boost template...');
    const boostTemplate = await claimableLearnCard.invoke.newCredential({
        type: 'boost', 
        boostName: 'Full Example Certificate',
        boostImage: 'https://placehold.co/400x400?text=Full+Example', // Optional placeholder image
        achievementType: 'Achievement',
        achievementName:'Advanced Course Completion',
        achievementDescription: 'Awarded for running the complete example script.',
        achievementNarrative: 'Executed the full NodeJS script for claimable boosts.'
        achievementImage: 'https://placehold.co/400x400?text=Full+Example', // Optional placeholder image   
    });
    console.log('Boost template created.');

    // 4. Create boost on network
    console.log('Creating boost on network...');
    const boostUri = await claimableLearnCard.invoke.createBoost(
      boostTemplate.credentialSubject,
      {
        name: boostTemplate.credentialSubject.name,
        description: boostTemplate.credentialSubject.achievementDescription,
      }
    );
    console.log(`Boost created with URI: ${boostUri}`);

    // 5. Generate claim link with options
    console.log('Generating claim link (expires in 1 hour, 10 uses max)...');
    const claimLink = await claimableLearnCard.invoke.generateBoostClaimLink(boostUri, {
        ttlSeconds: 3600, // 1 hour
        totalUses: 10     // Max 10 claims
    });
    console.log('Share this link:', claimLink);

    // 6. Generate QR code
    console.log('Generating QR code data...');
    const qrData = await claimableLearnCard.invoke.generateBoostClaimQR(boostUri, {
        ttlSeconds: 3600,
        totalUses: 10
    }); // Use same options for consistency

    const qrFilePath = './full-example-claim-qr.png';
    await QRCode.toFile(qrFilePath, qrData);
    console.log(`QR code saved to: ${qrFilePath}`);

    return { claimLink, qrFilePath };

  } catch (error) {
    console.error('\n❌ Error in full example script:', error);
    process.exit(1); // Exit with error code
  }
}

// Run the function
createClaimableBadgeFull().then(result => {
    if(result) {
        console.log("\n✅ Full example script completed successfully.");
    }
});
```

### License

MIT © Learning Economy Foundation
