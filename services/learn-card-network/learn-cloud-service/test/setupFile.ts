import { client } from '@mongo';

afterAll(async () => {
    await client.close(true);
});
