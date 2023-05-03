import { client } from '@mongo';

beforeAll(async () => {
    await client.connect();
});

afterAll(async () => {
    await client.close(true);
});
