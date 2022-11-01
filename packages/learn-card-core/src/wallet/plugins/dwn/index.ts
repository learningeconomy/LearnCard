import { DWNConfig, DWNPlugin, DWNPluginMethods } from './types';
import { generateCid } from "./cid";
import { CID } from 'multiformats/cid';

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

  async function makeTestJWS(payload: object, keyPair: KeyPair, did: string): Promise<string> {
    const cid = await generateCid(payload);
    const { privateJwk, publicJwk } = keyPair;
    const payloadBytes = new TextEncoder().encode(JSON.stringify({descriptorCid: cid.toV1().toString()}));
    const protectedHeader = { alg: 'ES256K', kid: `${did}#key1` };

    const signer = await GeneralJwsSigner.create(payloadBytes, [{ jwkPrivate: privateJwk, protectedHeader }]);
    return signer.getJws();
}

  async function makeWriteVCMessageBody(data: any, keyPair: KeyPair, did: string): Promise<string> {
    const dataCid = await makeDataCID(JSON.stringify(data));

    const descriptor = {
      "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
      "method": "CollectionsWrite",
      "schema": SCHEMA_URL,
      "recordId": "b6464162-84af-4aab-aff5-f1f8438dfc1e",
      "dataCid": Buffer.from(dataCid.cid.bytes).toString('base64'),
      "dateCreated": 123456789,
      "dataFormat": "application/json"
    };

    const jws = await makeTestJWS(descriptor, keyPair, did);
    
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

    return JSON.stringify(messageBody);
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
      upload: async (_learnCard, vc) => {
          _learnCard.debug?.('learnCard.store.DWNPlugin.upload');
          await postOneRequest(await makeWriteVCMessageBody(vc, aliceKey, aliceDid));
      },
  },
    methods: {
        featureDetectionRead: async (): Promise<string> => {
            return await postOneRequest(featureDetectionMessageBody('did:web:pete'))
        }
    },
}};