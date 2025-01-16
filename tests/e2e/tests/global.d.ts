declare module 'hex-lite' {
    function toUint8Array(hex: string): Uint8Array;
    function fromUint8Array(array: Uint8Array): string;
    function toBuffer(hex: string): ArrayBuffer;
    function fromBuffer(buffer: ArrayBuffer): string;
}
