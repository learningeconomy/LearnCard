import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Define global constants that are normally set by webpack DefinePlugin
(global as any).LCN_API_URL = 'http://localhost:4000/api';
(global as any).LCN_URL = 'http://localhost:4000/trpc';
(global as any).CLOUD_URL = 'http://localhost:4100/trpc';
(global as any).API_URL = 'http://localhost:5100/trpc';
(global as any).IS_PRODUCTION = false;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
