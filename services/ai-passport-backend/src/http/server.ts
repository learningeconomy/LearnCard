import { handleAdminWeb } from '../admin/web';
import { trustedOrigins } from '../auth/trusted-origin';
import { handleAdminRoute } from '../admin/routes';
import { serve } from 'bun';
import { z } from 'zod';
import { AUTH_COOKIE_NAME, AuthError, authService, getAuthLoginCookieName } from '../auth/service';
import {
    hasLeadingAiPassportProtocol,
    getWebSocketTicketProtocol,
    issueWebSocketTicket,
} from '../auth/websocketTicket';
import { db } from '../db';
import { NoEligibleInsightInputsError } from '../credentials/insight-eligibility';
import { fetchCredentials, getSuggestedTopics, parseFile } from '../credentials/service';
import websocketHandler, { getThreadClient, sendToThreadClients } from '../websocket';
import type { StartupSocketData } from '../websocket/startupOwnership';
import { getQdrantClient, checkQdrantHealth, createCollectionIfNotExists } from '../db/qdrant';
import { findSimilarMessages } from '../ai/embeddings';
import { EMBEDDINGS_DIMENSION, CREDENTIAL_COLLECTION_PREFIXES } from '../constants/collections';
import {
    AUTH_CHALLENGE_TTL_SECONDS,
    AUTH_SESSION_TTL_SECONDS,
    CHAT_MODEL,
    CORS_ORIGINS,
    DOMAIN,
    FORMATTING_MODEL,
    LCA_URL,
    LEARNCARD_CONTRACT_URI,
    PORT,
} from '../constants/env';
import { pathwaysProvider } from '../services/pathways/pathwaysProvider';
import { startCredentialIngestionJob } from '../workers/credentialIngestion';
import {
    enqueueConversationSummary,
    cancelConversationSummary,
} from '../workers/conversationSummary';
import { sendConversationSummary, generateAIInsightCredential } from '../services/awarding';
import { streamingAiCall } from '../ai';
import { runWithLocale } from '../ai/locale';
import { runWithAiPrivacyContext } from '../ai/privacy';
import { isAiProviderError, toAiErrorPayload } from '../ai/errors';
import type { AuthenticatedMessage, ChatMessage } from '@learncard/types';
import { generateAiAssessment, completeAssessment } from '../services/assessment';
import { getLearnCard } from '../learncard';
import { readOwnedBoostCredential } from '../learncard/external-artifacts';
import { AiConsentError } from '../learncard/consent';
import { handleMcpOAuthRoute } from '../mcp-server/oauth/backend-routes';
import {
    generateLearnerContextPrompt,
    LearnerContextPromptError,
    parseLearnerContextPromptRequest,
} from '../services/learnerContextPrompt';
import { getActiveSessionStatus, prepareThreadFinish } from '../services/sessionLifecycle';
import {
    getCredentialIngestionState,
    refreshCredentialIngestionState,
} from '../workers/credentialIngestionState';
import { dataLifecycleService } from '../services/dataLifecycle';
import { createDataDeletionResponse } from './dataDeletionResponse';
import {
    withOwnerOperation,
    isDataErasureRequested,
    isDataErasureRequestedError,
} from '../services/dataErasure';
import { logSafeEvent } from '../logging';
import { createAiInsightHttpResponse } from './aiInsightResponse';
import { createJsonResponse } from './jsonResponse';
import { authorizeFinishAssessment, getCredentialSubjectDid } from './finishAssessment';
import {
    createUploadRequestGuard,
    getUploadCapacityConfig,
    MAX_HTTP_REQUEST_BODY_BYTES,
} from './uploadRequest';
import { createHttpRequestBodyGuard } from './requestBody';
import { isCookieMutationOriginAllowed } from './cookieMutationOrigin';

const CredentialIngestionRequestValidator = z.object({
    source: z.enum(['app_open', 'consent', 'manual']).default('manual'),
});

// Create default collection on startup
async function initQdrant() {
    try {
        // Initialize client
        getQdrantClient();
        // Check health
        const isHealthy = await checkQdrantHealth();
        if (!isHealthy) {
            logSafeEvent('error', 'dependency_failed');
        } else {
            logSafeEvent('info', 'dependency_ready');

            // Create collections for credential embeddings
            await Promise.all([
                createCollectionIfNotExists(
                    CREDENTIAL_COLLECTION_PREFIXES.FULL_TEXT,
                    EMBEDDINGS_DIMENSION
                ),
                createCollectionIfNotExists(
                    CREDENTIAL_COLLECTION_PREFIXES.DOMAIN_SUMMARY,
                    EMBEDDINGS_DIMENSION
                ),
                createCollectionIfNotExists(
                    CREDENTIAL_COLLECTION_PREFIXES.KEY_CLAIMS,
                    EMBEDDINGS_DIMENSION
                ),
                createCollectionIfNotExists(
                    CREDENTIAL_COLLECTION_PREFIXES.TECHNICAL_METADATA,
                    EMBEDDINGS_DIMENSION
                ),
                createCollectionIfNotExists(
                    CREDENTIAL_COLLECTION_PREFIXES.COMPARISON_CONTEXT,
                    EMBEDDINGS_DIMENSION
                ),
            ]);

            logSafeEvent('info', 'dependency_ready');
        }
    } catch {
        logSafeEvent('error', 'dependency_failed');
    }
}

const getCorsHeaders = (req: Request): Record<string, string> => {
    const origin = req.headers.get('origin');
    const allowedOrigin =
        origin && isAllowedOrigin(origin) ? origin : (CORS_ORIGINS[0] ?? 'http://localhost:4321');

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Passport-CSRF, X-Upload-Reservation, fly-force-instance-id, sentry-trace, baggage',
        'Access-Control-Expose-Headers': 'Retry-After',
        Vary: 'Origin',
    };
};

const getCookie = (req: Request, name: string): string | undefined =>
    req.headers
        .get('cookie')
        ?.split(';')
        .map(cookie => cookie.trim().split('='))
        .find(([cookieName]) => cookieName === name)
        ?.slice(1)
        .join('=');

const getRequestSessionId = (req: Request): string | undefined => {
    const authorization = req.headers.get('authorization');

    if (authorization?.toLowerCase().startsWith('bearer ')) {
        return authorization.slice(7).trim() || undefined;
    }

    return getCookie(req, AUTH_COOKIE_NAME);
};

const redirectResponse = (
    location: string,
    corsHeaders: Record<string, string>,
    headers: Record<string, string> = {}
): Response =>
    new Response(null, {
        status: 302,
        headers: {
            ...corsHeaders,
            ...headers,
            'Cache-Control': 'no-store',
            Location: location,
        },
    });

function isAllowedOrigin(origin: string): boolean {
    return trustedOrigins(DOMAIN, CORS_ORIGINS).includes(origin);
}

const getSessionCookie = (sessionId: string): string =>
    [
        `${AUTH_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=None',
        `Max-Age=${AUTH_SESSION_TTL_SECONDS}`,
    ].join('; ');

const getLoginCookie = (challenge: string, binding: string): string =>
    [
        `${getAuthLoginCookieName(challenge)}=${encodeURIComponent(binding)}`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=None',
        `Max-Age=${AUTH_CHALLENGE_TTL_SECONDS}`,
    ].join('; ');

const clearLoginCookie = (challenge: string): string =>
    [
        `${getAuthLoginCookieName(challenge)}=`,
        'Path=/',
        'HttpOnly',
        'Secure',
        'SameSite=None',
        'Max-Age=0',
    ].join('; ');

const getAuthenticatedHeaders = (
    corsHeaders: Record<string, string>,
    challenge: string,
    sessionId: string
): Headers => {
    const headers = new Headers(corsHeaders);

    headers.append('Set-Cookie', getSessionCookie(sessionId));
    headers.append('Set-Cookie', clearLoginCookie(challenge));

    return headers;
};

const authenticationErrorResponse = (
    corsHeaders: Record<string, string>,
    challenge: string,
    error: AuthError
): Response => {
    const headers = new Headers({
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
    });

    headers.append('Set-Cookie', clearLoginCookie(challenge));

    return new Response(JSON.stringify({ error: error.code }), {
        status: 401,
        headers,
    });
};

const fragmentCallbackPage = (): Response =>
    new Response(
        `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Completing sign in</title></head>
<body>Completing sign in…
<script>
const vp = new URLSearchParams(location.hash.slice(1)).get("vp");
history.replaceState(null, "", location.pathname + location.search);
fetch(location.pathname + location.search, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ vp })
})
  .then(async response => {
    if (!response.ok) throw new Error("Authentication failed");
    return response.json();
  })
  .then(({ handoff, returnTo }) => {
    if (typeof handoff !== "string" || typeof returnTo !== "string") {
      throw new Error("Authentication failed");
    }
    const target = new URL(returnTo);
    const fragment = new URLSearchParams(target.hash.slice(1));
    fragment.set("ai_passport_handoff", handoff);
    target.hash = fragment.toString();
    location.replace(target);
  })
  .catch(() => { document.body.textContent = "Authentication failed"; });
</script>
</body>
</html>`,
        {
            headers: {
                'Cache-Control': 'no-store',
                'Content-Security-Policy':
                    "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
                'Content-Type': 'text/html; charset=utf-8',
                'Referrer-Policy': 'no-referrer',
            },
        }
    );

const aiErrorResponse = (
    error: unknown,
    operation: string,
    respond: (data: unknown, status: number) => Response
): Response | undefined => {
    if (!isAiProviderError(error)) return;

    const provider =
        error.provider === 'openai' || error.provider === 'anthropic' || error.provider === 'google'
            ? error.provider
            : undefined;
    logSafeEvent('warn', 'ai_operation_failed', { provider });

    return respond(toAiErrorPayload(error, { operation }), error.httpStatus);
};
export const startHttpServer = async () => {
    await initQdrant();
    const guardUploadRequest = createUploadRequestGuard(getUploadCapacityConfig());
    const guardHttpBody = createHttpRequestBodyGuard();

    process.once('SIGINT', async () => {
        await db.close();
        process.exit();
    });

    return serve<StartupSocketData>({
        maxRequestBodySize: MAX_HTTP_REQUEST_BODY_BYTES,
        async fetch(req, server) {
            const requestLocale = new URL(req.url).searchParams.get('locale');
            const corsHeaders = getCorsHeaders(req);
            const jsonResponse = (data: unknown, status = 200) =>
                createJsonResponse(data, status, corsHeaders);
            // Preserve the existing handler indentation so this safety wrapper remains
            // easy to review without reformatting the entire 800-line body.
            // prettier-ignore
            return guardHttpBody(req, jsonResponse, async (req) => runWithLocale(requestLocale, async () => {
      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      const url = new URL(req.url);
      // Reject ambient-cookie mutations before session lookups and any handlers.
      // CORS response headers alone cannot prevent simple cross-site POSTs.
      if (!isCookieMutationOriginAllowed(req, AUTH_COOKIE_NAME, isAllowedOrigin, new URL(DOMAIN).origin)) {
        return jsonResponse({ error: "Origin not allowed" }, 403);
      }
      const adminWeb = await handleAdminWeb(req);
      if (adminWeb) return adminWeb;
      const sessionId = getRequestSessionId(req);
      const session = await authService.getSession(sessionId);
      const did = session?.did;
      const adminResponse = await handleAdminRoute(req, session, sessionId);
      if (adminResponse) {
        Object.entries(corsHeaders).forEach(([key, value]) => adminResponse.headers.set(key, value));
        return adminResponse;
      }

      if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
        const origin = req.headers.get("origin");

        if (!origin || !isAllowedOrigin(origin)) {
          return jsonResponse({ error: "Origin not allowed" }, 403);
        }

        const protocolHeader = req.headers.get("sec-websocket-protocol");

        if (!hasLeadingAiPassportProtocol(protocolHeader)) {
          return jsonResponse(
            { error: "Required WebSocket subprotocol missing" },
            400,
          );
        }

        let socketDid = did;
        const ticket = getWebSocketTicketProtocol(protocolHeader);

        if (ticket) {
          try {
            socketDid = (
              await authService.consumeWebSocketTicket(ticket, origin)
            ).did;
          } catch (error) {
            if (error instanceof AuthError) {
              return jsonResponse({ error: error.code }, 401);
            }

            throw error;
          }
        }

        if (!socketDid) {
          return jsonResponse({ error: "Authentication required" }, 401);
        }

        const type = url.searchParams.get("type") ?? undefined;
        const threadId = url.searchParams.get("threadId") ?? undefined;
        const locale = url.searchParams.get("locale") ?? undefined;

        if (await isDataErasureRequested(socketDid)) {
          return jsonResponse({ error: "data_erasure_requested" }, 410);
        }
        if (threadId && !(await db.hasThread(socketDid, threadId))) {
          return jsonResponse({ error: "Not found" }, 404);
        }

        // Bun 1.3.5 automatically negotiates the first offered subprotocol.
        // Setting this response header manually emits it twice and causes
        // browsers to close the upgraded socket with protocol error 1002.
        if (
          server.upgrade(req, {
            data: { did: socketDid, type, threadId, locale },
          })
        ) {
          return;
        }

        return jsonResponse({ error: "WebSocket upgrade failed" }, 400);
      }

      if (url.pathname === "/auth/challenge") {
        if (req.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        const origin = req.headers.get("origin");

        if (!origin || !isAllowedOrigin(origin)) {
          return jsonResponse({ error: "Origin not allowed" }, 403);
        }

        const { binding, challenge, expiresAt } =
          await authService.createChallenge({
            audience: new URL(DOMAIN).origin,
            returnTo: origin,
          });

        return new Response(
          JSON.stringify({
            audience: new URL(DOMAIN).origin,
            binding,
            challenge,
            expiresAt,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            "Cache-Control": "no-store",
              "Set-Cookie": getLoginCookie(challenge, binding),
            },
          },
        );
      }

      if (url.pathname === "/auth/login") {
        if (req.method !== "GET") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        const requestedReturnTo = url.searchParams.get("returnTo");

        if (!requestedReturnTo) {
          return jsonResponse({ error: "returnTo is required" }, 400);
        }

        let returnTo: URL;

        try {
          returnTo = new URL(requestedReturnTo);
        } catch {
          return jsonResponse({ error: "Invalid returnTo" }, 400);
        }

        if (!isAllowedOrigin(returnTo.origin)) {
          return jsonResponse({ error: "returnTo origin not allowed" }, 400);
        }

        const { binding, challenge } = await authService.createChallenge({
          audience: new URL(DOMAIN).origin,
          returnTo: returnTo.toString(),
        });
        const learnCardUrl = new URL("/consent-flow-login", LCA_URL);
        const callbackUrl = new URL("/auth/callback", DOMAIN);

        callbackUrl.searchParams.set("challenge", challenge);
        callbackUrl.searchParams.set("response_mode", "fragment");
        learnCardUrl.searchParams.set("uri", LEARNCARD_CONTRACT_URI);
        learnCardUrl.searchParams.set("returnTo", callbackUrl.toString());
        learnCardUrl.searchParams.set("challenge", challenge);
        learnCardUrl.searchParams.set("domain", new URL(DOMAIN).origin);

        return redirectResponse(learnCardUrl.toString(), corsHeaders, {
          "Set-Cookie": getLoginCookie(challenge, binding),
        });
      }

      if (url.pathname === "/auth/callback") {
        if (req.method !== "GET" && req.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        const challenge = url.searchParams.get("challenge");
        const responseMode = url.searchParams.get("response_mode");

        if (!challenge) {
          return jsonResponse({ error: "Challenge is required" }, 400);
        }

        if (req.method === "GET" && responseMode === "fragment") {
          return fragmentCallbackPage();
        }

        let presentation: string | null;

        if (req.method === "POST") {
          if (responseMode !== "fragment") {
            return jsonResponse({ error: "Invalid response mode" }, 400);
          }

          const parsed = z
            .object({ vp: z.string().min(1) })
            .safeParse(await req.json());

          if (!parsed.success) {
            return jsonResponse({ error: "VP is required" }, 400);
          }

          presentation = parsed.data.vp;
        } else {
          presentation = url.searchParams.get("vp");
        }

        if (!presentation) {
          return jsonResponse({ error: "Challenge and VP are required" }, 400);
        }

        try {
          const result = await authService.authenticate({
            challenge,
            expectedBinding: getCookie(req, getAuthLoginCookieName(challenge)),
            presentation,
          });
          const headers = getAuthenticatedHeaders(
            corsHeaders,
            challenge,
            result.sessionId,
          );

          if (req.method === "POST") {
            const { handoff } = await authService.createSessionHandoff({
              did: result.did,
              origin: new URL(result.returnTo).origin,
              sessionId: result.sessionId,
            });

            headers.set("Content-Type", "application/json");

            return new Response(
              JSON.stringify({ handoff, returnTo: result.returnTo }),
              {
                status: 200,
                headers,
              },
            );
          }

          headers.set("Location", result.returnTo);

          return new Response(null, { status: 302, headers });
        } catch (error) {
          if (isDataErasureRequestedError(error))
            return jsonResponse({ error: error.code }, 410);
          if (error instanceof AuthError) {
            return authenticationErrorResponse(corsHeaders, challenge, error);
          }

          throw error;
        }
      }

      if (url.pathname === "/auth/session") {
        if (req.method === "GET") {
          if (!did) {
            return jsonResponse({ error: "Authentication required" }, 401);
          }

          return jsonResponse({ authenticated: true, did });
        }

        if (req.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        const origin = req.headers.get("origin");

        if (!origin || !isAllowedOrigin(origin)) {
          return jsonResponse({ error: "Origin not allowed" }, 403);
        }

        const parsed = z
          .object({
            challenge: z.string().min(32).max(128),
            binding: z.string().min(32).max(128).optional(),
            vp: z.string().min(1),
          })
          .safeParse(await req.json());

        if (!parsed.success) {
          return jsonResponse({ error: "Challenge and VP are required" }, 400);
        }

        try {
          const result = await authService.authenticate({
            challenge: parsed.data.challenge,
            expectedBinding:
              parsed.data.binding ??
              getCookie(req, getAuthLoginCookieName(parsed.data.challenge)),
            expectedReturnTo: origin,
            presentation: parsed.data.vp,
          });

          const headers = getAuthenticatedHeaders(
            { ...corsHeaders, "Content-Type": "application/json" },
            parsed.data.challenge,
            result.sessionId,
          );

          return new Response(
            JSON.stringify({
              authenticated: true,
              did: result.did,
              token: result.sessionId,
            }),
            { status: 200, headers },
          );
        } catch (error) {
          if (isDataErasureRequestedError(error))
            return jsonResponse({ error: error.code }, 410);
          if (error instanceof AuthError) {
            return authenticationErrorResponse(
              corsHeaders,
              parsed.data.challenge,
              error,
            );
          }

          throw error;
        }
      }

      if (url.pathname === "/auth/handoff") {
        if (req.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        const origin = req.headers.get("origin");

        if (!origin || !isAllowedOrigin(origin)) {
          return jsonResponse({ error: "Origin not allowed" }, 403);
        }

        const parsed = z
          .object({ handoff: z.string().min(32).max(128) })
          .safeParse(await req.json());

        if (!parsed.success) {
          return jsonResponse({ error: "Handoff is required" }, 400);
        }

        try {
          const result = await authService.consumeSessionHandoff(
            parsed.data.handoff,
            origin,
          );
          const headers = new Headers({
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          });

          headers.append("Set-Cookie", getSessionCookie(result.sessionId));

          return new Response(
            JSON.stringify({
              authenticated: true,
              did: result.did,
              token: result.sessionId,
            }),
            { status: 200, headers },
          );
        } catch (error) {
          if (isDataErasureRequestedError(error))
            return jsonResponse({ error: error.code }, 410);
          if (error instanceof AuthError) {
            return jsonResponse({ error: error.code }, 401);
          }

          throw error;
        }
      }

      if (url.pathname === "/auth/websocket-ticket") {
        const result = await issueWebSocketTicket({
          did,
          isAllowedOrigin,
          method: req.method,
          origin: req.headers.get("origin"),
          service: authService,
          sessionId,
        });

        return jsonResponse(result.body, result.status);
      }

      if (url.pathname === "/auth/logout") {
        if (req.method !== "POST") {
          return jsonResponse({ error: "Method not allowed" }, 405);
        }

        try {
          await authService.deleteSession(sessionId);
        } catch (error) {
          // Erasure already blocks this session's owner from ordinary work.
          // Explicit logout can still clear the local cookie during cleanup.
          if (!isDataErasureRequestedError(error)) throw error;
        }

        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            "Set-Cookie": `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
          },
        });
      }

      // Handle MCP OAuth routes (authorization server endpoints)
      const oauthResponse = await handleMcpOAuthRoute(
        req,
        url,
        jsonResponse,
        corsHeaders,
      );
      if (oauthResponse) return oauthResponse;

      switch (url.pathname) {
        case "/health": {
          return jsonResponse({ status: "ok" });
        }
        case "/did": {
          const learnCard = await getLearnCard();

          return jsonResponse(learnCard.id.did());
        }
        case "/privacy/export": {
          if (!did) {
            return jsonResponse({ error: "Authentication required" }, 401);
          }

          if (req.method !== "GET") {
            return jsonResponse({ error: "Method not allowed" }, 405);
          }

          try {
            const response = await withOwnerOperation(did, () =>
              runWithAiPrivacyContext(did, async () =>
                jsonResponse(await dataLifecycleService.exportData(did)),
              ),
            );
            response.headers.set("Cache-Control", "no-store");
            return response;
          } catch (error) {
            logSafeEvent("error", "request_failed");
            const response = jsonResponse(
              { error: isDataErasureRequestedError(error) ? error.code : "Data export unavailable" },
              isDataErasureRequestedError(error) ? 410 : 503,
            );
            response.headers.set("Cache-Control", "no-store");
            return response;
          }
        }
        case "/privacy/data": {
          if (!did) {
            return jsonResponse({ error: "Authentication required" }, 401);
          }

          if (req.method !== "DELETE") {
            return jsonResponse({ error: "Method not allowed" }, 405);
          }

          // Existing authentication remains valid for retries, but DELETE must
          // not count itself among the owner operations it waits to drain.
          try {
            return createDataDeletionResponse(
              await dataLifecycleService.deleteData(did),
              jsonResponse,
              AUTH_COOKIE_NAME,
            );
          } catch {
            logSafeEvent("error", "request_failed");
            const response = jsonResponse(
              { error: "Data erasure could not finish", retryable: true },
              503,
            );
            response.headers.set("Cache-Control", "no-store");
            return response;
          }
        }
        default: {
          break;
        }
      }

      // Handle public endpoints (no authentication required)
      try {
        switch (url.pathname) {
          case "/insights/occupations": {
            if (req.method === "POST") {
              const { keyword, limit, topNDetails } = await req.json();
              try {
                const details = await pathwaysProvider.getOccupationDetails({
                  keyword,
                  limit,
                  topNDetails,
                });
                return jsonResponse(details);
              } catch (error) {
                return jsonResponse(
                  {
                    error:
                      (error as Error)?.message ??
                      `Failed to get occupation details for keyword ${keyword}`,
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/insights/salaries": {
            if (req.method === "POST") {
              const { keyword, locations } = await req.json();

              try {
                const details = await pathwaysProvider.getSalaries({
                  keyword,
                  locations,
                });
                return jsonResponse(details);
              } catch (error) {
                return jsonResponse(
                  {
                    error:
                      (error as Error)?.message ??
                      `Failed to get salary details for occupations ${keyword}`,
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/insights/training-programs": {
            if (req.method === "POST") {
              const { keyword } = await req.json();

              try {
                const details = await pathwaysProvider.getTrainingPrograms({
                  keyword,
                });
                return jsonResponse(details);
              } catch (error) {
                return jsonResponse(
                  {
                    error:
                      (error as Error)?.message ??
                      `Failed to get training programs for keyword ${keyword}`,
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/insights/courses": {
            if (req.method === "POST") {
              const {
                schoolName,
                courseCode,
                courseTitle,
                limit = 100,
              } = await req.json();

              try {
                const details = await pathwaysProvider.getCourses({
                  schoolName,
                  courseCode,
                  courseTitle,
                  limit,
                });
                return jsonResponse(details);
              } catch (error) {
                return jsonResponse(
                  {
                    error:
                      (error as Error)?.message ??
                      `Failed to get courses for school ${schoolName}`,
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/insights/video": {
            if (req.method === "POST") {
              const { videoCode } = await req.json();


              try {
                const video = pathwaysProvider.getCareerOneStopVideo(videoCode);
                return jsonResponse(video);
              } catch (error) {
                return jsonResponse(
                  {
                    error:
                      (error as Error)?.message ??
                      `Failed to get career one stop video for code ${videoCode}`,
                  },
                  500,
                );
              }
            }
            break;
          }


          case "/api/youtube/search": {
            if (req.method === "GET") {
              const keyword = url.searchParams.get("keyword");

              if (!keyword || !keyword.trim()) {
                return jsonResponse(
                  { error: "Keyword parameter is required" },
                  400,
                );
              }

              try {
                const videos =
                  await pathwaysProvider.searchYouTubeVideos(keyword);
                return jsonResponse(videos);
              } catch (error) {
                logSafeEvent("error", "request_failed");
                const errorMessage =
                  (error as Error)?.message ??
                  "Failed to search YouTube videos";
                // Return 503 if API key is not configured
                const statusCode = errorMessage.includes("not configured")
                  ? 503
                  : 500;
                return jsonResponse(
                  {
                    error: errorMessage,
                  },
                  statusCode,
                );
              }
            }
            break;
          }
        }
      } catch (error) {
        return jsonResponse(
          {
            error: (error as Error)?.message ?? "Internal server error",
          },
          500,
        );
      }

      if (!did) {
        return jsonResponse({ error: "Authentication required" }, 401);
      }

      try {
        return await withOwnerOperation(did, () =>
          runWithAiPrivacyContext(did, async () => {
      try {
        // Handle different API endpoints
        switch (url.pathname) {
        case "/credentials/ingestion": {
          if (!did) {
            return jsonResponse({ error: "Authentication required" }, 401);
          }

          if (req.method === "GET") {
            await refreshCredentialIngestionState(did);

            return jsonResponse({
              status: getCredentialIngestionState(did) ?? null,
            });
          }

          if (req.method !== "POST") {
            return jsonResponse({ error: "Method not allowed" }, 405);
          }

          try {
            const { source } = CredentialIngestionRequestValidator.parse(
              await req.json(),
            );
            const { job, deduplicated } = await startCredentialIngestionJob(
              did,
              source,
            );
            await refreshCredentialIngestionState(did);

            return jsonResponse(
              {
                status: "accepted",
                ingestion: getCredentialIngestionState(did),
                deduplicated,
                jobId: String(job.id),
              },
              202,
            );
          } catch (error) {
            if (error instanceof z.ZodError) {
              return jsonResponse({ error: "Invalid ingestion request" }, 400);
            }

            logSafeEvent("error", "credential_ingestion_failed");
            return jsonResponse({ error: "Failed to queue ingestion" }, 500);
          }
        }
          case "/ai/learner-context/format": {
            if (req.method === "POST") {
              try {
                const request = parseLearnerContextPromptRequest(
                  await req.json(),
                );
                const response = await generateLearnerContextPrompt(request);
                return jsonResponse(response);
              } catch (error) {
                if (error instanceof z.ZodError || error instanceof SyntaxError) {
                  return jsonResponse({ error: "Invalid learner context selection", code: "invalid_learner_context_selection" }, 400);
                }
                if (error instanceof AiConsentError) {
                  return jsonResponse({ error: "Active LearnCard AI consent is required", code: error.code }, 403);
                }
                if (error instanceof LearnerContextPromptError) {
                  return jsonResponse({ error: error.message, code: error.code }, error.status);
                }
                if (isAiProviderError(error)) {
                  const payload = toAiErrorPayload(error);
                  return jsonResponse({ error: payload.message, ...payload }, 503);
                }
                return jsonResponse({ error: "Learner context service is unavailable", code: "learner_context_unavailable" }, 503);
              }
            }
            break;
          }
          case "/credentials/parse-file/reservations": {
            if (req.method === "POST") return guardUploadRequest.reserve(req, did, jsonResponse);
            if (req.method === "DELETE") return guardUploadRequest.releaseReservation(req, did, jsonResponse);
            return jsonResponse({ error: "Method not allowed" }, 405);
          }
          case "/credentials/parse-file": {
            if (req.method === "POST") {
              return guardUploadRequest(req, did, jsonResponse, async ({ file, fileType, diagnostics }) => {
                try {
                  const result = await parseFile(file, did, fileType, diagnostics);
                  const { text: _text, result: _result, ...response } = result;
                  return jsonResponse(response);
                } catch (error) {
                  if (error && typeof error === "object" && "processing" in error && "status" in error) {
                    const failure = error as Error & { processing: unknown; status: number };
                    return jsonResponse({ error: failure.message, processing: failure.processing }, failure.status);
                  }
                  return jsonResponse({ error: "We couldn't process this document. Please try again." }, 500);
                }
              });
            }
            break;
          }
          case "/credentials/ai-insight": {
            if (req.method === "POST") {
              try {
                // Use the awarding service to generate AI insight credential
                return await createAiInsightHttpResponse(
                  () => generateAIInsightCredential(did),
                  jsonResponse,
                  { signal: req.signal },
                );
              } catch (error) {
                if (error instanceof NoEligibleInsightInputsError)
                  return jsonResponse(
                    {
                      error: error.message,
                      code: "no_eligible_insight_inputs",
                      meta: { inputCoverage: error.coverage },
                    },
                    422,
                  );

                return (
                  aiErrorResponse(error, "ai_insight", jsonResponse) ??
                  jsonResponse({ error: "Failed to generate AI insights" }, 500)
                );
              }
            }
            break;
          }
          case "/api/chat/active-session-status": {
            if (req.method === "GET") {
              return jsonResponse(await getActiveSessionStatus(did));
            }

            return jsonResponse({ error: "Method not allowed" }, 405);
          }
          case "/assessment": {
            if (req.method === "POST") {
              const summaryCredential = (await req.json()).summaryCredential;

              if (getCredentialSubjectDid(summaryCredential) !== did) {
                return jsonResponse({ error: "Not found" }, 404);
              }

              return jsonResponse(
                await generateAiAssessment(did, summaryCredential),
              );
            }

            break;
          }

          case "/finish-assessment": {
            if (req.method === "POST") {
              const authorized = await authorizeFinishAssessment(
                did,
                await req.json(),
              );

              if (!authorized.ok) {
                return jsonResponse(
                  { error: authorized.error },
                  authorized.status,
                );
              }

              const { session, assessmentQA, sessionUri } = authorized.request;

              try {
                return jsonResponse(
                  await completeAssessment({
                    did,
                    session,
                    sessionUri,
                    assessmentQA,
                  }),
                );
              } catch (error) {
                return (
                  aiErrorResponse(error, "finish_assessment", jsonResponse) ??
                  jsonResponse({ error: "Failed to complete assessment" }, 500)
                );
              }
            }

            break;
          }
          case "/threads": {
            if (req.method === "GET") {
              // The threads now include summaries directly in the object
              const threads = await db.getThreads(did);
              return jsonResponse(threads);
            }
            if (req.method === "POST") {
              const threadId = await db.createThread(did);
              return jsonResponse({ threadId });
            }
            if (req.method === "DELETE") {
              const threadId = url.searchParams.get("threadId");
              if (!threadId) {
                return jsonResponse({ error: "Thread ID required" }, 400);
              }
              if (!(await db.deleteThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }

              return jsonResponse(null, 204);
            }
            break;
          }

          case "/messages": {
            if (req.method === "GET") {
              const threadId = url.searchParams.get("threadId");
              if (!threadId) {
                return jsonResponse({ error: "Thread ID required" }, 400);
              }
              if (!(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }

              const messages = await db.getMessages(did, threadId);
              return jsonResponse(messages);
            }
            break;
          }

          case "/credentials": {
            if (req.method === "POST") {
              const { job, deduplicated } = await startCredentialIngestionJob(
                did,
                "manual",
              );

              return jsonResponse({
                status: "accepted",
                deduplicated,
                jobId: String(job.id),
              });
            }
            if (req.method === "GET") {
              // Get all stored VCs for the user
              const vcs = await fetchCredentials(did);
              return jsonResponse(vcs);
            }
            break;
          }

          case "/thread_credentials": {
            if (req.method === "GET") {
              const threadId = url.searchParams.get("threadId");
              if (!threadId) {
                return jsonResponse({ error: "Thread ID required" }, 400);
              }
              if (!(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }

              const creds = await db.getThreadCredentials(did, threadId);
              return jsonResponse(creds);
            }
            break;
          }

          case "/topics": {
            try {
              const { topics } = await getSuggestedTopics(did);
              return jsonResponse({ topics });
            } catch (error) {
              return aiErrorResponse(error, "topics", jsonResponse) ??
                jsonResponse({ error: "Topic suggestions are unavailable" }, 503);
            }
          }

          case "/qdrant/health": {
            if (req.method === "GET") {
              try {
                const isHealthy = await checkQdrantHealth();
                return jsonResponse({
                  status: isHealthy ? "ok" : "error",
                  message: isHealthy
                    ? "Qdrant is healthy"
                    : "Qdrant is not healthy",
                });
              } catch {
                logSafeEvent("error", "dependency_failed");
                return jsonResponse(
                  {
                    status: "error",
                    message: "Failed to check Qdrant health",
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/search": {
            if (req.method === "GET") {
              const query = url.searchParams.get("q");
              const limitParam = url.searchParams.get("limit");
              const threadId = url.searchParams.get("threadId");
              if (threadId && !(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }


              if (!query) {
                return jsonResponse(
                  { error: "Query parameter 'q' is required" },
                  400,
                );
              }

              const limit = limitParam ? parseInt(limitParam, 10) : 5;

              try {
                const similarMessages = await findSimilarMessages(
                  query,
                  did,
                  limit,
                  threadId ?? undefined,
                );

                return jsonResponse(similarMessages);
              } catch (error) {
                logSafeEvent("error", "request_failed");
                return jsonResponse(
                  {
                    error: "Failed to perform search",
                    message:
                      error instanceof Error ? error.message : String(error),
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/threads/visibility": {
            if (req.method === "POST") {
              const form = await req.formData();
              const threadId = form.get("threadId")?.toString();
              const event = form.get("event")?.toString();

              if (!threadId || !event) {
                return jsonResponse({ error: "threadId and event required" }, 400);
              }

              if (!(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }
              if (event === "hidden") {
                await enqueueConversationSummary(did, threadId);
              } else if (event === "visible") {
                await cancelConversationSummary(did, threadId);
              }
              return jsonResponse({ status: "queued" });
            }
            break;
          }

          case "/learning-pathways": {
            if (req.method === "GET") {
              const threadId = url.searchParams.get("threadId");
              if (!threadId) {
                return jsonResponse({ error: "Thread ID required" }, 400);
              }
              if (!(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }


              try {
                // Get the thread's summary credentials
                const summaryCredentials =
                  await db.getThreadSummaryCredentials(did, threadId);
                if (!summaryCredentials || summaryCredentials.length === 0) {
                  return jsonResponse(
                    { error: "No summary credential found for this thread" },
                    404,
                  );
                }

                // Get the most recent summary credential URI
                const summaryUri = summaryCredentials[0].credential_uri;

                // Resolve the credential to get the boostId
                const learnCard = await getLearnCard();
                const summaryVC = await learnCard.read.get(summaryUri);

                if (!summaryVC || !summaryVC.boostId) {
                  return jsonResponse(
                    { error: "Invalid summary credential or missing boostId" },
                    400,
                  );
                }

                // Get learning pathways using the boostId
                const pathways = await learnCard.invoke.getBoostChildren(
                  summaryVC.boostId,
                  { query: { category: "learning-pathway" }, limit: 100 },
                );

                const enrichedPathways = await Promise.all(
                  pathways.records.map(async (pathway) => {
                    const credential = await readOwnedBoostCredential(did, pathway.uri);
                    return {
                      id: pathway.uri,
                      learningPathway: credential.learningPathway,
                    };
                  }),
                );


                return jsonResponse({ pathways: enrichedPathways });
              } catch {
                logSafeEvent("error", "request_failed");
                return jsonResponse(
                  {
                    error: "Failed to fetch learning pathways",
                    message: "Private pathway data is unavailable",
                  },
                  500,
                );
              }
            }
            break;
          }

          case "/threads/finish": {
            if (req.method === "POST") {
              const {
                threadId,
                sendSummary = true,
              } = (await req.json()) as {
                threadId: string;
                sendSummary?: boolean;
              };

              if (!threadId) {
                return jsonResponse({ error: "threadId required" }, 400);
              }

              if (!(await db.hasThread(did, threadId))) {
                return jsonResponse({ error: "Not found" }, 404);
              }

              const { shouldSummarize } = await prepareThreadFinish(
                did,
                threadId,
                sendSummary,
              );

              sendToThreadClients(did, threadId, {
                event: "session_completed",
                threadId,
              });

              if (!shouldSummarize) {
                return jsonResponse({ status: "success" });
              }

              // Fetch messages & parent topic VC (if any)
              const messages = await db.getModelMessages(did, threadId);
              const parentTopicUri =
                await db.getThreadTopicCredential(did, threadId);

              // Prepare messages for AI formatting
              const formattedForAI = messages.map((msg: any) => {
                const m: any = { role: msg.role, content: msg.content };
                if (msg.tool_calls) {
                  m.tool_calls = msg.tool_calls;
                  delete m.content;
                }
                if (msg.tool_call_id) {
                  m.tool_call_id = msg.tool_call_id;
                }
                return m;
              });

              // Helper to stream a final congratulatory message
              const streamCongrats = async (socket: {
                send: (msg: string) => void;
              }) => {
                try {
                  const finalContent = await streamingAiCall({
                    model: FORMATTING_MODEL,
                    systemPrompt:
                      "You are an empathetic AI coach looking at a conversation that has ended early. Write a short message acknowledging that the user completed the session early, summarize their progress, and suggest next steps.",
                    message: formattedForAI,
                    options: {
                      onChunk: (chunk) => {
                        if (chunk) socket.send(JSON.stringify(chunk));
                      },
                      accumulateContent: true,
                    },
                  });

                  const endMessage: ChatMessage = {
                    role: "assistant",
                    content: finalContent ?? "",
                  };

                  await db.addMessage(did, threadId, endMessage);

                  // Signal end of stream
                  socket.send(JSON.stringify({ done: true, threadId }));
                } catch (error) {
                  if (isAiProviderError(error)) {
                    sendToThreadClients(
                      did,
                      threadId,
                      toAiErrorPayload(error, {
                        operation: "session_finish",
                        threadId,
                      }),
                    );
                  } else {
                    logSafeEvent("error", "ai_operation_failed");
                  }
                }
              };

              // Stream only to the socket that owns this thread. DID-only routing
              // cross-contaminates concurrent tabs for the same signed-in user.
              const wsClient = getThreadClient(did, threadId);
              if (wsClient && wsClient.readyState === 1 && sendSummary) {
                // Kick off summary and congrats streaming concurrently for speed
                await Promise.all([
                  sendConversationSummary(
                    wsClient as any,
                    did,
                    messages,
                    threadId,
                    parentTopicUri,
                  ),
                  streamCongrats(wsClient as any),
                ]);

                return jsonResponse({ status: "success" });
              }

              // Fallback – generate summary without WS and return payload directly
              let summaryPayload: any = {};
              const fakeWs = {
                send: (msg: string) => {
                  try {
                    const data = JSON.parse(msg);
                    if (
                      data.event === "conversation_summary" ||
                      data.event === "no_conversation_summary"
                    )
                      summaryPayload = data;
                  } catch {}
                },
              } as any;
              const [_, finalContent] = await Promise.all([
                sendConversationSummary(
                  fakeWs,
                  did,
                  messages,
                  threadId,
                  parentTopicUri,
                ),
                streamingAiCall({
                  model: CHAT_MODEL,
                  systemPrompt:
                    "You are an empathetic AI coach. Write a short congratulatory message acknowledging that the user completed the session plan, summarize their progress, and suggest next steps.",
                  message: formattedForAI,
                }),
              ]);

              summaryPayload.finalMessage = finalContent;

              return jsonResponse({ status: "success", ...summaryPayload });
            }
            break;
          }
          default: {
            return jsonResponse({ error: "Not Found" }, 404);
          }
        }

        return jsonResponse({ error: "Not Found" }, 404);
      } catch (error) {
        if (isDataErasureRequestedError(error))
          return jsonResponse({ error: error.code }, 410);
        const response = aiErrorResponse(
          error,
          `${req.method} ${url.pathname}`,
          jsonResponse,
        );

        if (response) return response;

        logSafeEvent("error", "request_failed");

        return jsonResponse({ error: "Internal Server Error" }, 500);
      }
          }),
        );
      } catch (error) {
        if (isDataErasureRequestedError(error))
          return jsonResponse({ error: error.code }, 410);
        logSafeEvent("error", "request_failed");
        return jsonResponse({ error: "Owner operation unavailable" }, 503);
      }
      }));
        },

        websocket: {
            async message(ws, message) {
                // LC-1901: each chat turn runs outside the upgrade request, so re-enter
                // a locale context from the socket. A per-message `locale` (sent by the
                // client on every payload) wins over the one captured at upgrade time.
                const { locale: socketLocale } = ws.data;
                let locale = socketLocale;
                try {
                    locale =
                        (JSON.parse(message.toString()) as AuthenticatedMessage).locale ?? locale;
                } catch {
                    // The existing handler reports malformed messages to the client.
                }
                await runWithAiPrivacyContext(ws.data.did, () =>
                    runWithLocale(locale, () => websocketHandler.message(ws, message))
                );
            },

            async open(ws) {
                const { threadId } = ws.data;
                if (threadId) {
                    await cancelConversationSummary(ws.data.did, threadId);
                }
                await runWithAiPrivacyContext(ws.data.did, () => websocketHandler.open(ws));
            },

            async close(ws) {
                const { threadId } = ws.data;
                if (threadId) {
                    void cancelConversationSummary(ws.data.did, threadId).catch(() =>
                        logSafeEvent('error', 'background_job_failed')
                    );
                }
                await websocketHandler.close(ws);
            },
        },

        port: PORT,
        hostname: process.env.BIND_HOST || '0.0.0.0',

        idleTimeout: 255,
    });
};
