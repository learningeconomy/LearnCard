import { render } from '@testing-library/react';

import AppUrlListener from './AppUrlListener';

describe('AppUrlListener', () => {
  it('should render successfully', () => {
    const { baseElement } = render(< AppUrlListener />);
    expect(baseElement).toBeTruthy();
  });
});
