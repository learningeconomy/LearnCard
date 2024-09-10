declare module 'vitest' {
    export interface ProvidedContext {
        'neo4j-uri': string;
        'neo4j-password': string;
    }
}

import { Neogma, QueryBuilder } from 'neogma';
import { inject } from 'vitest';

const uri = inject('neo4j-uri');
const username = 'neo4j';
const password = inject('neo4j-password');

export const neogma = new Neogma({ url: uri, username, password });

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
