import { DWNConfig, DWNPlugin, DWNPluginMethods } from './types';
import { generateCid } from "./cid";
import { CID } from 'multiformats/cid';
import { JWK, VC } from '@learncard/types';
import { base64url } from 'multiformats/bases/base64';
import { ES256KSigner, createJWS, EdDSASigner } from 'did-jwt';
import { randomUUID } from 'crypto'

type DataCID = { cid: CID, data: Uint8Array }

export async function makeDataCID(json_data: string): Promise<DataCID> {
  const dataBytes = new TextEncoder().encode(json_data);
  const cid = await generateCid(json_data);
  return { cid: cid, data: dataBytes };
}

function featureDetectionMessageBody(targetDID: string): any {
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

  async function makeJWS(payload: object, keyPair: JWK, did: string): Promise<GeneralJws> {
    const cid = await generateCid(payload);
    const payloadBytes = makeBase64UrlStringFromObject({descriptorCid: cid.toV1().toString()});
    const protectedHeader = { alg: 'Ed25519', kid: did };

    prettyPrintJson("keyPair", keyPair);

    const privateKey = Buffer.from(keyPair.x + keyPair.d, 'base64').toString('hex');

    const signer = EdDSASigner(privateKey);

    const jws = await createJWS(payloadBytes, signer, protectedHeader);

    console.log(jws);

    const [signingInput, signature] = jws.split('.');

    return {
      payload: payloadBytes,
      signatures: [
        {
          protected: signingInput,
          signature: signature
        }
      ]
    };
}

async function makeWriteVCMessageBody(vc: VC, keyPair: JWK, did: string): Promise<object> {
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

  const jws = await makeJWS(descriptor, keyPair, did);

  const messageBody  = {
    "target": did,
    "messages": [
      {
        "data": Buffer.from(dataCid.data).toString('base64'),
        "descriptor": descriptor,
        "authorization": jws
      }
    ]
  }

  return messageBody;
}

export const getDWNPlugin = (config: DWNConfig): DWNPlugin => {
  const  postOneRequest = async (request: any, request_name?: string): Promise<string> => {
    const result = await fetch(config.dwnAddressURL!, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      } })
    return result.text()
  }
  return {
    name: "DWNPlugin",
    store: {
      upload: async (_learnCard, vc: VC) => {
        _learnCard.debug?.('learnCard.store.DWNPlugin.upload');
          // TODO: do we use an unsigned VC or a signed VC here? Both? Does it matter?
          const vc_message = await makeWriteVCMessageBody(vc, _learnCard.invoke.getSubjectKeypair('ed25519'), _learnCard.invoke.getSubjectDid('key'));
          prettyPrintJson('vc_message', vc_message);
          return await postOneRequest(vc_message);
      },
  },
    methods: {
        featureDetectionRead: async (): Promise<string> => {
            return await postOneRequest(featureDetectionMessageBody('did:web:pete'))
        }
    },
}};
