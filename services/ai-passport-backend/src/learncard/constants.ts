import { LEARNCARD_CONTRACT_URI } from '../constants/env';

export const contractUri = LEARNCARD_CONTRACT_URI;
// "lc:network:localhost%3A4000/trpc:contract:1756e791-04d8-4f92-b653-b2668036c6e2";

export const contractId = contractUri.split(':').at(-1);
