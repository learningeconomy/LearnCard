import { QueryResult } from 'neo4j-driver';

export const getMatchQueryWhere = (identifierToFilter: string, matchQueryKey = 'matchQuery') => `
all(key IN keys($${matchQueryKey}) 
    WHERE CASE 
        WHEN $${matchQueryKey}[key] IS TYPED MAP 
        THEN
            CASE
                WHEN $${matchQueryKey}[key]['$in'] IS NOT NULL
                THEN ${identifierToFilter}[key] IN $${matchQueryKey}[key]['$in']
                WHEN $${matchQueryKey}[key]['$regex'] IS NOT NULL
                THEN ${identifierToFilter}[key] =~ $${matchQueryKey}[key]['$regex']
            END
        ELSE ${identifierToFilter}[key] = $${matchQueryKey}[key]
    END
)
`;

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
