import { render } from '@testing-library/react';

import QRCodeUserCard from './QRCodeUserCard';

describe('QRCodeUserCard', () => {
  it('should render successfully', () => {
    const { baseElement } = render(< QRCodeUserCard />);
    expect(baseElement).toBeTruthy();
  });
});
