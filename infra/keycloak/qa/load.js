/**
 * K6 load test for Keycloak.
 * Includes burst scenario (500 req/min) for WAF testing.
 *
 * Usage:
 *   k6 run infra/keycloak/qa/load.js -e HOST=auth.staging.learncard.app
 *   k6 run infra/keycloak/qa/load.js -e HOST=auth.staging.learncard.app --scenario burst
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
const tokenErrors = new Counter('token_errors');
const tokenDuration = new Trend('token_duration');

export const options = {
    scenarios: {
        default: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            stages: [
                { duration: '1m', target: 50 }, // Ramp to 50 req/s
                { duration: '3m', target: 50 }, // Hold
                { duration: '1m', target: 0 }, // Ramp down
            ],
        },
        burst: {
            executor: 'constant-arrival-rate',
            rate: 500,
            timeUnit: '1m',
            duration: '2m',
            preAllocatedVUs: 10,
            maxVUs: 50,
        },
    },
    thresholds: {
        'token_errors': ['count < 100'],
    },
};

/**
 * Attempt token endpoint (password grant with invalid creds).
 * Simulates login attempts.
 */
function attemptToken() {
    const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
    const payload = {
        grant_type: 'password',
        client_id: 'learncard-app',
        username: 'testuser',
        password: 'wrongpassword',
    };

    const res = http.post(tokenUrl, payload, { timeout: '10s' });

    // Expect 401 (invalid creds) or 400 (bad request); anything else is an error.
    const success = check(res, {
        'token response': r => r.status === 400 || r.status === 401,
    });

    tokenDuration.add(res.timings.duration);
    if (!success) {
        tokenErrors.add(1);
    }
}

/**
 * Main VU function.
 */
export default function () {
    attemptToken();
    sleep(0.1);
}
