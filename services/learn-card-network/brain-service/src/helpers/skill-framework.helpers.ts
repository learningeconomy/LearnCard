import { constructUri } from './uri.helpers';

export const getFrameworkUri = (id: string, domain: string): string =>
    constructUri('framework', id, domain);

export const getSkillUri = (frameworkId: string, id: string, domain: string): string =>
    constructUri('skill', `${frameworkId}:${id}`, domain);
