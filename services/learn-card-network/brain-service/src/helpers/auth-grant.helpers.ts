import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

export const userHasRequiredScopes = (userScope: string, requiredScope: string): boolean => {
    if (userScope === AUTH_GRANT_FULL_ACCESS_SCOPE) return true;

    const requiredScopes = requiredScope.split(' ');
    const userScopes = userScope.split(' ');

    // Check if user has any of the required scopes
    return requiredScopes.some(requiredScope => {
        // Direct match
        if (userScopes.includes(requiredScope)) {
            return true;
        }

        // Check for wildcard matches
        const [requiredResource, requiredAction] = requiredScope.split(':');

        return userScopes.some(scope => {
            const [resource, action] = scope.split(':');

            // Check for full wildcard "*:*"
            if (resource === '*' && action === '*') {
                return true;
            }

            // Check for action wildcard "resource:*"
            if (resource === requiredResource && action === '*') {
                return true;
            }

            // Check for resource wildcard "*:action"
            if (resource === '*' && action === requiredAction) {
                return true;
            }

            return false;
        });
    });
};
