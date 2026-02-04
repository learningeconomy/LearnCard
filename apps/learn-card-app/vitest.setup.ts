import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as unknown as typeof TextDecoder;

// Define global constants that are normally set by webpack DefinePlugin
(global as any).LCN_API_URL = 'http://localhost:4000/api';
(global as any).LCN_URL = 'http://localhost:4000/trpc';
(global as any).CLOUD_URL = 'http://localhost:4100/trpc';
(global as any).LEARN_CLOUD_XAPI_URL = 'http://localhost:4100/xapi';
(global as any).API_URL = 'http://localhost:5100/trpc';
(global as any).IS_PRODUCTION = false;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
