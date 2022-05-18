/// <reference path="./lib/index.d.ts" />

export { VCPlugin } from './vc';

// DIDKIT
// const testKP = didkit.generateEd25519Key();
// const testDid = didkit.keyToDID('key', testKp);
// const verMeth = await didkit.keyToVerificationMethod('key', testKp);
// const unsignedCred = `{
//     "@context": "https://www.w3.org/2018/credentials/v1",
//     "id": "http://example.org/credentials/3731",
//     "type": ["VerifiableCredential"],
//     "issuer": "${testDid}",
//     "issuanceDate": "2020-08-19T21:41:50Z",
//     "credentialSubject": {
//     "id": "did:example:d23dd687a7dc6787646f2eb98d0"
// }`;
// const options = JSON.stringify({ verificationMethod: verMeth, proofPurpose: "assertionMethod", proofFormat: 'ldp' })
// const issuedCred = await didkit.issueCredential(unsignedCred, options, testKp);
// didkit.verifyCredential(issuedCred, options);
// const unsignedVP = `{
//     "@context": ["https://www.w3.org/2018/credentials/v1"],
//     "id": "http://example.org/presentations/3731",
//     "type": ["VerifiablePresentation"],
//     "holder": "${testDid}",
//     "verifiableCredential": ${issuedCred}
// }`;
// const issuedVP = await didkit.issuePresentation(unsignedVP, options, testKp);
// didkit.verifyPresentation(issuedVP, options);
