import { StreamID } from '@ceramicnetwork/streamid';

import { CeramicURI } from './types';

export const streamIdToCeramicURI = (id: string | StreamID): CeramicURI => `lc:ceramic:${id}`;
