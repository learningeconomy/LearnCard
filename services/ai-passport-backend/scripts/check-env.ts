// Prints why the backend environment is invalid. The entrypoints only log
// `service_start_failed` (privacy logging policy), so run this to see the fixes.
// Every problem is reported in one pass. Messages name variables and echo
// provider, region and model values, never keys.
import { BackendEnvironmentError, validateBackendEnvironment } from '../src/constants/env';

try {
    const config = validateBackendEnvironment();
    console.log(
        `Backend environment OK (LLM_PROVIDER=${config.llm}, EMBEDDINGS_PROVIDER=${config.embeddings}, privacy guardrail ${config.privacyGuardrailBypass ? 'BYPASSED' : 'on'})`
    );
} catch (error) {
    console.error(
        error instanceof BackendEnvironmentError ? error.message : 'Environment check failed'
    );
    process.exit(1);
}
