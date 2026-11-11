/**
 * Private CAs for enclave-host TLS, pinned per hostname. When a CA is pinned
 * the remote-enclave transport trusts ONLY that CA (not the system roots), and
 * nothing else in lca-api trusts it. Changing a trust anchor is a reviewed
 * code change, never an environment edit.
 *
 * Each CA is name-constrained to its single hostname; see
 * services/escrow-enclave-app/STAGING.md section 4a.
 */
const ENCLAVE_TRUST_ANCHORS: Readonly<Record<string, string>> = {
    // Staging CA, valid until 2029-09-30. SHA-256 1BB676B1B969A916497AB7386A81AEBD
    // 903469ED4B124685F43513B5FCB9E010; source: SSM
    // /learncard/escrow-enclave/staging/ca-cert in account 217358003896.
    'escrow-enclave.staging.internal': `-----BEGIN CERTIFICATE-----
MIICgTCCAgigAwIBAgIUe/8u9Uy/Y9jD4Aw+cZCIeU/yap0wCgYIKoZIzj0EAwMw
VDEkMCIGA1UECgwbTGVhcm5pbmcgRWNvbm9teSBGb3VuZGF0aW9uMSwwKgYDVQQD
DCNMZWFybkNhcmQgRXNjcm93IEVuY2xhdmUgU3RhZ2luZyBDQTAeFw0yNjEwMDEy
MTI1MDJaFw0yOTA5MzAyMTI1MDJaMFQxJDAiBgNVBAoMG0xlYXJuaW5nIEVjb25v
bXkgRm91bmRhdGlvbjEsMCoGA1UEAwwjTGVhcm5DYXJkIEVzY3JvdyBFbmNsYXZl
IFN0YWdpbmcgQ0EwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAARSwi8GmnzoqYadKw9n
gc7kOMMbimXjF5weA8YCOBhiaNHAxRcYJ0iz1nv74wYt/8x9lvwkFP4IK36i+bdH
fiu6Oo34LXi3AHBbQvL5A2c2IELil6Cea+ClWtJLfWDu7OOjgZowgZcwHwYDVR0j
BBgwFoAUybGIxOfLHqqbjDFJ1k28v4aKh4IwEgYDVR0TAQH/BAgwBgEB/wIBADAO
BgNVHQ8BAf8EBAMCAQYwMQYDVR0eAQH/BCcwJaAjMCGCH2VzY3Jvdy1lbmNsYXZl
LnN0YWdpbmcuaW50ZXJuYWwwHQYDVR0OBBYEFMmxiMTnyx6qm4wxSdZNvL+GioeC
MAoGCCqGSM49BAMDA2cAMGQCMGp/wTQLmtB6/GK6hMFaFTA27gXZcxrgJ0Uy+8C0
Ztl5uoRwN99inHNWv1cnKGdNQgIwSoQgKs8uMnBUcfiB9ZR6xb98z/9athp5pDIE
/KUv6cNmJtuCgPOJxC+4fVKl8xC3
-----END CERTIFICATE-----
`,
    // Production CA, valid until 2029-10-26. SHA-256 C017B1482D96679D6F725F8A46A52DAC
    // CE9921AB47B4FEDFDB4C814B38584859; source: SSM
    // /learncard/escrow-enclave/production/ca-cert in account 934654685669.
    'escrow-enclave.production.internal': `-----BEGIN CERTIFICATE-----
MIICaDCCAe6gAwIBAgIUCMYQNgdrxBILfOeoVNOWuZBiG1cwCgYIKoZIzj0EAwMw
VzEkMCIGA1UECgwbTGVhcm5pbmcgRWNvbm9teSBGb3VuZGF0aW9uMS8wLQYDVQQD
DCZMZWFybkNhcmQgRXNjcm93IEVuY2xhdmUgUHJvZHVjdGlvbiBDQTAeFw0yNjEw
MjcxOTE5MzBaFw0yOTEwMjYxOTE5MzBaMFcxJDAiBgNVBAoMG0xlYXJuaW5nIEVj
b25vbXkgRm91bmRhdGlvbjEvMC0GA1UEAwwmTGVhcm5DYXJkIEVzY3JvdyBFbmNs
YXZlIFByb2R1Y3Rpb24gQ0EwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAARE/z2wlD3g
oj5XyHZEJOjdffpvXHav9802AHod0h7QQP4NCLpw4Aofhx6+Qrx/le8KUGdu63V7
948yzbrvW08XL20lmd2kFkb/23589kOzaTPeE1Ngs2y08n5cAkCdxWOjezB5MBIG
A1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgEGMDQGA1UdHgEB/wQqMCig
JjAkgiJlc2Nyb3ctZW5jbGF2ZS5wcm9kdWN0aW9uLmludGVybmFsMB0GA1UdDgQW
BBTHUF7Yd+mLuA2XOthizgvTc8WW3zAKBggqhkjOPQQDAwNoADBlAjEAiFXqrpcc
nR6ttLI4EEZ5qLMMGTksNypiTa+WyiUmJCtW3o6Luj9o/wlFXsFParINAjA8zeDx
b1+05o+sCl0kQzEq1b2pN9/Xco5NQpMDfG2/BvKuSOVLhOQ1tdkZLo+uTgk=
-----END CERTIFICATE-----
`,
};

export const pinnedEnclaveCa = (baseUrl: string): string | undefined =>
    ENCLAVE_TRUST_ANCHORS[new URL(baseUrl).hostname];
