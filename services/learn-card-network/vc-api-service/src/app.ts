import express from 'express';
import cors from 'cors';

import { TypedRequest } from './types.helpers';
import {
    IssueEndpoint,
    IssueEndpointValidator,
    IssuePresentationEndpointValidator,
    UpdateStatusEndpoint,
    VerifyCredentialEndpoint,
    VerifyCredentialEndpointValidator,
    VerifyPresentationEndpoint,
    VerifyPresentationEndpointValidator,
} from './validators';
import { getLearnCard } from './learn-card';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/did', async (_req: TypedRequest<{}>, res) => {
    const learnCard = await getLearnCard();

    res.status(200).send(learnCard.id.did());
});

app.get('/credentials', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.get('/credentials/:id', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.delete('/credentials/:id', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/credentials/issue', async (req: TypedRequest<IssueEndpoint>, res) => {
    try {
        if (req.body?.credential && !('issuanceDate' in (req.body?.credential ?? {}))) {
            req.body.credential.issuanceDate = new Date().toISOString();
        }

        const validationResult = await IssueEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/credentials/issue] Validation error: ',
                validationResult.error.message
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();
        const { credentialStatus: _credentialStatus, ...options } = validatedBody.options ?? {};

        const signingOptions =
            options.proofFormat === 'jwt' || options.type
                ? options
                : { type: 'Ed25519Signature2020', ...options };

        const issuedCredential = await learnCard.invoke.issueCredential(
            validatedBody.credential,
            signingOptions as Parameters<typeof learnCard.invoke.issueCredential>[1]
        );

        return res.status(201).json(issuedCredential);
    } catch (error) {
        console.error('[/credentials/issue] Caught error: ', error);
        return res.status(400).json(`Invalid input: ${error}`);
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
                validationResult.error.message
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();

        const verificationResult = await learnCard.invoke.verifyCredential(
            validatedBody.verifiableCredential,
            validatedBody.options
        );

        if (verificationResult.errors.length > 0) {
            console.error(
                '[/credentials/verify] Verification error(s): ',
                verificationResult.errors
            );
            return res.status(400).json(verificationResult);
        }

        verificationResult.checks = verificationResult.checks.filter(
            check => check !== 'expiration'
        );

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error('[/credentials/verify] Caught error: ', error);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/credentials/derive', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/presentations/issue', async (req: TypedRequest<IssueEndpoint>, res) => {
    try {
        const validationResult = await IssuePresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/presentations/issue] Validation error: ',
                validationResult.error.message
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();

        const issuedPresentation = await learnCard.invoke.issuePresentation(
            validatedBody.presentation,
            validatedBody.options
        );

        return res.status(201).json(issuedPresentation);
    } catch (error) {
        console.error('[/presentations/issue] Caught error: ', error);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/presentations/verify', async (req: TypedRequest<VerifyPresentationEndpoint>, res) => {
    try {
        const validationResult = await VerifyPresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/presentations/verify] Validation error: ',
                validationResult.error.message
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();

        if ('presentation' in validatedBody) return res.sendStatus(501);

        const verificationResult = await learnCard.invoke.verifyPresentation(
            validatedBody.verifiablePresentation,
            validatedBody.options
        );

        if (verificationResult.errors.length > 0) {
            console.error(
                '[/presentations/verify] Verification error(s): ',
                verificationResult.errors
            );
            return res.status(400).json(verificationResult);
        }

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error('[/presentations/verify] Caught error: ', error);
        return res.status(400).json(`Invalid input: ${error}`);
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

app.post('/exchanges/:uri', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/exchanges/:exchangeId/:transactionId', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

export default app;
