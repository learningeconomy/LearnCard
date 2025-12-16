---
description: >-
  Converting QR codes into Verifiable Presentations <> Verifiable Presentations
  into QR codes.
---

# VPQR

### Overview

When interacting with Verifiable Presentations, it is often useful to use QR codes.

For converting VPs to QRs, and vice versa, LearnCard leverages an open-source library from Digital Bazaar, [VPQR](https://github.com/digitalbazaar/vpqr):

> An isomorphic JS (for Node.js and browser) library that takes a Verifiable Presentation, compresses it via CBOR-LD, and turns it into a QR Code.

There are several advantages to the VPQR approach:

* **Base-64 Image:** for locally generated, transient QR codes.
* **CBOR-LD Compression**: because VPs are JSON-LD, they can often be bloated with context files; VPQR handles compressing/expanding JSON-LD files for minimal QR data footprint.

### Installation

```bash
pnpm i @learncard/vpqr-plugin
```

### Use Cases

There are many use cases for converting between VPs & QR codes.

* Issuing a Verifiable Credential to a subject: for example, check out the [LearnCard Discord Bot](/broken/pages/zvbXkp09KmqvTsAb3B3y), which sends a QR code as an attachment to an issued credential in a Discord message, allowing receivers to scan and claim the credential from any interoperable wallet.
* `//TODO: more examples`

### How to Convert a Verifiable Presentation into a QR code:

```typescript
    /**
     * Returns a QR-embeddable data string from a VP
     */
    VPtoQrCode: (vp: VP) => Promise<string>;
```

For example, open up the [`learn-card-cli`](../learncard-cli.md):thumbsup: and create a test Verifiable Presentation:

```typescript
const vp = await learnCard.getTestVp();
```

Then, generate a QR code of the VP:

```typescript
const qrImage = await learnCard.VPtoQrCode(vp);
// qrImage = 'data:image/gif;base64,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'
```

{% hint style="info" %}
New to Base64 images? Learn more [here](https://www.base64encoder.io/learn/).
{% endhint %}

Then, the `qrImage` can be embedded in HTML like so:

```markup
<img src="data:image/gif;base64,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" 
    alt="Test VP Embedded in QR Code" />
```

<figure><img src="../../.gitbook/assets/Screen Shot 2022-08-22 at 5.52.10 PM.png" alt="Test VP Embedded in QR Code"><figcaption><p>Go ahead! Scan the QR code!</p></figcaption></figure>

If you scan the QR code, you will get the following text:

```
VP1-B3ECQDJABQEIRQ5MBDBXBQ6ECDECACWBC5UA6UIU5YZY6FFIVGNU3ZTNM2TIC5WTH3N4HK26LJ2MHJZ2F5ODT35YYPSTQDAIRDBYIEALYDRSXQYLNOBWGKLTPOJTS6Y3SMVSGK3TUNFQWY4ZPGM3TGMIYOKSRQ5AYNAMJVAQ2MMB7J3QZAKKRRIDYSBSXSSTIMJDWG2KPNFFEMWSFKJKFCU2JONEW2TTZMFMFC2KPNRZWSWLKLEYES3BQONEW2SJSJZBUSNS2NVDHGYZSKY4S4LTXJF5DOM3JMIZVG3CWLBUE44LIGZKXG6KGMIWWC3SHMY4DO5DQIVGXUNSQNUYVO5CFGQ3VAVDCO5LWSYKKKRSFMNSOOVXEQZLJMVYVUT2FGRES2MKGJIZTE4CBIRDUO3TZMRBXCQLHDCSBRKQYVCBRSBABLARO2APKEKO4M4PCSUKTG2N4ZWWNJUBO3JT5W6DVNPFU5GDU45C6XBZ565MCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3RQ5MBDBWBRAVBDBYHQJ3ENFSDUZLYMFWXA3DFHJSDEM3EMQ3DQN3BG5SGGNRXHA3TMNBWMYZGKYRZHBSDAGEIDJPT3HE6DCGIEGIEAFMCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3Q
```

Check out the [next section](vpqr.md#retrieve-a-verifiable-presentation-from-a-qr-code) for decoding this back into a Verifiable Presentation!&#x20;

### How to Retrieve a Verifiable Presentation from a QR code:

```typescript
    /**
     * Returns a VP from a QR code string.
     */
    VPfromQrCode: (text: string) => Promise<VP>;
```

If you followed the steps in the previous section, to generate a QR code from a Verifiable Presentation, you should be able to scan a QR code and read a string like this:

```
VP1-B3ECQDJABQEIRQ5MBDBXBQ6ECDECACWBC5UA6UIU5YZY6FFIVGNU3ZTNM2TIC5WTH3N4HK26LJ2MHJZ2F5ODT35YYPSTQDAIRDBYIEALYDRSXQYLNOBWGKLTPOJTS6Y3SMVSGK3TUNFQWY4ZPGM3TGMIYOKSRQ5AYNAMJVAQ2MMB7J3QZAKKRRIDYSBSXSSTIMJDWG2KPNFFEMWSFKJKFCU2JONEW2TTZMFMFC2KPNRZWSWLKLEYES3BQONEW2SJSJZBUSNS2NVDHGYZSKY4S4LTXJF5DOM3JMIZVG3CWLBUE44LIGZKXG6KGMIWWC3SHMY4DO5DQIVGXUNSQNUYVO5CFGQ3VAVDCO5LWSYKKKRSFMNSOOVXEQZLJMVYVUT2FGRES2MKGJIZTE4CBIRDUO3TZMRBXCQLHDCSBRKQYVCBRSBABLARO2APKEKO4M4PCSUKTG2N4ZWWNJUBO3JT5W6DVNPFU5GDU45C6XBZ565MCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3RQ5MBDBWBRAVBDBYHQJ3ENFSDUZLYMFWXA3DFHJSDEM3EMQ3DQN3BG5SGGNRXHA3TMNBWMYZGKYRZHBSDAGEIDJPT3HE6DCGIEGIEAFMCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3Q
```

Open up the [`learn-card-cli`](../learncard-cli.md) , and let's decode the Verifiable Presentation:

```typescript
const qrText = 'VP1-B3ECQDJABQEIRQ5MBDBXBQ6ECDECACWBC5UA6UIU5YZY6FFIVGNU3ZTNM2TIC5WTH3N4HK26LJ2MHJZ2F5ODT35YYPSTQDAIRDBYIEALYDRSXQYLNOBWGKLTPOJTS6Y3SMVSGK3TUNFQWY4ZPGM3TGMIYOKSRQ5AYNAMJVAQ2MMB7J3QZAKKRRIDYSBSXSSTIMJDWG2KPNFFEMWSFKJKFCU2JONEW2TTZMFMFC2KPNRZWSWLKLEYES3BQONEW2SJSJZBUSNS2NVDHGYZSKY4S4LTXJF5DOM3JMIZVG3CWLBUE44LIGZKXG6KGMIWWC3SHMY4DO5DQIVGXUNSQNUYVO5CFGQ3VAVDCO5LWSYKKKRSFMNSOOVXEQZLJMVYVUT2FGRES2MKGJIZTE4CBIRDUO3TZMRBXCQLHDCSBRKQYVCBRSBABLARO2APKEKO4M4PCSUKTG2N4ZWWNJUBO3JT5W6DVNPFU5GDU45C6XBZ565MCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3RQ5MBDBWBRAVBDBYHQJ3ENFSDUZLYMFWXA3DFHJSDEM3EMQ3DQN3BG5SGGNRXHA3TMNBWMYZGKYRZHBSDAGEIDJPT3HE6DCGIEGIEAFMCF3IB5IRJ3RTR4KKRKM3JXTG2ZVGQF3NGPW3YOVV4WTUYOTTUL24HHX3Q'
await learnCard.VPfromQrCode(qrText)
/**
{
  '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
  type: [ 'VerifiablePresentation' ],
  holder: 'did:key:z6MkvDE4XTatmwifvA8pUiVsqEHrqfVCGM4WG4nXbrJ5ijVp',
  verifiableCredential: {
    '@context': [ 'https://www.w3.org/2018/credentials/v1' ],
    type: [ 'VerifiableCredential' ],
    credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
    id: 'http://example.org/credentials/3731',
    issuanceDate: '2020-08-19T21:41:50Z',
    issuer: 'did:key:z6MkvDE4XTatmwifvA8pUiVsqEHrqfVCGM4WG4nXbrJ5ijVp',
    proof: {
      type: 'Ed25519Signature2018',
      created: '2022-08-22T21:28:14.661Z',
      jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..wIz73ib3SlVXhNqh6UsyFb-anGf87tpEMz6Pm1WtE47PTbwWiaJTdV6NunHeieqZOE4I-1FJ32pADGGnydCqAg',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:key:z6MkvDE4XTatmwifvA8pUiVsqEHrqfVCGM4WG4nXbrJ5ijVp#z6MkvDE4XTatmwifvA8pUiVsqEHrqfVCGM4WG4nXbrJ5ijVp'
    }
  }
}
*/
```

**Voila!** :tada: You've successfully read the Verifiable Presentation from the QR Code!
