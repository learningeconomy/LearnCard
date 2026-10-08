/* global __ENV, __VU */
import http from 'k6/http';
import { Counter, Rate } from 'k6/metrics';

const host = __ENV.HOST || 'auth.staging.learncard.app';
if (host !== 'auth.staging.learncard.app' || __ENV.CONFIRM_STAGING_LOAD !== 'true') {
    throw new Error('Load is staging-only: set CONFIRM_STAGING_LOAD=true and use the staging host');
}
const scenario = __ENV.SCENARIO || 'capacity';
if (!['capacity', 'burst'].includes(scenario))
    throw new Error('SCENARIO must be capacity or burst');
const tokens = __ENV.REFRESH_TOKENS ? JSON.parse(__ENV.REFRESH_TOKENS) : [];
const vus = Number(__ENV.VUS || 10);
const rate = Number(__ENV.RATE || 30);
if (!Number.isInteger(vus) || vus < 1 || vus > 100 || !Number.isFinite(rate) || rate <= 0)
    throw new Error('Invalid VUS/RATE');
if (
    scenario === 'capacity' &&
    (!__ENV.CLIENT_ID ||
        !Array.isArray(tokens) ||
        tokens.length < vus ||
        tokens.some(token => typeof token !== 'string' || !token))
) {
    throw new Error(
        'Capacity load requires CLIENT_ID and REFRESH_TOKENS JSON array with one independent session per VU'
    );
}
let refreshToken;
const statuses = new Counter('token_status');
const failures = new Rate('capacity_failures');
export const options = {
    scenarios:
        scenario === 'burst'
            ? {
                  burst: {
                      executor: 'constant-arrival-rate',
                      rate: 500,
                      timeUnit: '1m',
                      duration: __ENV.DURATION || '5m',
                      preAllocatedVUs: vus,
                      maxVUs: vus,
                  },
              }
            : {
                  capacity: {
                      executor: 'ramping-arrival-rate',
                      startRate: 1,
                      timeUnit: '1s',
                      preAllocatedVUs: vus,
                      maxVUs: vus,
                      stages: [
                          { duration: '1m', target: rate },
                          { duration: __ENV.DURATION || '20m', target: rate },
                          { duration: '30s', target: 0 },
                      ],
                  },
              },
    thresholds:
        scenario === 'capacity'
            ? { capacity_failures: ['rate<0.01'], dropped_iterations: ['count==0'] }
            : {},
};

export default function load() {
    if (!refreshToken) refreshToken = tokens[__VU - 1];
    // Burst intentionally generates invalid refresh traffic, not password grants.
    // Capacity uses valid, independent synthetic sessions and rotates each token.
    const response = http.post(
        `https://${host}/realms/${encodeURIComponent(__ENV.REALM || 'learncard')}/protocol/openid-connect/token`,
        {
            grant_type: 'refresh_token',
            client_id: __ENV.CLIENT_ID || 'learncard-app',
            refresh_token: scenario === 'burst' ? 'synthetic-invalid-token' : refreshToken,
            ...(__ENV.CLIENT_SECRET ? { client_secret: __ENV.CLIENT_SECRET } : {}),
        },
        { timeout: '10s', redirects: 0 }
    );
    statuses.add(1, { status: String(response.status) });
    if (scenario === 'capacity') {
        let valid = false;
        if (response.status === 200) {
            try {
                const data = response.json();
                valid =
                    typeof data.access_token === 'string' &&
                    data.access_token.length > 0 &&
                    typeof data.refresh_token === 'string' &&
                    data.refresh_token.length > 0;
                if (valid) refreshToken = data.refresh_token;
            } catch {
                valid = false;
            }
        }
        failures.add(!valid);
    }
}
