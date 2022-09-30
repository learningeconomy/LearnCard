import { isHex } from '../src';

describe('isHex', () => {
  it('should accept valid hex', () => expect(isHex('123')).toBe(true));
  it('should reject invalid hex', () => expect(isHex('zzz')).toBe(false));
  it('should reject empty strings', () => expect(isHex('')).toBe(false));

  it('should accept lowercase letters', () => {
    expect(isHex('abc123')).toBe(true);
  });

  it('should accept uppercase letters', () => {
    expect(isHex('ABC123')).toBe(true);
  });

  it('should accept long strings', () => {
    expect(isHex('abc1230123456789abcdeffedcba9876543210'.repeat(20))).toBe(
      true,
    );
  });
});
