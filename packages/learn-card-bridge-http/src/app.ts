import express from 'express';
import cors from 'cors';
import ObjectID from 'bson-objectid';

import { TypedRequest } from './types.helpers';

const router = express.Router();

const app = express();

app.use(cors());
app.use(express.json());

type QueryParams = {};

app.get('', async (req: TypedRequest<{}, QueryParams>, res) => {
    res.sendStatus(500);
});

app.get('/:id', async (req: TypedRequest<{}, QueryParams>, res) => {
    res.sendStatus(500);
});

app.delete('/:id', async (req: TypedRequest<{}, QueryParams>, res) => {
    res.sendStatus(500);
});

app.post('/issue', async (req: TypedRequest<{}, QueryParams>, res) => {
    res.sendStatus(500);
});

app.post('/status', async (req: TypedRequest<{}, QueryParams>, res) => {
    res.sendStatus(500);
});

app.use('/credentials', router);

export default app;
