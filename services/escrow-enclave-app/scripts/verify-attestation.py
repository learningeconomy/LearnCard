#!/usr/bin/env python3
"""Verify an escrow enclave /v1/attest response and print the attested ledger key.

Everything in the response except `document` is relayed by the untrusted host;
only the NSM document, verified here, is evidence. Checks: certificate chain from
the pinned AWS Nitro root, COSE_Sign1 ES384 signature, caller-chosen nonce, and
PCR0-2 against a CI `escrow-measurements.json`.

    pip install cbor2 cryptography
    curl -fsSo root.zip https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip
    unzip root.zip   # -> root.pem
    verify-attestation.py attest.json <nonce-hex> escrow-measurements.json root.pem
"""
import base64
import datetime
import json
import sys

import cbor2
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature

# Published in the AWS Nitro Enclaves "Verifying the root of trust" documentation.
AWS_NITRO_ROOT_G1_SHA256 = "641a0321a3e244efe456463195d606317ed7cdcc3c1756e09893f3c68f79bb5b"


def fail(message: str) -> None:
    sys.exit(f"FAIL: {message}")


def main(response_path: str, nonce_hex: str, measurements_path: str, root_path: str) -> None:
    response = json.load(open(response_path))
    measurements = json.load(open(measurements_path))
    root = x509.load_pem_x509_certificate(open(root_path, "rb").read())
    if root.fingerprint(hashes.SHA256()).hex() != AWS_NITRO_ROOT_G1_SHA256:
        fail("root.pem is not the AWS Nitro Enclaves Root-G1 certificate")

    document = cbor2.loads(base64.b64decode(response["document"]))
    if isinstance(document, cbor2.CBORTag):
        document = document.value
    protected, _unprotected, payload_bytes, signature = document
    if cbor2.loads(protected) != {1: -35}:
        fail("COSE algorithm is not ES384")
    payload = cbor2.loads(payload_bytes)

    chain = [x509.load_der_x509_certificate(c) for c in payload["cabundle"]]
    chain.append(x509.load_der_x509_certificate(payload["certificate"]))
    if chain[0].fingerprint(hashes.SHA256()) != root.fingerprint(hashes.SHA256()):
        fail("cabundle does not start at the pinned root")
    attested_at = datetime.datetime.fromtimestamp(payload["timestamp"] / 1000, datetime.timezone.utc)
    for issuer, cert in zip(chain, chain[1:]):
        if cert.issuer != issuer.subject:
            fail("certificate chain is not contiguous")
        issuer.public_key().verify(
            cert.signature, cert.tbs_certificate_bytes, ec.ECDSA(cert.signature_hash_algorithm)
        )
        if not cert.not_valid_before_utc <= attested_at <= cert.not_valid_after_utc:
            fail("a chain certificate was not valid at attestation time")

    to_be_signed = cbor2.dumps(["Signature1", protected, b"", payload_bytes])
    r, s = int.from_bytes(signature[:48], "big"), int.from_bytes(signature[48:], "big")
    chain[-1].public_key().verify(encode_dss_signature(r, s), to_be_signed, ec.ECDSA(hashes.SHA384()))

    if payload["digest"] != "SHA384":
        fail("unexpected PCR digest")
    if payload["nonce"] != bytes.fromhex(nonce_hex):
        fail("nonce mismatch (replayed or substituted document)")
    for index in range(3):
        if payload["pcrs"][index].hex() != measurements[f"pcr{index}"].lower():
            fail(f"PCR{index} does not match {measurements_path}")

    ledger_key = payload["public_key"]
    if ledger_key is None or len(ledger_key) != 65 or ledger_key[0] != 4:
        fail("public_key is not an uncompressed P-256 point")
    ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), ledger_key)

    print(f"OK  {payload['module_id']} attested {attested_at.isoformat()}")
    print(f"keyId (host-relayed, bound in user_data): {response.get('keyId')}")
    print(f"ledger public key: {ledger_key.hex()}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
