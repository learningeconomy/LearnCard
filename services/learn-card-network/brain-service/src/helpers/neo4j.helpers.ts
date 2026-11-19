import { QueryResult } from 'neo4j-driver';

type QueryValue =
    | string
    | number
    | boolean
    | { $in: any[] }
    | { $regex: string }
    | { $or: QueryValue[] }
    | Record<string, unknown>;

type QueryCondition = Record<string, QueryValue>;

let paramCounter = 0;

/**
 * Checks if a value is a special query operator ($in, $regex, $or)
 */
const isQueryOperator = (value: unknown): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    const keys = Object.keys(value);
    return keys.length === 1 && (keys[0] === '$in' || keys[0] === '$regex' || keys[0] === '$or');
};

/**
 * Checks if a value is a plain nested object (not a query operator, array, or primitive)
 */
const isNestedObject = (value: unknown): value is Record<string, unknown> => {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !isQueryOperator(value)
    );
};

/**
 * Formats a field reference for Neo4j.
 * If the field contains dots (flattened nested property), wrap it in backticks.
 */
const formatFieldRef = (identifier: string, field: string): string => {
    if (field.includes('.')) {
        // Neo4j requires backticks to escape property names with dots
        return `${identifier}.\`${field}\``;
    }
    return `${identifier}.${field}`;
};

/**
 * Builds a WHERE clause condition for a single field
 * Supports nested objects which are stored as flattened dot-notation properties in Neo4j
 */
const buildFieldCondition = (
    identifier: string,
    field: string,
    value: QueryValue,
    params: Record<string, any>
): string => {
    // Handle $or at field level
    if (typeof value === 'object' && value !== null && '$or' in value) {
        const orConditions = (value as { $or: QueryValue[] }).$or.map(orValue =>
            buildFieldCondition(identifier, field, orValue, params)
        );
        return `(${orConditions.join(' OR ')})`;
    }

    // Handle $in operator
    if (typeof value === 'object' && value !== null && '$in' in value) {
        const paramName = `param_${paramCounter++}`;
        params[paramName] = (value as { $in: any[] }).$in;
        return `${formatFieldRef(identifier, field)} IN $${paramName}`;
    }

    // Handle $regex operator
    if (typeof value === 'object' && value !== null && '$regex' in value) {
        const paramName = `param_${paramCounter++}`;
        params[paramName] = (value as { $regex: string }).$regex;
        return `${formatFieldRef(identifier, field)} =~ $${paramName}`;
    }

    // Handle nested objects by recursively building conditions with flattened dot notation
    // This matches how Neo4j stores nested objects (e.g., meta.appListingId as a property name)
    if (isNestedObject(value)) {
        const nestedConditions = Object.entries(value).map(([nestedField, nestedValue]) =>
            buildFieldCondition(
                identifier,
                `${field}.${nestedField}`,
                nestedValue as QueryValue,
                params
            )
        );
        return nestedConditions.length > 1
            ? `(${nestedConditions.join(' AND ')})`
            : nestedConditions[0] || 'true';
    }

    // Handle direct equality
    const paramName = `param_${paramCounter++}`;
    params[paramName] = value;
    return `${formatFieldRef(identifier, field)} = $${paramName}`;
};

/**
 * Builds WHERE clause from query object, expanding operators in JavaScript
 * Returns both the WHERE clause string and the parameters object
 */
export const buildWhereClause = (
    identifier: string,
    query: QueryCondition | { $or: QueryCondition[] },
    exclude: QueryCondition = {}
): { whereClause: string; params: Record<string, any> } => {
    paramCounter = 0; // Reset counter for each query
    const params: Record<string, any> = {};
    let conditions: string[];
    if ('$or' in query && Array.isArray(query.$or)) {
        const alternatives = (query.$or as QueryCondition[]).map(fields => {
            const terms = Object.entries(fields).map(([field, value]) =>
                buildFieldCondition(identifier, field, value, params)
            );
            return terms.length > 1 ? `(${terms.join(' AND ')})` : terms[0];
        });
        conditions = [`(${alternatives.join(' OR ')})`];
    } else {
        conditions = Object.entries(query).map(([field, value]) =>
            buildFieldCondition(identifier, field, value, params)
        );
    }

    for (const [field, value] of Object.entries(exclude)) {
        if (value === undefined) continue;
        const matches = buildFieldCondition(identifier, field, value, params);
        // Cypher returns null when the field is missing. Treat that as a non-match.
        conditions.push(`NOT coalesce(${matches}, false)`);
    }

    return {
        whereClause: conditions.join(' AND ') || 'true',
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
    query: QueryCondition | { $or: QueryCondition[] },
    exclude?: QueryCondition
): { whereClause: string; params: Record<string, any> } => {
    return buildWhereClause(identifier, query, exclude);
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
    // Cypher's =~ matches the entire string. Wrap the entire expression so that
    // alternatives and anchors retain their meaning when searching within a field.
    // The surrounding wildcards must cross line breaks even when the expression
    // itself does not use the dotAll flag.
    const javaFlags = ['i', 'm', 's'].filter(flag => flags.includes(flag)).join('');
    const prefix = javaFlags ? `(?${javaFlags})` : '';
    const leading = flags.includes('y') ? '' : '(?s:.*)';

    // Without multiline, Java's `$` also matches before a final line break,
    // unlike JavaScript's. Use Java's strict end anchor outside character classes.
    let pattern = '';
    let inCharacterClass = false;
    let escaped = false;
    for (const char of source) {
        if (escaped) {
            pattern += char;
            escaped = false;
        } else if (char === '\\') {
            pattern += char;
            escaped = true;
        } else if (char === '[') {
            inCharacterClass = true;
            pattern += char;
        } else if (char === ']' && inCharacterClass) {
            inCharacterClass = false;
            pattern += char;
        } else if (char === '$' && !inCharacterClass && !flags.includes('m')) {
            pattern += '\\z';
        } else {
            pattern += char;
        }
    }

    return `${prefix}${leading}(?:${pattern})(?s:.*)`;
};

const isSlashDelimitedRegexString = (value: unknown): value is string =>
    typeof value === 'string' && /^\/.+\/[a-zA-Z]*$/.test(value);

const parseSlashDelimitedRegexString = (regexString: string): RegExpValue => {
    // Expect format /pattern/flags where flags are optional
    // Remove leading and trailing slashes and extract flags
    const lastSlash = regexString.lastIndexOf('/');
    const source = regexString.slice(1, lastSlash);
    const flags = regexString.slice(lastSlash + 1);

    return { source, flags };
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
        } else if (key === '$regex' && isSlashDelimitedRegexString(value)) {
            result[key] = convertRegExpToNeo4j(parseSlashDelimitedRegexString(value));
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
