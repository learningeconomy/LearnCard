import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Button from './Button';

describe('Running Test for Mr. Button', () => {
    test('Check Button Render', () => {
        render(<Button text="Button" />);
        expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Not In The Document' })
        ).not.toBeInTheDocument();
    });
});
