export const MATCH_QUERY_WHERE = `
all(key IN keys($matchQuery) 
    WHERE CASE 
        WHEN $matchQuery[key] IS TYPED MAP 
            AND $matchQuery[key]['$in'] IS NOT NULL
        THEN boost[key] IN $matchQuery[key]['$in']
        WHEN $matchQuery[key] IS TYPED MAP 
            AND $matchQuery[key]['$regex'] IS NOT NULL
        THEN boost[key] =~ $matchQuery[key]['$regex']
        ELSE boost[key] = $matchQuery[key]
    END
)
`;
