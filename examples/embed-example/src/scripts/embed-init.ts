import { init } from '@learncard/embed-sdk';

function getCredentialName(): string {
  const el = document.getElementById('claim-target');
  if (!el) return 'Credential';
  const name = (el as HTMLElement).dataset.credentialName;
  return name && name.length > 0 ? name : 'Credential';
}

function main(): void {
  const partner = 'pk_254a8087-e823-45b6-b76f-cfcc2ef6b657';
  const partnerName = 'Acme Academy';
  const credentialName = getCredentialName();
  const credentialType = "Developer"
  const credentialDescription = "What you learned: 1) Decentralized identity (DID) concepts\n2) Verifiable Credentials (VCs) fundamentals\n3) Wallets, attestations, and trust flows\n4) Using LearnCard to claim and manage credentials"
  const credentialNarrative = "Successfully completed the Intro to Web3 course at Acme Academy."

  const credential = {"@context":["https://www.w3.org/ns/credentials/v2","https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json","https://ctx.learncard.com/boosts/1.0.1.json"],"type":["VerifiableCredential","OpenBadgeCredential","BoostCredential"],"id":"urn:uuid:857c9b52-29d8-4b0e-95d9-7812b6959452","issuer":{"id":"did:key:z6MksfiRabqCWK3TiAAm4J3APB9ATkK3b9g6Yygu6Qx7tzZK"},"validFrom":"2025-09-10T19:49:11.208Z","name": credentialName,"credentialSubject":{"id":"did:example:d23dd687a7dc6787646f2eb98d0","type":["AchievementSubject"],"achievement":{"id":"urn:uuid:39d226d4-5f63-48b8-8f23-5389a5bd37cf","type":["Achievement"],"achievementType":credentialType,"name":credentialName,"description":credentialDescription,"image":"","criteria":{"narrative":credentialNarrative}}},"groupID":""}

  init({
    publishableKey: partner,
    apiBaseUrl: 'http://localhost:4000/api',
    partnerName,
    target: '#claim-target',
    credential,
    requestBackgroundIssuance: true,
    branding: {
      primaryColor: '#1F51FF',
      accentColor: '#0F3BD9',
      partnerLogoUrl: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4',
    },
    onSuccess: () => {
      const el = document.getElementById('success-msg');
      if (el) el.classList.add('show');
    },
  });
}

window.addEventListener('DOMContentLoaded', main);
