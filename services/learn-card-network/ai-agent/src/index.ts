import 'dotenv/config';

import { getConfig } from './config';
import { createServer } from './server';

const config = getConfig();
const app = createServer({ config });

app.listen(config.port, () => {
    console.log(`AI agent service listening on http://localhost:${config.port}`);
});
