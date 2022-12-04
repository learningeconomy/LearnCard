import { DWNConfig, DWNPlugin, DWNPluginMethods } from './types';
import { generateCid } from "./cid";
import { CID } from 'multiformats/cid';
import { JWK, VC } from '@learncard/types';
import { base64url } from 'multiformats/bases/base64';
import { randomUUID } from 'crypto'
import * as ed from '@noble/ed25519';
import { DescriptorBase, MessageReply, MessageSchema } from './dwn_types';

type DataCID = { cid: CID, data: Uint8Array }

export async function makeDataCID(json_data: string): Promise<DataCID> {
  const dataBytes = new TextEncoder().encode(json_data);
  const cid = await generateCid(json_data);
  return { cid: cid, data: dataBytes };
}

function featureDetectionMessageBody(targetDID: string): object {
    return {
      "target": targetDID,
      "messages": [
        {
            descriptor: {
                "target": targetDID,
                "method": "FeatureDetectionRead"
            }
        }
      ]
    }
  }

  function makeBase64UrlStringFromObject(o: object): string {
    const jsonString = JSON.stringify(o);
    const bytes = new TextEncoder().encode(jsonString);
    const base64 = base64url.baseEncode(bytes);
    return base64
  }

  type GeneralJws = {
    payload: string
    signatures: Signature[]
  };

  /**
   * Flattened JWS definition for verify function inputs, allows payload as
   * Uint8Array for detached signature validation.
   */
  type Signature = {
    /**
     * The "protected" member MUST be present and contain the value
     * BASE64URL(UTF8(JWS Protected Header)) when the JWS Protected
     * Header value is non-empty; otherwise, it MUST be absent.  These
     * Header Parameter values are integrity protected.
     */
    protected: string

    /**
     * The "signature" member MUST be present and contain the value
     * BASE64URL(JWS Signature).
     */
    signature: string
  };

  function prettyPrintJson(key :string, o: object) {
    console.log(key, JSON.stringify(o, null, 2));
  }

  async function makeJWS(message: object, keyPair: JWK, did: string): Promise<GeneralJws> {

    // TODO: check keyPair to see which algorithm to use

    const cid = await generateCid(message);
    const payload = {descriptorCid: cid.toV1().toString()};
    const protectedHeader = { alg: 'Ed25519', kid: did };

   const protectedHeaderBase64UrlString = makeBase64UrlStringFromObject(protectedHeader)
   const payloadBase64UrlString = makeBase64UrlStringFromObject(payload)
 
   const signingInputBase64urlString = `${protectedHeaderBase64UrlString}.${payloadBase64UrlString}`;
   const signingInputBytes = new TextEncoder().encode(signingInputBase64urlString);
 
   const signatureBytes = await ed.sign(signingInputBytes, Buffer.from(keyPair.d, 'base64'));

    return {
      payload: payloadBase64UrlString,
      signatures: [
        {
          protected: protectedHeaderBase64UrlString,
          signature: base64url.baseEncode(signatureBytes)
        }
      ]
    };
}


async function writeVCMessageBody(vc: VC, keyPair: JWK, did: string): Promise<object> {
  const dataCid = await makeDataCID(JSON.stringify(vc));

  const descriptor = {
    "nonce": randomUUID(),
    "method": "CollectionsWrite",
    "schema": vc['@context'][0],
    "recordId": randomUUID(),  // TODO: how to remember the recordId for this object?
    "dataCid": Buffer.from(dataCid.cid.bytes).toString('base64'),
    "dateCreated": new Date(vc['issuanceDate']).getTime(),
    "dataFormat": "application/json"
  };

  return makeRequestBody(descriptor, keyPair, did, Buffer.from(dataCid.data).toString('base64'));
}

async function makeRequestBody(descriptor: DescriptorBase, keyPair: JWK, did: string, data?: string): Promise<object> {

  const jws = await makeJWS(descriptor, keyPair, did);

  const messageBody: MessageSchema = {
    "descriptor": descriptor,
    "authorization": jws
  }

  if (data) {
    messageBody['data'] = data;
  }

  // TODO: handle multiple messages
  const requestBody  = {
    "target": did,
    "messages": [
      messageBody
    ]
  }

  return requestBody;
}

async function permissionsRequestMessageBody(keyPair: JWK, did: string, method: string, schema: string): Promise<object> {

  const descriptor = {
    "method": "PermissionsRequest",
    "permissionRequestId": randomUUID(),
    "grantedBy": "did:example:alice", // TODO: get the owner of the DWN
    "grantedTo": did,
    "scope": {
      "method": method,
      "schema": schema
    },
    "dataFormat": "application/json"
  };
  return makeRequestBody(descriptor, keyPair, did);
}


async function makeCollectionQueryMessageBody(keyPair: JWK, did: string): Promise<object> {
  const descriptor = {
    "nonce": randomUUID(),
    "method": "CollectionsQuery",
    "filter": {"dataFormat": "application/json"}
  };

  return makeRequestBody(descriptor, keyPair, did);
}

export const getDWNPlugin = (config: DWNConfig): DWNPlugin => {

  const  postOneRequest = async (request: object, request_name?: string): Promise<MessageReply> => {
    const result = await fetch(config.dwnAddressURL!, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      } })
    return result.json()
  }

  const makeResponseURI = (response: any): string => {
    // TODO: what is the propery URI for a DWN object?
    return config.dwnAddressURL!.toString() + '/response/' + response.id
  }

  // TODO: what is the type of learnCard?
  const optionalDid = (learnCard: any, did?: string): string => {
    return did ? did : learnCard.invoke.getSubjectDid('key')
  }

  const optionalKeyPair = (learnCard: any, keyPair?: JWK): JWK => {
    return keyPair ? keyPair : learnCard.invoke.getSubjectKeypair('ed25519')
  }

  return {
    name: "DWNPlugin",
    store: {
      upload: async (_learnCard, vc: VC) => {
        _learnCard.debug?.('learnCard.store.DWNPlugin.upload');
          const vc_message = await writeVCMessageBody(vc, _learnCard.invoke.getSubjectKeypair('ed25519'), _learnCard.invoke.getSubjectDid('key'));
          const response = await postOneRequest(vc_message);
          return makeResponseURI(response)
      },
  },
    methods: {
        writeVCMessageBody: async (_learnCard, vc: VC, keyPair?: JWK, did?: string): Promise<object> => {
          return await writeVCMessageBody(vc, keyPair || _learnCard.invoke.getSubjectKeypair('ed25519'), did || _learnCard.invoke.getSubjectDid('key'));
        },
        featureDetectionMessageBody: async (_learnCard, did?:string): Promise<object> => {
          return featureDetectionMessageBody(did || _learnCard.invoke.getSubjectDid('key'))
        },
        postDWNRequest: async (_learnCard, request: object, request_name?: string): Promise<object> => {
          return await postOneRequest(request, request_name);
        },
        featureDetectionRead: async (_learnCard): Promise<object> => {
            return postOneRequest(featureDetectionMessageBody(_learnCard.invoke.getSubjectDid('key')))
        },
        collectionsQuery: async (_learnCard): Promise<object> => {
          return postOneRequest(await makeCollectionQueryMessageBody(_learnCard.invoke.getSubjectKeypair('ed25519'), _learnCard.invoke.getSubjectDid('key')))
        },
        permissionsRequestMessageBody: async (_learnCard, method: string, schema: string, keyPair?: JWK, did?: string): Promise<object> => {
          return permissionsRequestMessageBody(optionalKeyPair(_learnCard, keyPair), optionalDid(_learnCard, did), method, schema);
        },
        getSchemas: (_learnCard): object | undefined => {
          return config.schemas
        }
    },
}};

