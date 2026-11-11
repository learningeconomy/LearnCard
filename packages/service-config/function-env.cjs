// Tiny CommonJS helper loadable directly by Serverless v3's file-variable resolver, which
// requires a .cjs module with no build step. Empty-string env values still count toward
// Lambda's 4KB per-function environment limit, so callers emit only non-empty values.

const pickNonEmpty = (keys, env = process.env) =>
    Object.fromEntries(keys.filter(key => env[key]).map(key => [key, env[key]]));

const functionEnvironment = ({ always = [], fallback = [], env = process.env } = {}) => {
    // When a runtime secrets bundle supplies values at cold start, the fallback keys are
    // delivered through the bundle instead of the function environment, so drop them here.
    const keys = env.RUNTIME_SECRETS_ID ? always : [...always, ...fallback];
    return pickNonEmpty(keys, env);
};

module.exports = { pickNonEmpty, functionEnvironment };
