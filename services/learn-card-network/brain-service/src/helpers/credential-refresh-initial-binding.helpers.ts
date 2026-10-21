type Neo4jConstraintError = {
    code?: unknown;
    message?: unknown;
};

/** True only for the version-key collision produced by a concurrent initial bind. */
export const isInitialRefreshVersionUniquenessRace = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return false;

    const { code, message } = error as Neo4jConstraintError;

    if (
        code !== 'Neo.ClientError.Schema.ConstraintValidationFailed' ||
        typeof message !== 'string'
    ) {
        return false;
    }

    return (
        message.includes('refreshVersionKey') ||
        message.includes('credential_refresh_version_key_unique')
    );
};
