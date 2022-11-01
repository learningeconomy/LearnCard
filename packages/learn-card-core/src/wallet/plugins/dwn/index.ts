import { DWNConfig, DWNPlugin, DWNPluginMethods } from './types';

function featureDetectionMessageBody(targetDID: string): any {
    return {
      "target": targetDID,
      "messages": [
        {
            descriptor: {
                "target": targetDID,
                "method": "FeatureDetectionRead"
            },
        }
      ]
    }
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
    methods: {
        featureDetectionRead: async (): Promise<string> => {
            return await postOneRequest(featureDetectionMessageBody('did:dwn:'))
        }
    },
}};