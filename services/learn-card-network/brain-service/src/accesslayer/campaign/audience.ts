import { TRPCError } from '@trpc/server';
import { int } from 'neo4j-driver';
import {
    CampaignAudienceSourceValidator,
    type CampaignAudienceSource,
    type PaginatedCampaignAudience,
} from '@learncard/types';

import { neogma } from '@instance';
import { traceDb } from '@tracing';
import { getDidWeb } from '@helpers/did.helpers';
import { constructUri, getUriParts } from '@helpers/uri.helpers';
import type { CampaignAudienceQuery } from 'types/campaign';
import {
    assertCampaignEditable,
    campaignAgePredicate,
    campaignTimeParams,
    lockCampaign,
    withCampaignTransaction,
} from './shared';
import { getCampaign } from './read';

const canonicalNetworkDomain = (domain: string): string => {
    const decodedDomain = domain.replace(/\/trpc$/, '').replace(/%3A/gi, ':');

    return getUriParts(constructUri('boost', 'domain-check', decodedDomain)).domain;
};

export const buildCampaignAudienceQuery = (
    rawSource: CampaignAudienceSource,
    domain: string
): CampaignAudienceQuery => {
    const source = CampaignAudienceSourceValidator.parse(rawSource);
    switch (source.type) {
        case 'dids':
            return {
                match: `MATCH (p:Profile) WHERE p.did IN $dids OR ($didWebPrefix + p.profileId) IN $dids`,
                params: { dids: source.dids, didWebPrefix: getDidWeb(domain, '') },
            };
        case 'emails':
            return {
                match: `MATCH (p:Profile)-[:HAS_CONTACT_METHOD]->(contact:ContactMethod)
                    WHERE contact.type = 'email' AND contact.isVerified = true
                      AND toLower(trim(contact.value)) IN $emails`,
                params: { emails: source.emails },
            };
        case 'inboxClaims':
            return {
                match: `MATCH (p:Profile)-[claim:CLAIMED_INBOX_CREDENTIAL]->(inbox:InboxCredential)
                    WHERE inbox.issuerDid = $issuerDid AND ($since IS NULL OR claim.timestamp >= $since)`,
                params: { issuerDid: source.issuerDid, since: source.since ?? null },
            };
        default: {
            let match: string;
            const params: Record<string, unknown> = { includePending: source.includePending };
            if (source.type === 'boostRecipients') {
                const uri = getUriParts(source.boostUri);
                if (
                    uri.type !== 'boost' ||
                    canonicalNetworkDomain(uri.domain) !== canonicalNetworkDomain(domain)
                ) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'A boost URI from this network is required',
                    });
                }
                match = `MATCH (boost:Boost {id: $boostId})<-[:INSTANCE_OF]-(credential:Credential)<-[sent:CREDENTIAL_SENT]-(sender)
                    WHERE sender:Profile OR sender:AppStoreListing`;
                params.boostId = uri.id;
            } else {
                match = source.senderProfileId
                    ? `MATCH (sender:Profile {profileId: $senderId})-[sent:CREDENTIAL_SENT]->(credential:Credential)`
                    : `MATCH (sender:AppStoreListing {listing_id: $senderId})-[sent:CREDENTIAL_SENT]->(credential:Credential)`;
                params.senderId = source.senderProfileId ?? source.listingId;
                params.since = source.since ?? null;
                params.metadata = source.metadata ?? {};
                match += ` WHERE ($since IS NULL OR sent.date >= $since)
                    AND all(key IN keys($metadata) WHERE sent['metadata.' + key] = $metadata[key])`;
            }
            return {
                match: `${match}
                MATCH (p:Profile {profileId: sent.to})
                OPTIONAL MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(p)
                WITH p, sent, received
                WHERE coalesce(sent.status, '') <> 'revoked'
                  AND coalesce(received.status, '') <> 'revoked'
                  AND ($includePending OR (received IS NOT NULL AND coalesce(received.status, '') <> 'pending'))`,
                params,
            };
        }
    }
};

export const previewCampaignAudience = async (
    campaignId: string,
    source: CampaignAudienceSource,
    domain: string
): Promise<number> => {
    await getCampaign(campaignId);
    const query = buildCampaignAudienceQuery(source, domain);
    const result = await traceDb('campaign:previewAudience', () =>
        neogma.queryRunner.run(
            `${query.match} WITH DISTINCT p MATCH (c:Campaign {id: $campaignId})
         WHERE ${campaignAgePredicate} RETURN count(p) AS count`,
            { ...query.params, campaignId, ...campaignTimeParams() }
        )
    );
    return result.records[0]!.get('count').toNumber();
};

export const addCampaignAudience = async (
    campaignId: string,
    source: CampaignAudienceSource,
    domain: string
): Promise<number> => {
    const query = buildCampaignAudienceQuery(source, domain);
    return withCampaignTransaction('campaign:addAudience', async transaction => {
        assertCampaignEditable(await lockCampaign(transaction, campaignId));
        const result = await transaction.run(
            `${query.match} WITH DISTINCT p MATCH (c:Campaign {id: $campaignId})
             WHERE ${campaignAgePredicate}
             MERGE (p)-[audience:IN_CAMPAIGN_AUDIENCE]->(c)
             ON CREATE SET audience.addedAt = $now, audience.source = $source
             RETURN count(p) AS count`,
            { ...query.params, campaignId, source: source.type, ...campaignTimeParams() }
        );
        return result.records[0]!.get('count').toNumber();
    });
};

export const pageCampaignAudience = async (
    campaignId: string,
    cursor?: string,
    limit = 100
): Promise<PaginatedCampaignAudience> => {
    await getCampaign(campaignId);
    const result = await traceDb('campaign:pageAudience', () =>
        neogma.queryRunner.run(
            `MATCH (p:Profile)-[:IN_CAMPAIGN_AUDIENCE]->(c:Campaign {id: $campaignId})
         WHERE ($cursor IS NULL OR p.profileId > $cursor) AND ${campaignAgePredicate}
         RETURN DISTINCT p.profileId AS profileId, p.did AS did ORDER BY profileId LIMIT $limit`,
            { campaignId, cursor: cursor ?? null, limit: int(limit + 1), ...campaignTimeParams() }
        )
    );
    const rows = result.records.map(record => ({
        profileId: record.get('profileId') as string,
        did: record.get('did') as string,
    }));
    const hasMore = rows.length > limit;
    const records = rows.slice(0, limit);
    return { records, hasMore, cursor: hasMore ? records.at(-1)?.profileId : undefined };
};
