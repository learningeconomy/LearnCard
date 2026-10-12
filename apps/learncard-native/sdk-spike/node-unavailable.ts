/** Browser SDK uses bundled WASM. Node N-API bindings cannot execute inside an iOS app. */
export const getDidKitPlugin = (): never => {
    throw new Error('Node DIDKit is unavailable in the mobile SDK runtime');
};
