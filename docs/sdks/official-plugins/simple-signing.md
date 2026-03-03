# Simple Signing

To learn more, check out our [Core Concepts page on Signing Authorities](../../core-concepts/identities-and-keys/signing-authorities.md). Or, check out our guide for [deploying your own Signing Authority ](../../how-to-guides/deploy-infrastructure/signing-authority.md)using the Simple Signing Plugin.

## Example Usage

<pre class="language-typescript"><code class="lang-typescript">// Make sure to pnpm install @learncard/simple-signing-plugin
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';

const SIGNING_AUTHORITY_NAME = 'My-First-Signing-Authority'
const SIGNING_AUTHORITY_ENDPOINT = 'https://api.learncard.app/trpc'

const LEARN_CLOUD_NETWORK_ENDPOINT = 'https://network.learncard.com/trpc'

const learnCard = await initLearnCard({ seed: 'secure-seed-phrase', network: LCN_NETWORK_ENDPOINT } )

// Add signing plugin to your learnCard
const signingLearnCard = await learnCard.addPlugin(
  await getSimpleSigningPlugin(learnCard, SIGNING_AUTHORITY_ENDPOINT))
);

// Create signing authority endpoint with LearnCard App
const signingAuthority = await signingLearnCard.invoke.createSigningAuthority(SIGNING_AUTHORITY_NAME);
<strong>
</strong>// register signing authority with LearnCloud Network
const registeredSigningAuthority = await signingLearnCard2.invoke.registerSigningAuthority(
  signingAuthority.endpoint,
  SIGNING_AUTHORITY_NAME,
  signingAuthority.did
);
</code></pre>
