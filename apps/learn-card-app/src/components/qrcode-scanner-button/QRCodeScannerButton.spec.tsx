import { render } from '@testing-library/react';

import QRCodeScannerButton from './QRCodeScannerButton';

describe('QRCodeScannerButton', () => {
  it('should render successfully', () => {
    const { baseElement } = render(< QRCodeScannerButton />);
    expect(baseElement).toBeTruthy();
  });
});
