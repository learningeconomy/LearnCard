import { TRPCError } from '@trpc/server';

/**
 * MongoDB query operators that execute server-side JavaScript. These have no
 * legitimate use against the custom-document store and enable denial-of-service
 * (and arbitrary JS execution on the database) if a caller-supplied query is
 * passed straight to MongoDB. We reject them rather than silently strip, so the
 * caller gets a clear error instead of unexpected query semantics.
 */
const FORBIDDEN_QUERY_OPERATORS = new Set(['$where', '$function', '$accumulator']);

/**
 * Maximum nesting depth we are willing to traverse. The recursion below walks
 * caller-supplied JSON, so without a cap a pathologically deep object (e.g.
 * `{a:{a:{a:...}}}`) could exhaust the Node call stack and crash the process.
 * Legitimate Mongo queries/updates against the custom store are shallow; 64 is
 * far beyond any real-world filter while still bounding the traversal.
 */
const MAX_QUERY_DEPTH = 64;

/**
 * Recursively asserts that a caller-supplied Mongo query/filter contains no
 * server-side-JavaScript operators at any depth (including nested inside
 * `$expr`, `$and`, arrays, etc.). Throws a `BAD_REQUEST` if one is found, or if
 * the object is nested beyond `MAX_QUERY_DEPTH` (a stack-overflow DoS guard).
 *
 * Note: did-scoping is still enforced separately in the access layer (the `did`
 * filter is applied after the caller's query and cannot be overridden); this
 * guard closes the orthogonal server-side-JS / DoS vector.
 */
export const assertSafeMongoQuery = (value: unknown, depth = 0): void => {
    if (depth > MAX_QUERY_DEPTH) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Query is nested too deeply (max ${MAX_QUERY_DEPTH} levels)`,
        });
    }

    if (Array.isArray(value)) {
        for (const item of value) assertSafeMongoQuery(item, depth + 1);
        return;
    }

    if (value && typeof value === 'object') {
        for (const [key, nested] of Object.entries(value)) {
            if (FORBIDDEN_QUERY_OPERATORS.has(key)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Query operator "${key}" is not allowed`,
                });
            }

            assertSafeMongoQuery(nested, depth + 1);
        }
    }
};
