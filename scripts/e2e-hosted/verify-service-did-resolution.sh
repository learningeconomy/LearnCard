#!/usr/bin/env bash
set -Eeuo pipefail

# Run from the active Compose directory. Exercise Cloud's actual fetch runtime,
# not the host's curl or a container-network alias that bypasses did:web URLs.
docker compose exec -T cloud bun -e '
    const url = "http://localhost:4000/.well-known/did.json";
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (response.status !== 200) {
        throw new Error(`Cloud DID fetch returned HTTP ${response.status}`);
    }
    const document = await response.json();
    if (document.id !== "did:web:localhost%3A4000") {
        throw new Error(`Cloud fetched an unexpected DID document: ${document.id}`);
    }
    console.log(`Cloud host-gateway DID fetch: HTTP ${response.status}, ${document.id}`);
'
