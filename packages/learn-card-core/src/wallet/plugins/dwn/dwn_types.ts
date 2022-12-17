import { GeneralJWS } from "dids";

type Status = {
    code: number
    message: string
  };

export type DescriptorBase = {
  method: string;
  nonce?: string;
}

export type BaseMessageSchema = {
  recordId: string
  descriptor: DescriptorBase
};

export type MessageSchema = BaseMessageSchema & {
  data?: string;
  authorization: GeneralJWS;
}

type MessageReplyOptions = {
  status: Status,
  entries?: BaseMessageSchema[];
};

export class MessageReply {
  status: Status;
  // resulting message entries returned from the invocation of the corresponding message
  // e.g. the resulting messages from a CollectionsQuery
  entries?: BaseMessageSchema[];

  constructor(opts: MessageReplyOptions) {
    const { status, entries } = opts;

    this.status = status;
    this.entries = entries;
  }
}

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