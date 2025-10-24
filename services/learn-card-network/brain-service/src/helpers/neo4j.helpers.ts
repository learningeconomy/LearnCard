import { QueryResult } from 'neo4j-driver';

type QueryValue =
    | string
    | number
    | boolean
    | { $in: any[] }
    | { $regex: string }
    | { $or: QueryValue[] };

type QueryCondition = Record<string, QueryValue>;

let paramCounter = 0;

/**
 * Builds a WHERE clause condition for a single field
 */
const buildFieldCondition = (
    identifier: string,
    field: string,
    value: QueryValue,
    params: Record<string, any>
): string => {
    // Handle $or at field level
    if (typeof value === 'object' && value !== null && '$or' in value) {
        const orConditions = value.$or.map(orValue =>
            buildFieldCondition(identifier, field, orValue, params)
        );
        return `(${orConditions.join(' OR ')})`;
    }

    // Handle $in operator
    if (typeof value === 'object' && value !== null && '$in' in value) {
        const paramName = `param_${paramCounter++}`;
        params[paramName] = value.$in;
        return `${identifier}.${field} IN $${paramName}`;
    }

    // Handle $regex operator
    if (typeof value === 'object' && value !== null && '$regex' in value) {
        const paramName = `param_${paramCounter++}`;
        params[paramName] = value.$regex;
        return `${identifier}.${field} =~ $${paramName}`;
    }

    // Handle direct equality
    const paramName = `param_${paramCounter++}`;
    params[paramName] = value;
    return `${identifier}.${field} = $${paramName}`;
};

/**
 * Builds WHERE clause from query object, expanding operators in JavaScript
 * Returns both the WHERE clause string and the parameters object
 */
export const buildWhereClause = (
    identifier: string,
    query: QueryCondition | { $or: QueryCondition[] }
): { whereClause: string; params: Record<string, any> } => {
    paramCounter = 0; // Reset counter for each query
    const params: Record<string, any> = {};

    // Handle document-level $or
    if ('$or' in query && Array.isArray(query.$or)) {
        const orConditions = (query.$or as QueryCondition[]).map(orQuery => {
            const conditions = Object.entries(orQuery).map(([field, value]) =>
                buildFieldCondition(identifier, field, value, params)
            );
            return conditions.length > 1 ? `(${conditions.join(' AND ')})` : conditions[0];
        });
        return {
            whereClause: `(${orConditions.join(' OR ')})`,
            params,
        };
    }

    // Handle regular AND query
    const conditions = Object.entries(query).map(([field, value]) =>
        buildFieldCondition(identifier, field, value, params)
    );

    return {
        whereClause: conditions.length > 0 ? conditions.join(' AND ') : 'true',
        params,
    };
};

/**
 * Helper function to build WHERE clause for use with neogma's QueryBuilder
 * Returns both the WHERE clause string and the params object that should be merged
 * into the BindParam constructor
 */
export const buildWhereForQueryBuilder = (
    identifier: string,
    query: QueryCondition | { $or: QueryCondition[] }
): { whereClause: string; params: Record<string, any> } => {
    return buildWhereClause(identifier, query);
};

export const convertQueryResultToPropertiesObjectArray = <Properties extends Record<string, any>>(
    results: QueryResult
): Properties[] => {
    return results.records.map(result => {
        const resultObject = result.toObject();

        return Object.fromEntries(
            Object.entries(resultObject).map(([key, value]) => {
                // Handle both primitives and Neo4j objects with properties
                const extractedValue =
                    value && typeof value === 'object' && 'properties' in value
                        ? value.properties
                        : value;

                return [key, extractedValue ?? undefined];
            })
        ) as Properties;
    });
};

type RegExpValue = {
    source: string;
    flags: string;
};

const isRegExp = (value: unknown): value is RegExp => value instanceof RegExp;

const isRegExpValue = (value: unknown): value is RegExpValue =>
    typeof value === 'object' &&
    value !== null &&
    'source' in value &&
    'flags' in value &&
    typeof value.source === 'string' &&
    typeof value.flags === 'string';

export const convertRegExpToNeo4j = ({ source, flags }: RegExp | RegExpValue): string => {
    let pattern = source;

    // Add case insensitive flag if needed
    const prefix = flags.includes('i') ? '(?i)' : '';

    // Add .* to start and end if needed, avoiding doubles
    const needsStartWildcard = !pattern.startsWith('.*');
    const needsEndWildcard = !pattern.endsWith('.*');

    pattern = `${needsStartWildcard ? '.*' : ''}${pattern}${needsEndWildcard ? '.*' : ''}`;

    // Handle the case where the pattern is just ".*"
    if (pattern === '.*.*') {
        return '.*.*';
    }

    return `${prefix}${pattern}`;
};

export const convertObjectRegExpToNeo4j = (obj: Record<string, any>): Record<string, any> => {
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item =>
            isRegExp(item) || isRegExpValue(item)
                ? convertRegExpToNeo4j(item)
                : typeof item === 'object' && item !== null
                ? convertObjectRegExpToNeo4j(item)
                : item
        );
    }

    // Handle regular objects
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (isRegExp(value) || isRegExpValue(value)) {
            result[key] = convertRegExpToNeo4j(value);
        } else if (Array.isArray(value)) {
            result[key] = convertObjectRegExpToNeo4j(value);
        } else if (value instanceof Date) {
            result[key] = new Date(value);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = convertObjectRegExpToNeo4j(value);
        } else {
            result[key] = value;
        }
    }

    return result;
};
