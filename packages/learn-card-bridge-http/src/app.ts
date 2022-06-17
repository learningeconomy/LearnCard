import express from 'express';
import cors from 'cors';

import { TypedRequest } from './types.helpers';
import {
    IssueEndpoint,
    IssueEndpointValidator,
    UpdateStatusEndpoint,
    VerifyCredentialEndpoint,
    VerifyCredentialEndpointValidator,
    VerifyPresentationEndpoint,
    VerifyPresentationEndpointValidator,
} from './validators';
import { getWallet } from './wallet';

const router = express.Router();

const app = express();

app.use(cors());
app.use(express.json());

app.get('credentials', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('credentials/:id', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.delete('credentials/:id', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('credentials/issue', async (req: TypedRequest<IssueEndpoint>, res) => {
    try {
        const validationResult = await IssueEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            return res.status(400).json(`Invalid input ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        const issuedCredential = await wallet.issueCredential(validatedBody.credential);

        return res.status(201).json(issuedCredential);
    } catch (error) {
        return res.sendStatus(500);
    }
});

app.post('credentials/status', async (req: TypedRequest<UpdateStatusEndpoint>, res) => {
    res.sendStatus(501);
});

app.post('credentials/verify', async (req: TypedRequest<VerifyCredentialEndpoint>, res) => {
    try {
        const validationResult = await VerifyCredentialEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            return res.status(400).json(`Invalid input ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        const verificationResult = await wallet._wallet.pluginMethods.verifyCredential(
            validatedBody.verifiableCredential
        );

        if (verificationResult.errors.length > 0) return res.status(400).json(verificationResult);

        return res.status(201).json(verificationResult);
    } catch (error) {
        return res.sendStatus(500);
    }
});

app.post('credentials/derive', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('presentations/verify', async (req: TypedRequest<VerifyPresentationEndpoint>, res) => {
    try {
        const validationResult = await VerifyPresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            return res.status(400).json(`Invalid input ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        if ('presentation' in validatedBody) return res.sendStatus(501);

        const verificationResult = await wallet._wallet.pluginMethods.verifyPresentation(
            validatedBody.verifiablePresentation
        );

        if (verificationResult.errors.length > 0) return res.status(400).json(verificationResult);

        return res.status(201).json(verificationResult);
    } catch (error) {
        return res.sendStatus(500);
    }
});

app.post('presentations/prove', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('presentations', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('presentations/:id', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.delete('presentations/:id', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('exchanges/:exchangeId', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('exchanges/:exchangeId/:transactionId', async (req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.use('/', router);

export default app;
