import cloneDeep from 'lodash.clonedeep';
import * as u8a from 'uint8arrays';
import { toCID } from './cid-utils.js';
import { AnchorStatus } from '../stream.js';
import { StreamID, StreamType } from '@ceramicnetwork/streamid';
const TILE_TYPE_ID = 0;
export class StreamUtils {
    static streamIdFromState(state) {
        return new StreamID(state.type, state.log[0].cid);
    }
    static serializeCommit(commit) {
        const cloned = cloneDeep(commit);
        if (StreamUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = cloned.jws.link.toString();
            cloned.linkedBlock = u8a.toString(cloned.linkedBlock, 'base64');
            if (cloned.cacaoBlock) {
                cloned.cacaoBlock = u8a.toString(cloned.cacaoBlock, 'base64');
            }
            return cloned;
        }
        if (StreamUtils.isSignedCommit(commit)) {
            cloned.link = cloned.link.toString();
        }
        if (StreamUtils.isAnchorCommit(commit)) {
            cloned.proof = cloned.proof.toString();
        }
        if (cloned.id) {
            cloned.id = cloned.id.toString();
        }
        if (cloned.prev) {
            cloned.prev = cloned.prev.toString();
        }
        if (commit.header?.model) {
            cloned.header.model = commit.header.model.toString();
        }
        return cloned;
    }
    static deserializeCommit(commit) {
        const cloned = cloneDeep(commit);
        if (StreamUtils.isSignedCommitContainer(cloned)) {
            cloned.jws.link = toCID(cloned.jws.link);
            cloned.linkedBlock = u8a.fromString(cloned.linkedBlock, 'base64');
            if (cloned.cacaoBlock) {
                cloned.cacaoBlock = u8a.fromString(cloned.cacaoBlock, 'base64');
            }
            return cloned;
        }
        if (StreamUtils.isSignedCommit(cloned)) {
            cloned.link = toCID(cloned.link);
        }
        if (StreamUtils.isAnchorCommit(cloned)) {
            cloned.proof = toCID(cloned.proof);
        }
        if (cloned.id) {
            cloned.id = toCID(cloned.id);
        }
        if (cloned.prev) {
            cloned.prev = toCID(cloned.prev);
        }
        if (cloned.header?.model) {
            cloned.header.model = StreamID.fromString(cloned.header.model);
        }
        return cloned;
    }
    static serializeState(state) {
        const cloned = cloneDeep(state);
        cloned.log = cloned.log.map((entry) => ({ ...entry, cid: entry.cid.toString() }));
        if (cloned.anchorStatus != null) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
        }
        if (cloned.anchorScheduledFor != null) {
            cloned.anchorScheduledFor = new Date(cloned.anchorScheduledFor).toISOString();
        }
        if (cloned.anchorProof != null) {
            cloned.anchorProof.txHash = cloned.anchorProof.txHash.toString();
            cloned.anchorProof.root = cloned.anchorProof.root.toString();
        }
        if (state.metadata?.model) {
            cloned.metadata.model = state.metadata.model.toString();
        }
        if (state.next?.metadata?.model) {
            cloned.next.metadata.model = state.next.metadata.model.toString();
        }
        if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
            cloned.metadata.unique = u8a.toString(cloned.metadata.unique, 'base64');
        }
        cloned.doctype = StreamType.nameByCode(cloned.type);
        return cloned;
    }
    static deserializeState(state) {
        const cloned = cloneDeep(state);
        if (cloned.doctype) {
            cloned.type = StreamType.codeByName(cloned.doctype);
            delete cloned.doctype;
        }
        cloned.log = cloned.log.map((entry) => ({ ...entry, cid: toCID(entry.cid) }));
        if (cloned.anchorProof) {
            cloned.anchorProof.txHash = toCID(cloned.anchorProof.txHash);
            cloned.anchorProof.root = toCID(cloned.anchorProof.root);
        }
        let showScheduledFor = true;
        if (cloned.anchorStatus) {
            cloned.anchorStatus = AnchorStatus[cloned.anchorStatus];
            showScheduledFor =
                cloned.anchorStatus !== AnchorStatus.FAILED && cloned.anchorStatus !== AnchorStatus.ANCHORED;
        }
        if (cloned.anchorScheduledFor) {
            if (showScheduledFor) {
                cloned.anchorScheduledFor = Date.parse(cloned.anchorScheduledFor);
            }
            else {
                delete cloned.anchorScheduledFor;
            }
        }
        if (state.metadata?.model) {
            cloned.metadata.model = StreamID.fromString(state.metadata.model);
        }
        if (state.next?.metadata?.model) {
            cloned.next.metadata.model = StreamID.fromString(state.next.metadata.model);
        }
        if (state.metadata?.unique && state.type != TILE_TYPE_ID) {
            cloned.metadata.unique = u8a.fromString(state.metadata.unique, 'base64');
        }
        return cloned;
    }
    static statesEqual(state1, state2) {
        return (JSON.stringify(StreamUtils.serializeState(state1)) ===
            JSON.stringify(StreamUtils.serializeState(state2)));
    }
    static isStateSupersetOf(state, base) {
        if (state.log.length < base.log.length) {
            return false;
        }
        for (const i in base.log) {
            if (!state.log[i].cid.equals(base.log[i].cid)) {
                return false;
            }
        }
        if (state.anchorStatus != base.anchorStatus) {
            return false;
        }
        return true;
    }
    static assertCommitLinksToState(state, commit) {
        const streamId = this.streamIdFromState(state);
        if (commit.id && !commit.id.equals(state.log[0].cid)) {
            throw new Error(`Invalid genesis CID in commit for StreamID ${streamId.toString()}. Found: ${commit.id}, expected ${state.log[0].cid}`);
        }
        const expectedPrev = state.log[state.log.length - 1].cid;
        if (!commit.prev.equals(expectedPrev)) {
            throw new Error(`Commit doesn't properly point to previous commit in log. Expected ${expectedPrev}, found 'prev' ${commit.prev}`);
        }
    }
    static async convertCommitToSignedCommitContainer(commit, ipfs) {
        if (StreamUtils.isSignedCommit(commit)) {
            const block = await ipfs.block.get(commit.link);
            return {
                jws: commit,
                linkedBlock: block,
            };
        }
        return commit;
    }
    static isSignedCommitContainer(commit) {
        return commit && commit.jws !== undefined;
    }
    static isSignedCommit(commit) {
        return commit && commit.link !== undefined;
    }
    static isAnchorCommit(commit) {
        return commit && commit.proof !== undefined;
    }
    static isSignedCommitData(commitData) {
        return commitData && commitData.envelope !== undefined;
    }
    static isAnchorCommitData(commitData) {
        return commitData && commitData.proof !== undefined;
    }
}
//# sourceMappingURL=stream-utils.js.map