import express from 'express';
import cors from 'cors';

import { TypedRequest } from './types.helpers';
import {
    IssueEndpoint,
    IssueEndpointValidator,
    IssuePresentationEndpoint,
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
    try {
        const learnCard = await getLearnCard();

        return res.status(200).send(learnCard.id.did());
    } catch (error) {
        console.error('[/did] Caught error: ', error);
        return res.status(500).json(`Server error: ${error}`);
    }
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
        // issuanceDate is a VC 1.x term (2.0 uses validFrom). Only default it for v1
        // credentials — injecting it into a v2 credential trips strict JSON-LD
        // data-loss detection (undefined term) and fails issuance. Per the VC Data
        // Model, the base context MUST be the first @context entry.
        const credential = req.body?.credential;
        const context = credential?.['@context'];
        const baseContext = Array.isArray(context) ? context[0] : context;
        const isV1 = baseContext === 'https://www.w3.org/2018/credentials/v1';

        if (
            credential &&
            typeof credential === 'object' &&
            isV1 &&
            !('issuanceDate' in credential)
        ) {
            credential.issuanceDate = new Date().toISOString();
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

        // Default the proof type when the caller doesn't specify one. A bare
        // `cryptosuite` implies DataIntegrityProof (cryptosuite is a Data
        // Integrity concept); otherwise fall back to Ed25519Signature2020,
        // which the VC-API / Ed25519 suites expect.
        const signingOptions = options.type
            ? options
            : {
                  type: options.cryptosuite ? 'DataIntegrityProof' : 'Ed25519Signature2020',
                  ...options,
              };

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

        // 'expiration' is a LearnCard-specific check, not one of the VC-API
        // checks ('proof'); the suites reject responses that report it.
        verificationResult.checks = verificationResult.checks.filter(
            check => check !== 'expiration'
        );

        if (verificationResult.errors.length > 0) {
            console.error(
                '[/credentials/verify] Verification error(s): ',
                verificationResult.errors
            );
            return res.status(400).json(verificationResult);
        }

        return res.status(200).json(verificationResult);
    } catch (error) {
        console.error('[/credentials/verify] Caught error: ', error);
        return res.status(400).json(`Invalid input: ${error}`);
    }
});

app.post('/credentials/derive', async (_req: TypedRequest<{}>, res) => {
    res.sendStatus(501);
});

app.post('/presentations/issue', async (req: TypedRequest<IssuePresentationEndpoint>, res) => {
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

        const presentationOptions = validatedBody.options ?? {};
        const presentationSigningOptions = presentationOptions.type
            ? presentationOptions
            : {
                  type: presentationOptions.cryptosuite
                      ? 'DataIntegrityProof'
                      : 'Ed25519Signature2020',
                  ...presentationOptions,
              };

        const issuedPresentation = await learnCard.invoke.issuePresentation(
            validatedBody.presentation,
            presentationSigningOptions as Parameters<typeof learnCard.invoke.issuePresentation>[1]
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

        // 'expiration' is a LearnCard-specific check, not one of the VC-API
        // checks ('proof'); the suites reject responses that report it.
        verificationResult.checks = verificationResult.checks.filter(
            check => check !== 'expiration'
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
