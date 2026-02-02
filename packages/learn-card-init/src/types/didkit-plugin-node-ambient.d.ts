declare module '@learncard/didkit-plugin-node' {
  export const getDidKitPlugin: (
    input?: unknown,
    allowRemoteContexts?: boolean
  ) => Promise<import('@learncard/didkit-plugin').DIDKitPlugin>;
}
