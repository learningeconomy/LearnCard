import { inject } from 'vitest';
import dotenv from 'dotenv';
import { Neogma, QueryBuilder } from 'neogma';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const uri = isTest ? inject('neo4j-uri') : process.env.NEO4J_URI;
const username = isTest ? 'neo4j' : process.env.NEO4J_USERNAME;
const password = isTest ? inject('neo4j-password') : process.env.NEO4J_PASSWORD;

if (!uri) throw new Error('Whoops! No URI found');
if (!username) throw new Error('Whoops! No Username found');
if (!password) throw new Error('Whoops! No Password found');

export const neogma = new Neogma({ url: uri, username, password });

QueryBuilder.queryRunner = neogma.queryRunner;

export default neogma;
