/// <reference path="./types/global.d.ts" />

import 'isomorphic-fetch';
import 'abort-controller/polyfill';

export { walletFromKey } from '@wallet/init';
export { Wallet, Plugin } from 'types/wallet';
