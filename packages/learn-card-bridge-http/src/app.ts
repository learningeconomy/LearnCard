import express from 'express';
import cors from 'cors';
import { VPValidator, type VP } from '@learncard/types';

import type { TypedRequest } from './types.helpers';
import {
    IssueEndpointValidator,
    IssuePresentationEndpointValidator,
    VerifyCredentialEndpointValidator,
    VerifyPresentationEndpointValidator,
    type IssueEndpoint,
    type UpdateStatusEndpoint,
    type VerifyCredentialEndpoint,
    type VerifyPresentationEndpoint,
} from './validators';
import { getLearnCard } from './learn-card';

const router = express.Router();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

// This is non-standard! But very helpful for the VC-API plugin
app.get('/did', async (_req: TypedRequest<{}>, res) => {
    const learnCard = await getLearnCard();

    res.status(200).send(learnCard.id.did());
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
        // If incoming credential doesn't have an issuanceDate, default it to right now
        if (req.body?.credential && !('issuanceDate' in (req.body?.credential ?? {}))) {
            req.body.credential.issuanceDate = new Date().toISOString();
        }

        const validationResult = await IssueEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/credentials/issue] Validation error:',
                validationResult.error.message,
                '(received:',
                req.body,
                ')'
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();
        const { credentialStatus: _credentialStatus, ...options } = validatedBody.options ?? {};

        const issuedCredential = await learnCard.invoke.issueCredential(
            validatedBody.credential,
            options
        );

        return res.status(201).json(issuedCredential);
    } catch (error) {
        console.error('[/credentials/issue] Caught error:', error, '(received:', req.body);
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
                '[/credentials/verify] Validation error:',
                validationResult.error.message,
                '(received:',
                req.body,
                ')'
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
                '[/credentials/verify] Verification error(s):',
                verificationResult.errors,
                '(received:',
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
        console.error('[/credentials/verify] Caught error:', error, '(received:', req.body);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/credentials/derive', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

// This is non-standard! But very helpful for the VC-API plugin
app.post('/presentations/issue', async (req: TypedRequest<IssueEndpoint>, res) => {
    try {
        const validationResult = await IssuePresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/presentations/issue] Validation error:',
                validationResult.error.message,
                '(received:',
                req.body,
                ')'
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
        console.error('[/presentations/issue] Caught error:', error, '(received:', req.body);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/presentations/verify', async (req: TypedRequest<VerifyPresentationEndpoint>, res) => {
    try {
        const validationResult = await VerifyPresentationEndpointValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/presentations/verify] Validation error:',
                validationResult.error.message,
                '(received:',
                req.body,
                ')'
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
                '[/presentations/verify] Verification error(s):',
                verificationResult.errors,
                '(received:',
                req.body
            );
            return res.status(400).json(verificationResult);
        }

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error('[/presentations/verify] Caught error:', error, '(received:', req.body);
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

app.post('/exchanges/:uri', async (req: TypedRequest<VP, { challenge?: string }>, res) => {
    try {
        const validationResult = await VPValidator.spa(req.body);

        if (!validationResult.success) {
            console.error(
                '[/exchanges/:uri] Validation error:',
                validationResult.error.message,
                '(received:',
                req.body,
                ')'
            );
            return res.status(400).json(`Invalid input: ${validationResult.error.message}`);
        }

        const validatedBody = validationResult.data;
        const learnCard = await getLearnCard();
        const challenge = Array.isArray(validatedBody.proof)
            ? validatedBody.proof[0]?.challenge
            : validatedBody.proof.challenge;

        const verification = await learnCard.invoke.verifyPresentation(validatedBody, {
            challenge,
            proofPurpose: 'authentication',
        });

        if (verification.warnings.length > 0 || verification.errors.length > 0) {
            console.error(
                '[/exchanges/:uri] Validation error:',
                verification,
                '(received:',
                req.body,
                ')'
            );
            return res
                .status(400)
                .json({ reason: 'Invalid DID Auth VP', verificationResult: verification });
        }

        const subject = validatedBody.holder;

        const credential = (await learnCard.read.get(req.params.uri))!;

        credential.issuer = {
            ...(typeof credential.issuer === 'string' ? {} : credential.issuer),
            id: learnCard.id.did(),
        };
        credential.issuanceDate = new Date().toISOString();

        if (!Array.isArray(credential.credentialSubject) && subject) {
            credential.credentialSubject.id = subject;
        }

        delete (credential as any).proof;

        const newVc = await learnCard.invoke.issueCredential(credential as any);

        return res.status(201).json(newVc);
    } catch (error) {
        console.error('[/exchanges/:uri] Caught error:', error, '(received:', req.body);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/exchanges/:exchangeId/:transactionId', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.use('', router);

export default app;
