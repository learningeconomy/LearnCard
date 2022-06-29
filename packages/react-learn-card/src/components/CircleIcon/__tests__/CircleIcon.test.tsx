import React from 'react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';

import CircleIcon from '../CircleIcon';

describe('Running Tests for CircleIcon', () => {
    it('Renders important props', () => {
        const { getByAltText, getByText } = render(
            <CircleIcon iconSrc="iconSrcProp" count="count text" />
        );

        const img = getByAltText('Icon image');
        expect(img).toHaveAttribute('src', 'iconSrcProp');

        const countText = getByText('count text');
        expect(countText).toBeInTheDocument();
    });

    it('Uses the given styles', () => {
        const { container } = render(<CircleIcon size="22px" innerPadding="2px" />);

        const containerStyle = container.firstChild.style;
        expect(containerStyle.height).toBe('22px');
        expect(containerStyle.width).toBe('22px');
        expect(containerStyle.padding).toBe('2px');
    });

    it('calls onClick', async () => {
        const handleOnClick = jest.fn();
        const user = userEvent.setup();

        const { container } = render(<CircleIcon onClick={handleOnClick} />);

        expect(handleOnClick).not.toBeCalled();
        await user.click(container.firstChild);
        expect(handleOnClick).toBeCalled();
    });
});
