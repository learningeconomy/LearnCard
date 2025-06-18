import type { StreamID } from '@ceramicnetwork/streamid';

import type { CeramicURI } from './types';

export const streamIdToCeramicURI = (id: string | StreamID): CeramicURI => `lc:ceramic:${id}`;
