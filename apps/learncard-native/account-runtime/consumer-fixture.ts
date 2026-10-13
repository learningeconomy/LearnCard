import { PartnerConnect } from '../../../packages/learn-card-partner-connect-sdk/src/index';
// Uses the real partner client. Only synthetic account services answer this fixture.
const client = new PartnerConnect({ mock: false, requestTimeout: 5000 });
const status = document.querySelector('#status')!;
const show = (value: string) => {
    status.textContent = value;
};
document.querySelector('#identity')!.addEventListener('click', async () => {
    try {
        const reply = await client.requestIdentity();
        show(
            reply.user.did === 'did:example:native-sample'
                ? 'Identity connected'
                : 'Unexpected identity'
        );
    } catch {
        show('Identity declined');
    }
});
document.querySelector('#consent')!.addEventListener('click', async () => {
    try {
        const reply = await client.requestConsent();
        show(reply.granted ? 'Access agreed' : 'Access declined');
    } catch {
        show('Access declined');
    }
});
document.querySelector('#unsupported')!.addEventListener('click', async () => {
    try {
        await client.askCredentialSpecific('sample-credential');
        show('Unexpected success');
    } catch {
        show('Unsupported request rejected');
    }
});
client
    .getSyncStatus()
    .then(reply => show(reply.status === 'ready' ? 'Partner SDK connected' : 'Collection syncing'))
    .catch(() => show('Connection failed'));
