import { getLearnCloudPlugin } from '../';

// TODO: Find a way to mock a LearnCloud endpoint for these tests
describe('LearnCloud Plugin', () => {
    it('exposes a function', () => {
        expect(getLearnCloudPlugin).toBeDefined();
    });
});
