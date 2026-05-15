import { deriveClientIdPrefix } from './src/vp/client-id-prefix.ts';

const result1 = deriveClientIdPrefix('decentralized_identifier:did:jwk:eyJjcnYiOiJFZDI1NTE5IiwieCI6IkdDSlVDZC1yaDIxakZETGRpelY1SUxIX2ZveWVRd3lyQURYZHAtbnVNT1EiLCJrdHkiOiJPS1AifQ', undefined);
console.log('URL form:', JSON.stringify(result1));

const result2 = deriveClientIdPrefix('did:jwk:eyJjcnYiOiJFZDI1NTE5IiwieCI6IkdDSlVDZC1yaDIxakZETGRpelY1SUxIX2ZveWVRd3lyQURYZHAtbnVNT1EiLCJrdHkiOiJPS1AifQ', undefined);
console.log('Signed form:', JSON.stringify(result2));

console.log('Match?', result1.value === result2.value);
