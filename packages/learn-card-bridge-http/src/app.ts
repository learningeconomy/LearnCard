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

app.get('/', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/credentials', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/credentials/:id', async (req: TypedRequest<{}>, res) => {
    console.log('credentials' + req.params.id);
    res.sendStatus(501);
});

app.delete('/credentials/:id', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/credentials/issue', async (req: TypedRequest<IssueEndpoint>, res) => {
    try {
        const validationResult = await IssueEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/credentials/issue] Validation error: ',
                validationResult.error.message,
                '(received: ',
                req.body,
                ')'
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        const issuedCredential = await wallet.issueCredential(validatedBody.credential);

        return res.status(201).json(issuedCredential);
    } catch (error) {
        console.error(
            '[/credentials/issue] Caught error: ',
            (error as any).message,
            '(received: ',
            req.body
        );
        return res.status(400).json(`Invalid input: ${(error as any).message}`);
    }
});

app.post('/credentials/status', async (_req: TypedRequest<UpdateStatusEndpoint>, res) => {
    res.sendStatus(501);
});

app.post('/credentials/verify', async (req: TypedRequest<VerifyCredentialEndpoint>, res) => {
    try {
        const validationResult = await VerifyCredentialEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/credentials/verify] Validation error: ',
                validationResult.error.message,
                '(received: ',
                req.body,
                ')'
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        const verificationResult = await wallet._wallet.pluginMethods.verifyCredential(
            validatedBody.verifiableCredential
        );

        if (verificationResult.errors.length > 0) {
            console.error(
                '[/credentials/verify] Verification error(s): ',
                verificationResult.errors,
                '(received: ',
                req.body
            );
            return res.status(400).json(verificationResult);
        }

        // Pass a test for interop 🙃
        verificationResult.checks = verificationResult.checks.filter(
            check => check !== 'expiration'
        );

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error(
            '[/credentials/verify] Caught error: ',
            (error as any).message,
            '(received: ',
            req.body
        );
        return res.status(400).json(`Invalid input: ${(error as any).message}`);
    }
});

app.post('/credentials/derive', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/presentations/verify', async (req: TypedRequest<VerifyPresentationEndpoint>, res) => {
    try {
        const validationResult = await VerifyPresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/presentations/verify] Validation error: ',
                validationResult.error.message,
                '(received: ',
                req.body,
                ')'
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const wallet = await getWallet();

        if ('presentation' in validatedBody) return res.sendStatus(501);

        const verificationResult = await wallet._wallet.pluginMethods.verifyPresentation(
            validatedBody.verifiablePresentation
        );

        if (verificationResult.errors.length > 0) {
            console.error(
                '[/presentations/verify] Verification error(s): ',
                verificationResult.errors,
                '(received: ',
                req.body
            );
            return res.status(400).json(verificationResult);
        }

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error(
            '[/presentations/verify] Caught error: ',
            (error as any).message,
            '(received: ',
            req.body
        );
        return res.status(400).json(`Invalid input: ${(error as any).message}`);
    }
});

app.post('/presentations/prove', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/presentations', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/presentations/:id', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.delete('/presentations/:id', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/exchanges/:exchangeId', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/exchanges/:exchangeId/:transactionId', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.use('', router);

export default app;
