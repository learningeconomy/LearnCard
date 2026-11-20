import {
    collectAccountContinuityWarnings,
    collectClassLinkConfigProblems,
} from '../src/helpers/classlinkConfigValidation';

const problems = collectClassLinkConfigProblems(process.env);
// Warnings never fail the check.
for (const warning of collectAccountContinuityWarnings(process.env))
    console.warn(`Warning: ${warning}`);
if (problems.length) {
    for (const problem of problems) console.error(problem);
    process.exitCode = 1;
} else {
    console.log(
        process.env.CLASSLINK_TENANTS?.trim()
            ? 'ClassLink configuration is valid'
            : 'ClassLink not configured'
    );
}
