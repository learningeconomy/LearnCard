import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { renderParts, type MessagePart } from './index';

describe('renderParts', () => {
    it('renders standalone markup components at their message position', () => {
        const parts: MessagePart[] = [
            { type: 'text', value: 'Would you like to' },
            { type: 'markup-standalone', name: '0', options: {}, attributes: {} },
            { type: 'text', value: 'connect?' },
        ];

        const html = renderToStaticMarkup(
            <>{renderParts(parts, { '0': <br data-testid="line-break" /> })}</>
        );

        expect(html).toBe('Would you like to<br data-testid="line-break"/>connect?');
    });
});
