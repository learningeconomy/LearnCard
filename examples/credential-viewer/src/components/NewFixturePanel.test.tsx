import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { NewFixturePanel } from './NewFixturePanel';

vi.mock('../context/WalletContext', () => ({
    useWallet: () => ({ wallet: null, status: 'disconnected' }),
}));

describe('NewFixturePanel', () => {
    it('does not offer SD-JWT VC in the W3C fixture creator', () => {
        const html = renderToStaticMarkup(<NewFixturePanel onClose={() => {}} />);

        expect(html).not.toContain('<option value="sd-jwt-vc"');
    });
});
