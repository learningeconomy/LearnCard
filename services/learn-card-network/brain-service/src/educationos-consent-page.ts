import { randomBytes } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { neogma } from '@instance';
import { environment } from '@environment';
import { readGovernedAgreement } from '@helpers/consent-exchange.helpers';
import { constructUri } from '@helpers/uri.helpers';
import { RecordProvisioningBindingMetadataValidator } from '@learncard/types';

const escape = (value: string): string =>
    value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`);

type DataUse = { partner: string; fields: string[]; retentionDays: number; purpose: string };

/** What the learner agrees to, from the ACTIVE record lanes approved under this agreement. */
const readDataUses = async (contractId: string): Promise<DataUse[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (b:Binding {status: 'ACTIVE', capability: 'record-provisioning'})
               -[:APPROVED_WITH]->(s:BindingConsentPreflight)
         WHERE s.snapshot CONTAINS $exactContract
         OPTIONAL MATCH (b)-[:BINDS_PROVIDER]->(install:IntegrationInstall)
         OPTIONAL MATCH (l:AppStoreListing {listing_id: install.listingId})
         RETURN DISTINCT b.capabilityMetadata AS metadata, l.display_name AS partner`,
        // Exact field match: a bare substring could pick up other agreements' approvals.
        { exactContract: `"governanceContractId":${JSON.stringify(contractId)}` }
    );
    return result.records.flatMap(row => {
        const metadata = RecordProvisioningBindingMetadataValidator.safeParse(
            JSON.parse(String(row.get('metadata') ?? 'null'))
        );
        const declaration = metadata.success ? metadata.data.transactional : undefined;
        if (!declaration) return [];
        const partner: unknown = row.get('partner');
        return [
            {
                partner: typeof partner === 'string' ? partner : 'A connected partner',
                fields: declaration.fields,
                retentionDays: declaration.retentionDays,
                purpose: declaration.purpose,
            },
        ];
    });
};

/** JSON for an inline script: `<` escaped so no value can close the script element. */
const scriptJson = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const page = (input: {
    nonce: string;
    contractId: string;
    agreement: NonNullable<Awaited<ReturnType<typeof readGovernedAgreement>>>;
    uses: DataUse[];
    appConsentUrl?: string;
}): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(input.agreement.name)}</title>
<style>body{font-family:system-ui;max-width:36rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
.use{border:1px solid #ddd;border-radius:.5rem;padding:.75rem 1rem;margin:.75rem 0}
button,a.button{display:inline-block;margin:.5rem .5rem 0 0;padding:.6rem 1.1rem;border-radius:.4rem;
border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;font:inherit;text-decoration:none;cursor:pointer}
a.secondary{background:#fff;color:#1d4ed8}code{word-break:break-all}.muted{color:#555}</style></head>
<body>
<p class="muted">${escape(input.agreement.ecosystemName)}</p>
<h1>${escape(input.agreement.name)}</h1>
${input.agreement.subtitle ? `<p><strong>${escape(input.agreement.subtitle)}</strong></p>` : ''}
${input.agreement.description ? `<p>${escape(input.agreement.description)}</p>` : ''}
${
    input.uses.length
        ? input.uses
              .map(
                  use => `<div class="use"><strong>${escape(use.partner)}</strong> shares
<em>${use.fields.map(escape).join(', ')}</em>. Kept ${use.retentionDays} days.
<div class="muted">${escape(use.purpose)}</div></div>`
              )
              .join('')
        : '<p class="muted">No data is currently shared under this agreement.</p>'
}
<p>You can withdraw at any time. Nothing is shared about you until you allow it.</p>
<div id="actions">
<button id="allow">Allow with my wallet</button>
${input.appConsentUrl ? `<a class="button secondary" href="${escape(input.appConsentUrl)}">Open in LearnCard</a>` : ''}
</div>
<div id="wallet" hidden><p>Open this link in your wallet to confirm:</p><p><code id="url"></code></p>
<button id="copy">Copy link</button><p id="status" class="muted">Waiting for your wallet…</p></div>
<script nonce="${input.nonce}">
const contractId = ${scriptJson(input.contractId)};
document.getElementById('allow').onclick = async () => {
  const res = await fetch('/api/educationos/consent-exchanges', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contractId }) });
  if (!res.ok) { document.getElementById('status').textContent = 'Could not start.'; return; }
  const { exchangeId, exchangeUrl, statusToken } = await res.json();
  document.getElementById('actions').hidden = true;
  document.getElementById('wallet').hidden = false;
  document.getElementById('url').textContent = exchangeUrl;
  document.getElementById('copy').onclick = () => navigator.clipboard.writeText(exchangeUrl);
  const poll = setInterval(async () => {
    const s = await (await fetch('/api/educationos/consent-exchanges/' + exchangeId +
      '?statusToken=' + encodeURIComponent(statusToken))).json();
    const el = document.getElementById('status');
    if (s.status === 'COMPLETED') {
      el.textContent = 'Consent recorded for the wallet that responded: ' + s.holderDid +
        '. If that is not your wallet, start again.'; clearInterval(poll); }
    else if (s.status === 'FAILED' || s.status === 'EXPIRED') {
      el.textContent = 'Not completed (' + (s.reason || s.status) + '). Please try again.'; clearInterval(poll); }
  }, 2000);
};
</script>
</body></html>`;

const ParamsValidator = z.object({ contractId: z.string().min(1).max(200) });

/**
 * EducationOS-hosted learner consent page (RFC 2026-10 Stage 5, neutrality N5). Any wallet
 * that speaks VC-API DID authentication can consent; LearnCard users may use the app screen.
 */
export const educationOsConsentPagePlugin: FastifyPluginAsync = async fastify => {
    fastify.get('/educationos/consent/:contractId', async (request, reply) => {
        const params = ParamsValidator.safeParse(request.params);
        if (!params.success) return reply.status(404).send();
        const agreement = await readGovernedAgreement(params.data.contractId);
        if (!agreement) return reply.status(404).send('Agreement not found.');

        const domain = environment.DOMAIN_NAME ?? `localhost%3A${environment.PORT}`;
        // Same client-app origin rule as guardian approval links; no button when unconfigured.
        const appDomain = environment.CLIENT_APP_DOMAIN_NAME;
        const appUrl = appDomain
            ? `${environment.IS_OFFLINE ? 'http' : 'https'}://${appDomain}`
            : undefined;
        const appConsentUrl = appUrl
            ? `${appUrl.replace(/\/$/, '')}/consent-flow?uri=${encodeURIComponent(
                  constructUri('contract', params.data.contractId, domain)
              )}`
            : undefined;

        const nonce = randomBytes(16).toString('base64');
        return reply
            .header('content-type', 'text/html; charset=utf-8')
            .header('cache-control', 'no-store')
            .header(
                'content-security-policy',
                `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'`
            )
            .send(
                page({
                    nonce,
                    contractId: params.data.contractId,
                    agreement,
                    uses: await readDataUses(params.data.contractId),
                    appConsentUrl,
                })
            );
    });
};
