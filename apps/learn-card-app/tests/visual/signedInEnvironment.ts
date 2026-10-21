import { environment as configured } from '../../src/config/environment';

// Match production feature defaults rather than forcing development-only navigation.
export const environment = { ...configured, DEV: false, PROD: true };
