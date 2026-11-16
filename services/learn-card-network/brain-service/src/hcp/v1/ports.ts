/**
 * The only place HCP v1 reaches into brain internals (besides the Neo4j adapter's
 * `@instance` and the router's tRPC builders). Keep it small: if v1 needs more
 * from the brain, it is named here.
 */
import { getServerDidWebDID } from '@helpers/learnCard.helpers';

/** The HCP Provider identifier: this brain instance's did:web. */
export const providerId = (): string => getServerDidWebDID();
