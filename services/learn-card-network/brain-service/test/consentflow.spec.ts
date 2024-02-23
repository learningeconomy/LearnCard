import { ConsentFlow } from '../src/models/ConsentFlow';
import { ConsentFlowValidator } from '../src/types/consentflow';

describe('ConsentFlow Model', () => {
  beforeAll(async () => {
    // Setup database connection or any other setup required before tests run
  });

  afterAll(async () => {
    // Clean up database or any other teardown required after tests are done
  });

  describe('Validation', () => {
    it('should validate a valid consent flow endpoint', () => {
      const validEndpoint = { endpoint: 'https://example.com/consent' };
      const result = ConsentFlowValidator.safeParse(validEndpoint);
      expect(result.success).toBe(true);
    });

    it('should invalidate an empty endpoint', () => {
      const invalidEndpoint = { endpoint: '' };
      const result = ConsentFlowValidator.safeParse(invalidEndpoint);
      expect(result.success).toBe(false);
    });

    it('should invalidate a consent flow without an endpoint', () => {
      // @ts-ignore to test runtime validation
      const invalidConsentFlow = {};
      const result = ConsentFlowValidator.safeParse(invalidConsentFlow);
      expect(result.success).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should create a ConsentFlow instance', async () => {
      const endpoint = 'https://example.com/consent';
      const consentFlow = await ConsentFlow.create({
        endpoint,
      });

      expect(consentFlow).toBeDefined();
      expect(consentFlow.endpoint).toBe(endpoint);
    });

    it('should find a ConsentFlow instance by endpoint', async () => {
      const endpoint = 'https://example.com/consent';
      // Assuming the instance was already created in the previous test
      const consentFlow = await ConsentFlow.findOne({
        where: {
          endpoint,
        },
      });

      expect(consentFlow).toBeDefined();
      expect(consentFlow.endpoint).toBe(endpoint);
    });

    it('should delete a ConsentFlow instance', async () => {
      const endpoint = 'https://example.com/consent';
      // Assuming the instance exists from previous tests
      const deleteResult = await ConsentFlow.delete({
        where: {
          endpoint,
        },
      });

      expect(deleteResult).toBeGreaterThan(0); // Assuming deleteResult indicates the number of rows deleted
    });
  });
});
