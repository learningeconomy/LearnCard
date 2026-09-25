/**
 * K6 discovery probe for Keycloak health checks.
 * Loops .well-known/openid-configuration and refresh-token grant at 5 rps.
 * Reports non-2xx counts per 10s window.
 *
 * Usage: k6 run infra/keycloak/qa/probe.js -e HOST=auth.staging.learncard.app
 */

/* eslint-disable no-undef */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const host = __ENV.HOST || 'auth.staging.learncard.app';
const protocol = 'https';
const baseUrl = `${protocol}://${host}`;
const realm = 'learncard';

// Metrics
const wellKnownErrors = new Counter('well_known_errors');
const refreshErrors = new Counter('refresh_errors');
const wellKnownDuration = new Trend('well_known_duration');
const refreshDuration = new Trend('refresh_duration');

export const options = {
    stages: [
        { duration: '30s', target: 5 }, // Ramp to 5 rps
        { duration: '5m', target: 5 }, // Hold at 5 rps
        { duration: '30s', target: 0 }, // Ramp down
    ],
    thresholds: {
        'well_known_errors': ['count < 5'],
        'refresh_errors': ['count < 5'],
    },
};

/**
 * Fetch JWKS discovery document.
 */
function probeWellKnown() {
    const url = `${baseUrl}/realms/${realm}/.well-known/openid-configuration`;
    const res = http.get(url, { timeout: '10s' });

    const success = check(res, {
        'well-known 200': r => r.status === 200,
        'well-known has issuer': r => r.json('issuer') !== undefined,
    });

    wellKnownDuration.add(res.timings.duration);
    if (!success) {
        wellKnownErrors.add(1);
    }

    return res.json('issuer');
}

/**
 * Attempt refresh-token grant (synthetic user).
 * Requires a pre-existing refresh token or uses a dummy for error testing.
 */
function probeRefresh(issuer) {
    const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
    const payload = {
        grant_type: 'refresh_token',
        client_id: 'learncard-app',
        refresh_token: 'dummy-token-for-probe',
    };

    const res = http.post(tokenUrl, payload, { timeout: '10s' });

    // Expect 400 (invalid token) or 200 (if token valid); anything else is an error.
    const success = check(res, {
        'refresh response': r => r.status === 200 || r.status === 400,
    });

    refreshDuration.add(res.timings.duration);
    if (!success) {
        refreshErrors.add(1);
    }
}

/**
 * Main VU function: probe every 200ms (5 rps).
 */
export default function () {
    const issuer = probeWellKnown();
    probeRefresh(issuer);
    sleep(0.2); // 200ms = 5 rps
}
