import { fetchJson } from '@ceramicnetwork/common';
export class RemotePinApi {
    constructor(_apiUrl) {
        this._apiUrl = _apiUrl;
    }
    async add(streamId, force) {
        const args = {};
        if (force) {
            args.force = true;
        }
        const url = new URL(`./pins/${streamId}`, this._apiUrl);
        await fetchJson(url, {
            method: 'post',
            body: args,
        });
    }
    async rm(streamId, opts) {
        const url = new URL(`./pins/${streamId}`, this._apiUrl);
        await fetchJson(url, {
            method: 'delete',
            body: { opts },
        });
    }
    async ls(streamId) {
        let url = new URL('./pins', this._apiUrl);
        if (streamId) {
            url = new URL(`./pins/${streamId.toString()}`, this._apiUrl);
        }
        const result = await fetchJson(url);
        const { pinnedStreamIds } = result;
        return {
            [Symbol.asyncIterator]() {
                let index = 0;
                return {
                    next() {
                        if (index === pinnedStreamIds.length) {
                            return Promise.resolve({ value: null, done: true });
                        }
                        return Promise.resolve({ value: pinnedStreamIds[index++], done: false });
                    },
                };
            },
        };
    }
}
//# sourceMappingURL=remote-pin-api.js.map