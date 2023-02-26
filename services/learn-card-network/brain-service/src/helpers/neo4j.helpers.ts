import { QueryResult } from 'neo4j-driver';

export const convertQueryResultToPropertiesObjectArray = <Properties extends Record<string, any>>(
    results: QueryResult
): Properties[] => {
    return results.records.map(result => {
        const resultObject = result.toObject();

        return Object.fromEntries<Properties>(
            Object.entries(resultObject).map(([key, value]) => [key, value?.properties]) as [
                keyof Properties,
                Properties[keyof Properties]
            ][]
        ) as Properties;
    });
};
