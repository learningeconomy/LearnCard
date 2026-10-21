// @vitest-environment jsdom

import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BoostGenericCard } from '../BoostGenericCard';

describe('BoostGenericCard keyboard accessibility', () => {
    test('supports keyboard focus and activation', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(<BoostGenericCard title="Camp Counselor" innerOnClick={onClick} />);

        const card = screen.getByRole('button', { name: /Camp Counselor/ });

        await user.tab();
        expect(document.activeElement).toBe(card);

        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledOnce();
    });
});
