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
};

export const pinnedEnclaveCa = (baseUrl: string): string | undefined =>
    ENCLAVE_TRUST_ANCHORS[new URL(baseUrl).hostname];
