type Status = {
    code: number
    message: string
  };

  export type BaseMessageSchema = {
    descriptor: {
      method: string;
      nonce?: string;
    };
  };
  
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