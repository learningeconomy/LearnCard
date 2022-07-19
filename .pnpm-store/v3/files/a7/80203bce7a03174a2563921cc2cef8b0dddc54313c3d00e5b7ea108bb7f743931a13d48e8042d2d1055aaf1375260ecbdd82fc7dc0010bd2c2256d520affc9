import { Resolver } from 'did-resolver';
import { createJWE, verifyJWS, resolveX25519Encrypters } from 'did-jwt';
import { encodePayload, prepareCleartext, decodeCleartext } from 'dag-jose-utils';
import { RPCClient } from 'rpc-utils';
import { CID } from 'multiformats/cid';
import { CacaoBlock, Cacao } from 'ceramic-cacao';
import { fromDagJWS, encodeBase64, base64urlToJSON, decodeBase64, encodeBase64Url, randomString, didWithTime, extractControllers, } from './utils.js';
function isResolver(resolver) {
    return 'registry' in resolver && 'cache' in resolver;
}
export class DID {
    constructor({ provider, resolver = {}, resolverOptions, capability, parent } = {}) {
        if (provider != null) {
            this._client = new RPCClient(provider);
        }
        if (capability) {
            this._capability = capability;
            this._parentId = this._capability.p.iss;
            if (parent && this._parentId !== parent)
                throw new Error('Capability issuer and parent not equal');
        }
        else if (parent) {
            this._parentId = parent;
        }
        this.setResolver(resolver, resolverOptions);
    }
    get capability() {
        if (!this._capability) {
            throw new Error('DID has no capability attached');
        }
        return this._capability;
    }
    get hasCapability() {
        return this._capability != null;
    }
    get parent() {
        if (!this._parentId) {
            throw new Error('DID has no parent DID');
        }
        return this._parentId;
    }
    get hasParent() {
        return this._parentId != null;
    }
    get id() {
        if (this._id == null) {
            throw new Error('DID is not authenticated');
        }
        return this._id;
    }
    get authenticated() {
        return this._id != null;
    }
    withCapability(cap) {
        return new DID({
            provider: this._client?.connection,
            resolver: this._resolver,
            capability: cap,
            parent: this._parentId,
        });
    }
    setProvider(provider) {
        if (this._client == null) {
            this._client = new RPCClient(provider);
        }
        else if (this._client.connection !== provider) {
            throw new Error('A different provider is already set, create a new DID instance to use another provider');
        }
    }
    setResolver(resolver, resolverOptions) {
        this._resolver = isResolver(resolver) ? resolver : new Resolver(resolver, resolverOptions);
    }
    async authenticate({ provider, paths = [], aud } = {}) {
        if (provider != null) {
            this.setProvider(provider);
        }
        if (this._client == null) {
            throw new Error('No provider available');
        }
        const nonce = randomString();
        const jws = await this._client.request('did_authenticate', {
            nonce,
            aud,
            paths,
        });
        const { kid } = await this.verifyJWS(jws);
        const payload = base64urlToJSON(jws.payload);
        if (!kid.includes(payload.did))
            throw new Error('Invalid authencation response, kid mismatch');
        if (payload.nonce !== nonce)
            throw new Error('Invalid authencation response, wrong nonce');
        if (payload.aud !== aud)
            throw new Error('Invalid authencation response, wrong aud');
        if (payload.exp < Date.now() / 1000)
            throw new Error('Invalid authencation response, expired');
        this._id = payload.did;
        return this._id;
    }
    async createJWS(payload, options = {}) {
        if (this._client == null)
            throw new Error('No provider available');
        if (this._id == null)
            throw new Error('DID is not authenticated');
        if (this._capability) {
            const cacaoBlock = await CacaoBlock.fromCacao(this._capability);
            const capCID = CID.asCID(cacaoBlock.cid);
            if (!capCID) {
                throw new Error(`Capability CID of the JWS cannot be set to the capability payload cid as they are incompatible`);
            }
            options.protected = options.protected || {};
            options.protected.cap = `ipfs://${capCID?.toString()}`;
        }
        const { jws } = await this._client.request('did_createJWS', {
            did: this._id,
            ...options,
            payload,
        });
        return jws;
    }
    async createDagJWS(payload, options = {}) {
        const { cid, linkedBlock } = await encodePayload(payload);
        const payloadCid = encodeBase64Url(cid.bytes);
        Object.assign(options, { linkedBlock: encodeBase64(linkedBlock) });
        const jws = await this.createJWS(payloadCid, options);
        const compatibleCID = CID.asCID(cid);
        if (!compatibleCID) {
            throw new Error('CID of the JWS cannot be set to the encoded payload cid as they are incompatible');
        }
        jws.link = compatibleCID;
        if (this._capability) {
            const cacaoBlock = await CacaoBlock.fromCacao(this._capability);
            return { jws, linkedBlock, cacaoBlock: cacaoBlock.bytes };
        }
        return { jws, linkedBlock };
    }
    async verifyJWS(jws, options = {}) {
        if (typeof jws !== 'string')
            jws = fromDagJWS(jws);
        const kid = base64urlToJSON(jws.split('.')[0]).kid;
        if (!kid)
            throw new Error('No "kid" found in jws');
        const didResolutionResult = await this.resolve(kid);
        const timecheckEnabled = !options.disableTimecheck;
        if (timecheckEnabled) {
            const nextUpdate = didResolutionResult.didDocumentMetadata?.nextUpdate;
            if (nextUpdate) {
                const phaseOutMS = options.revocationPhaseOutSecs
                    ? options.revocationPhaseOutSecs * 1000
                    : 0;
                const revocationTime = new Date(nextUpdate).valueOf() + phaseOutMS;
                const isEarlier = options.atTime && options.atTime.getTime() < revocationTime;
                const isLater = !isEarlier;
                if (isLater) {
                    throw new Error(`invalid_jws: signature authored with a revoked DID version: ${kid}`);
                }
            }
            const updated = didResolutionResult.didDocumentMetadata?.updated;
            if (updated && options.atTime && options.atTime.getTime() < new Date(updated).valueOf()) {
                throw new Error(`invalid_jws: signature authored before creation of DID version: ${kid}`);
            }
        }
        const signerDid = didResolutionResult.didDocument?.id;
        if (options.issuer &&
            options.issuer === options.capability?.p.iss &&
            signerDid === options.capability.p.aud) {
            Cacao.verify(options.capability, {
                atTime: options.atTime ? options.atTime : undefined,
                revocationPhaseOutSecs: options.revocationPhaseOutSecs,
            });
        }
        else if (options.issuer && options.issuer !== signerDid) {
            const issuerUrl = didWithTime(options.issuer, options.atTime);
            const issuerResolution = await this.resolve(issuerUrl);
            const controllerProperty = issuerResolution.didDocument?.controller;
            const controllers = extractControllers(controllerProperty);
            if (options.capability?.s &&
                options.capability.p.aud === signerDid &&
                controllers.includes(options.capability.p.iss)) {
                Cacao.verify(options.capability, {
                    atTime: options.atTime ? options.atTime : undefined,
                    revocationPhaseOutSecs: options.revocationPhaseOutSecs,
                });
            }
            else {
                const signerIsController = signerDid ? controllers.includes(signerDid) : false;
                if (!signerIsController) {
                    throw new Error(`invalid_jws: not a valid verificationMethod for issuer: ${kid}`);
                }
            }
        }
        const publicKeys = didResolutionResult.didDocument?.verificationMethod || [];
        verifyJWS(jws, publicKeys);
        let payload;
        try {
            payload = base64urlToJSON(jws.split('.')[1]);
        }
        catch (e) {
        }
        return { kid, payload, didResolutionResult };
    }
    async createJWE(cleartext, recipients, options = {}) {
        const encrypters = await resolveX25519Encrypters(recipients, this._resolver);
        return createJWE(cleartext, encrypters, options.protectedHeader, options.aad);
    }
    async createDagJWE(cleartext, recipients, options = {}) {
        const preparedCleartext = await prepareCleartext(cleartext);
        return this.createJWE(preparedCleartext, recipients, options);
    }
    async decryptJWE(jwe, options = {}) {
        if (this._client == null)
            throw new Error('No provider available');
        if (this._id == null)
            throw new Error('DID is not authenticated');
        const { cleartext } = await this._client.request('did_decryptJWE', {
            did: this._id,
            ...options,
            jwe,
        });
        return decodeBase64(cleartext);
    }
    async decryptDagJWE(jwe) {
        const bytes = await this.decryptJWE(jwe);
        return decodeCleartext(bytes);
    }
    async resolve(didUrl) {
        const result = await this._resolver.resolve(didUrl);
        if (result.didResolutionMetadata.error) {
            const { error, message } = result.didResolutionMetadata;
            const maybeMessage = message ? `, ${message}` : '';
            throw new Error(`Failed to resolve ${didUrl}: ${error}${maybeMessage}`);
        }
        return result;
    }
}
//# sourceMappingURL=did.js.map