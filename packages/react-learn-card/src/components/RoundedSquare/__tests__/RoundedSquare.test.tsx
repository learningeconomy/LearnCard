import React from 'react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import RoundedSquare from '../RoundedSquare';

describe('RoundedSquare', () => {
    it('renders without props', async () => {
        expect(() => render(<RoundedSquare />)).not.toThrow();
    });

    it('renders title', async () => {
        const screen = render(<RoundedSquare title="Title!" />);

        expect(screen.getByText('Title!')).toBeInTheDocument;
    });

    it('renders description', async () => {
        render(<RoundedSquare description="Description!" />);

        expect(screen.getByText('Description!')).toBeInTheDocument;
    });

    it('renders count', async () => {
        render(<RoundedSquare count="29" />);

        expect(screen.getByText('29')).toBeInTheDocument;
    });

    it('calls onClick', async () => {
        const handleOnClick = jest.fn();
        const user = userEvent.setup();

        render(<RoundedSquare onClick={handleOnClick} />);

        await user.click(screen.getByRole('button'));
        expect(handleOnClick).toBeCalled();
    });
});
