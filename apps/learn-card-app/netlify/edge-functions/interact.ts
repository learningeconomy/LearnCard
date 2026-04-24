import type { Config, Context } from "@netlify/edge-functions";

import { resolveTenantConfig, getTenantOrigin } from './shared/tenant-resolver.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Function to extract the workflowId and interactionId from the URL
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
  // Regex to match '/interactions/{workflowId}/{interactionId}'
  // workflowId: alphanumeric
  // interactionId: base64url characters
  const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);
  
  if (match && match[1] && match[2]) {
      return {
          workflowId: match[1],  // The first capturing group
          interactionId: match[2], // The second capturing group
      };
  }
  return null;
};

/**
 * Resolve the LCN API URL for the current tenant.
 * Priority: env override → tenant config → deploy-context fallback.
 */
function getLCNApiUrl(context: Context, hostname: string): string {
  if (Netlify.env.has("LCN_API_URL")) {
    return Netlify.env.get("LCN_API_URL");
  }

  const tenantConfig = resolveTenantConfig(hostname);
  const apis = tenantConfig.apis as Record<string, unknown> | undefined;

  if (apis?.brainServiceApi) {
    return apis.brainServiceApi as string;
  }

  const env = context.deploy.context;
  if (env === "dev") {
    return "http://localhost:4000/api";
  }

  return "https://network.learncard.com/api";
}

export default async (request: Request, context: Context) => {
  // Guardian credential approval is handled by the SPA router, not VC-API
  const url = new URL(request.url);
  if (url.pathname.startsWith('/interactions/guardian-credential-approval')) {
    return context.next();
  }

  const acceptHeader = request.headers.get("Accept");
  const interactionUrl = request.url; // e.g., https://learncard.app/interactions/claim/z8n38Dp7a?iuv=1

  const parsedData = parseInteractionUrl(interactionUrl);
  const hostname = new URL(interactionUrl).hostname;
  const LCN_API_URL = getLCNApiUrl(context, hostname);

  if (!parsedData) {
    return new Response("Invalid interaction URL format.", { 
        status: 400,
        headers: { "Content-Type": "text/plain", ...corsHeaders },
    });
  }

  const { workflowId, interactionId } = parsedData;
  const vcapiUrl = `${LCN_API_URL}/workflows/${workflowId}/exchanges/${interactionId}`;

  const tenantOrigin = getTenantOrigin(interactionUrl);

  // If the client is an interoperable wallet asking for JSON data
  if (acceptHeader?.includes("application/json")) {
    console.log(`Fetching protocols for interaction ID: ${interactionId} (tenant: ${tenantOrigin})`);
    const protocols = {
      protocols: {
        vcapi: vcapiUrl
      }
    };
    return new Response(JSON.stringify(protocols), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Redirect to the request page on the tenant's own origin
  const redirectTo = `${tenantOrigin}/request?vc_request_url=${encodeURIComponent(vcapiUrl)}`;
  return Response.redirect(redirectTo, 301);
};

export const config: Config = {
  path: "/interactions/*",
};
