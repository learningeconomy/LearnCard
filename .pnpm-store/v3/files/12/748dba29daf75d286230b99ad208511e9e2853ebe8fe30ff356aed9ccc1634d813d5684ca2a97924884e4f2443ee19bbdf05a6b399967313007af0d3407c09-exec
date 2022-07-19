import { PinApi } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';
import { PublishOpts } from '@ceramicnetwork/common';
export declare class RemotePinApi implements PinApi {
    private readonly _apiUrl;
    constructor(_apiUrl: URL);
    add(streamId: StreamID, force?: boolean): Promise<void>;
    rm(streamId: StreamID, opts?: PublishOpts): Promise<void>;
    ls(streamId?: StreamID): Promise<AsyncIterable<string>>;
}
//# sourceMappingURL=remote-pin-api.d.ts.map