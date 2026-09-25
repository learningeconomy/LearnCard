/* global __ENV */
import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const host = __ENV.HOST || 'auth.staging.learncard.app';
if (!/^[a-zA-Z0-9.-]+(:[0-9]+)?$/.test(host)) throw new Error('HOST must be a hostname');
const base = `https://${host}/realms/${encodeURIComponent(__ENV.REALM || 'learncard')}`;
const seconds = Number(__ENV.DURATION_SECONDS || 600);
if (!Number.isInteger(seconds) || seconds < 10 || seconds > 3600)
    throw new Error('DURATION_SECONDS must be 10..3600');
const refreshEnabled = Boolean(__ENV.REFRESH_TOKEN && __ENV.CLIENT_ID);
if (Boolean(__ENV.REFRESH_TOKEN) !== Boolean(__ENV.CLIENT_ID))
    throw new Error('Set both REFRESH_TOKEN and CLIENT_ID');
let refreshToken = __ENV.REFRESH_TOKEN;
const failures = new Counter('non_2xx');
const requests = new Counter('probe_requests');
const failureRate = new Rate('probe_failure_rate');
const thresholds = {};
for (let window = 0; window < Math.ceil(seconds / 10); window += 1) {
    thresholds[`non_2xx{window:${window}}`] = ['count>=0'];
    thresholds[`probe_requests{window:${window}}`] = ['count>=0'];
    thresholds[`probe_failure_rate{window:${window}}`] = ['rate<=0.01'];
}

export const options = {
    scenarios: {
        discovery: {
            executor: 'constant-arrival-rate',
            exec: 'discovery',
            rate: 5,
            timeUnit: '1s',
            duration: `${seconds}s`,
            preAllocatedVUs: 10,
            maxVUs: 30,
        },
        ...(refreshEnabled
            ? {
                  refresh: {
                      executor: 'constant-vus',
                      exec: 'refresh',
                      vus: 1,
                      duration: `${seconds}s`,
                  },
              }
            : {}),
    },
    thresholds,
};

const measure = (response, flow) => {
    const window = Math.floor(exec.instance.currentTestRunDuration / 10000);
    const tags = { window: String(window), flow };
    const failed = response.status < 200 || response.status >= 300;
    requests.add(1, tags);
    failures.add(failed ? 1 : 0, tags);
    failureRate.add(failed, tags);
};

export const discovery = () => {
    measure(
        http.get(`${base}/.well-known/openid-configuration`, { timeout: '10s', redirects: 0 }),
        'discovery'
    );
};

export const refresh = () => {
    const started = Date.now();
    const response = http.post(
        `${base}/protocol/openid-connect/token`,
        {
            grant_type: 'refresh_token',
            client_id: __ENV.CLIENT_ID,
            refresh_token: refreshToken,
            ...(__ENV.CLIENT_SECRET ? { client_secret: __ENV.CLIENT_SECRET } : {}),
        },
        { timeout: '10s', redirects: 0 }
    );
    measure(response, 'refresh');
    if (response.status === 200) {
        const tokens = response.json();
        if (tokens.refresh_token) refreshToken = tokens.refresh_token;
    }
    // A single refresh VU owns the rotating token; no concurrent token reuse.
    sleep(Math.max(0, 0.2 - (Date.now() - started) / 1000));
};

export const handleSummary = data => {
    const windows = [];
    for (let window = 0; window < Math.ceil(seconds / 10); window += 1) {
        windows.push({
            startSeconds: window * 10,
            requests: data.metrics[`probe_requests{window:${window}}`]?.values.count ?? 0,
            non2xx: data.metrics[`non_2xx{window:${window}}`]?.values.count ?? 0,
            failureRate: data.metrics[`probe_failure_rate{window:${window}}`]?.values.rate ?? 0,
        });
    }
    return { stdout: `${JSON.stringify({ refreshEnabled, windows }, null, 2)}\n` };
};
