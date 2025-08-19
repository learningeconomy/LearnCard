import { init } from '@learncard/embed-sdk';

function getCredentialName(): string {
  const el = document.getElementById('claim-target');
  if (!el) return 'Credential';
  const name = (el as HTMLElement).dataset.credentialName;
  return name && name.length > 0 ? name : 'Credential';
}

function main(): void {
  const partner = 'acme-academy';
  const partnerName = 'Acme Academy';
  const credentialName = getCredentialName();

  init({
    partnerId: partner,
    partnerName,
    target: '#claim-target',
    credential: { name: credentialName },
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
