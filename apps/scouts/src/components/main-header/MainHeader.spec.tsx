import { render } from '@testing-library/react';

import MainHeader from './MainHeader';

describe('MainHeader', () => {
  it('should render successfully', () => {
    const { baseElement } = render(< MainHeader />);
    expect(baseElement).toBeTruthy();
  });
});
