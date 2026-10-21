import { environment } from '@environment';
import { Neogma, QueryBuilder } from 'neogma';

const uri = environment.NEO4J_URI;
const username = environment.NEO4J_USERNAME;
const password = environment.NEO4J_PASSWORD;

if (!uri) throw new Error('Whoops! No URI found');
if (!username) throw new Error('Whoops! No Username found');
if (!password) throw new Error('Whoops! No Password found');

export const neogma = new Neogma({ url: uri, username, password });

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
