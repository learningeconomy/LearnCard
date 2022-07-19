import { StreamUtils, fetchJson } from '@ceramicnetwork/common';
export class RemoteIndexApi {
    constructor(apiUrl) {
        this._fetchJson = fetchJson;
        this._collectionURL = new URL('./collection', apiUrl);
    }
    async queryIndex(query) {
        const queryURL = new URL(this._collectionURL);
        for (const key in query) {
            queryURL.searchParams.set(key, query[key]);
        }
        const response = await this._fetchJson(queryURL);
        const edges = response.edges.map((e) => {
            return {
                cursor: e.cursor,
                node: StreamUtils.deserializeState(e.node),
            };
        });
        return {
            edges: edges,
            pageInfo: response.pageInfo,
        };
    }
}
//# sourceMappingURL=remote-index-api.js.map