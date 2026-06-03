import{j as e}from"./jsx-runtime-wMSHVw5E.js";import{r as x}from"./index-C6th1qJj.js";import{bH as D,dm as v,eA as _,ep as L,bp as S,bL as I,ej as $,e2 as O}from"./mermaid-GHXKKRXX-6Qn97T64.js";import{u as A}from"./DeveloperPortalContext-DjHihLxD.js";import{t as E,b as d,W as P,D as F,C as Y}from"./DeveloperPortalRoutes-giAedgkk.js";import{I as q}from"./info-H9IS8N_U.js";import"./iframe-CuYDMKrt.js";import"./index-BrmLqkzj.js";import"./index-CR_VHyiH.js";import"./ModalsContext-hN0d-LEw.js";import"./tiny-invariant-DKC21gSL.js";import"./v4-Ansaqd2-.js";import"./search-TBxl5v6T.js";import"./AppStoreHeader-C6-TxiCL.js";import"./circle-check-big-vSLo3RDN.js";import"./circle-x-TTsCXMdh.js";import"./refresh-cw-Czc7U5ZT.js";import"./play-CwAriJi6.js";import"./code-xml-4deXUxLt.js";import"./shield-check-D3OzW_tA.js";import"./rocket-1gVCdnUo.js";import"./eye-OZVAWaf5.js";import"./arrow-right-B7j--7Iy.js";import"./lock-kJFIDZPo.js";import"./circle-question-mark-RBXS8Kob.js";import"./useFinalizeInboxCredentials-B1VZtK2Y.js";const p=({icon:r,iconColor:o,title:u,description:b,children:l,defaultOpen:f=!0})=>{const[n,m]=x.useState(f);return e.jsxs("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[e.jsxs("button",{onClick:()=>m(!n),className:"w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors",children:[e.jsx("div",{className:`w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-10 ${o.replace("text-","bg-")}`,children:e.jsx(r,{className:`w-4 h-4 ${o}`})}),e.jsxs("div",{className:"flex-1 text-left",children:[e.jsx("p",{className:"font-medium text-gray-800 text-sm",children:u}),e.jsx("p",{className:"text-xs text-gray-500",children:b})]}),e.jsx("svg",{className:`w-5 h-5 text-gray-400 transition-transform ${n?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]}),n&&e.jsx("div",{className:"px-4 pb-4 space-y-4",children:l})]})},me=({integration:r,templates:o})=>{var k,R;const{presentToast:u}=D(),{useUpdateIntegration:b}=A(),l=b(),[f,n]=x.useState(null),[m,j]=x.useState(!1),[N,U]=x.useState(""),C=r==null?void 0:r.guideState,c=(k=C==null?void 0:C.config)==null?void 0:k.consentFlowConfig,s=(c==null?void 0:c.contractUri)||"",i=(c==null?void 0:c.redirectUrl)||"",w=((R=o[0])==null?void 0:R.boostUri)||"",g=x.useMemo(()=>{if(!s)return"";const t=`${v()}/consent-flow`,a=new URLSearchParams({uri:s});return i&&a.set("returnTo",i),`${t}?${a.toString()}`},[s,i]),T=async(t,a)=>{try{await O.write({string:t}),n(a),setTimeout(()=>n(null),2e3)}catch{await navigator.clipboard.writeText(t),n(a),setTimeout(()=>n(null),2e3)}},h=({text:t,id:a,label:y})=>e.jsx("button",{onClick:()=>T(t,a),className:"inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors",children:f===a?e.jsxs(e.Fragment,{children:[e.jsx($,{className:"w-3 h-3 text-emerald-500"}),y||"Copied!"]}):e.jsxs(e.Fragment,{children:[e.jsx(Y,{className:"w-3 h-3"}),y||"Copy"]})});return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold text-gray-800",children:"Integration Code"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Code snippets and configuration for your consent flow integration"})]}),e.jsxs(p,{icon:E,iconColor:"text-cyan-600",title:"Consent Redirect URL",description:"The URL to redirect users to for granting consent",children:[g?e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("p",{className:"text-xs text-gray-500 font-medium",children:"Live URL from your configuration:"}),e.jsx(h,{text:g,id:"consent-url"})]}),e.jsx("div",{className:"p-3 bg-gray-50 border border-gray-200 rounded-lg",children:e.jsx("code",{className:"text-xs text-gray-700 break-all",children:g})}),e.jsxs("a",{href:g,target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors",children:[e.jsx(_,{className:"w-4 h-4"}),"Test Consent Flow"]})]}):e.jsx("div",{className:"p-3 bg-amber-50 border border-amber-200 rounded-lg",children:e.jsxs("p",{className:"text-xs text-amber-800",children:[e.jsx("strong",{children:"Not configured:"})," Complete the Build guide to set your contract URI and callback URL."]})}),e.jsx(d,{title:"Build the consent URL",snippets:{typescript:`// Redirect the user to LearnCard's consent screen
const consentUrl = new URL('${v()}/consent-flow');
consentUrl.searchParams.set('uri', '${s||"YOUR_CONTRACT_URI"}');
consentUrl.searchParams.set('returnTo', '${i||"https://your-app.com/api/learncard/callback"}');

// Redirect (Express example)
res.redirect(consentUrl.toString());`,curl:`# Consent URL format:
${v()}/consent-flow?uri=${encodeURIComponent(s||"YOUR_CONTRACT_URI")}&returnTo=${encodeURIComponent(i||"https://your-app.com/callback")}`}})]}),e.jsxs(p,{icon:P,iconColor:"text-violet-600",title:"Callback Handler",description:"Handle the redirect back from LearnCard after consent",children:[e.jsx("div",{className:"p-3 bg-violet-50 border border-violet-200 rounded-lg",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx(q,{className:"w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5"}),e.jsxs("p",{className:"text-xs text-violet-800",children:["After consent, LearnCard redirects to your ",e.jsx("code",{className:"bg-violet-100 px-1 rounded",children:"returnTo"})," URL with ",e.jsx("code",{className:"bg-violet-100 px-1 rounded",children:"did"})," and ",e.jsx("code",{className:"bg-violet-100 px-1 rounded",children:"vp"})," query parameters."]})]})}),e.jsx(d,{title:"Express callback handler",snippets:{typescript:`import { initLearnCard } from '@learncard/init';

// Initialize LearnCard with your API token (do this once at startup)
// Get your token from the API Tokens tab
const learnCard = await initLearnCard({
    apiKey: process.env.LEARNCARD_API_TOKEN!,
    network: true,
});

// Handle the consent callback
app.get('/api/learncard/callback', async (req, res) => {
    const { did, vp } = req.query;

    if (!did || !vp) {
        return res.status(400).json({ error: 'Missing did or vp parameter' });
    }

    // Verify the VP (optional but recommended)
    const verification = await learnCard.invoke.verifyPresentation(
        vp as string,
        { proofFormat: 'jwt' }
    );

    if (verification.errors.length > 0) {
        return res.status(401).json({ error: 'Invalid VP', details: verification.errors });
    }

    // Store the user's DID in your database
    await saveUserConsent({
        userId: req.session?.userId,
        learnCardDid: did as string,
        consentedAt: new Date(),
    });

    // Redirect to your app's success page
    res.redirect('/dashboard?consent=granted');
});`,python:`from flask import Flask, request, redirect

app = Flask(__name__)

@app.route('/api/learncard/callback')
def learncard_callback():
    did = request.args.get('did')
    vp = request.args.get('vp')

    if not did or not vp:
        return {'error': 'Missing did or vp parameter'}, 400

    # Store the user's DID in your database
    save_user_consent(
        user_id=session.get('user_id'),
        learncard_did=did,
    )

    return redirect('/dashboard?consent=granted')`}})]}),e.jsxs(p,{icon:L,iconColor:"text-emerald-600",title:"Send Credentials",description:"Issue credentials to users who have consented",children:[e.jsx(d,{title:"Send a credential after consent",snippets:{typescript:`// Get the user's DID (stored from the consent callback)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: '${s||"YOUR_CONTRACT_URI"}',
    templateUri: '${w||"YOUR_TEMPLATE_URI"}',${r.id?`
    integrationId: '${r.id}',`:""}
});

console.log('Credential sent:', result.credentialUri);`,curl:`curl -X POST 'https://api.learncard.com/trpc/boost.send' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "boost",
    "recipient": "did:web:...",
    "contractUri": "${s||"YOUR_CONTRACT_URI"}",
    "templateUri": "${w||"YOUR_TEMPLATE_URI"}"${r.id?`,
    "integrationId": "${r.id}"`:""}
  }'`}}),o.length>0&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-xs text-gray-500 font-medium",children:"Your Template URIs:"}),o.filter(t=>t.boostUri).map(t=>e.jsxs("div",{className:"flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-medium text-gray-700 truncate",children:t.name}),e.jsx("code",{className:"text-xs text-gray-500 truncate block",children:t.boostUri})]}),e.jsx(h,{text:t.boostUri,id:`uri-${t.id}`,label:"Copy URI"})]},t.id))]})]}),e.jsxs(p,{icon:F,iconColor:"text-blue-600",title:"Query Consent Data",description:"Retrieve consent records and connected users",defaultOpen:!1,children:[e.jsx(d,{title:"Get all consent records for your contract",snippets:{typescript:`// Query all consent records
const consentData = await learnCard.invoke.getConsentFlowData(
    '${s||"YOUR_CONTRACT_URI"}',
    { limit: 50 }
);

console.log('Consented users:', consentData.records.length);
consentData.records.forEach(record => {
    console.log('  DID:', record.did);
    console.log('  Consented at:', record.date);
});`}}),e.jsx(d,{title:"Get consent data for a specific user",snippets:{typescript:`// Query consent data for a specific DID
const userConsentData = await learnCard.invoke.getConsentFlowDataForDid(
    'did:web:...',
    { limit: 10 }
);

console.log('User consent records:', userConsentData.records);`}})]}),e.jsx(p,{icon:S,iconColor:"text-gray-600",title:"Settings",description:"View and edit your integration configuration",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Integration ID"}),e.jsx("code",{className:"text-xs text-gray-700 break-all",children:r.id})]}),e.jsx(h,{text:r.id,id:"config-integration-id"})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Contract URI"}),e.jsx("code",{className:"text-xs text-gray-700 break-all",children:s||"(not set)"})]}),s&&e.jsx(h,{text:s,id:"config-contract-uri"})]}),e.jsxs("div",{className:"p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Callback URL (returnTo)"}),!m&&e.jsx("button",{onClick:()=>{U(i||""),j(!0)},className:"text-xs text-cyan-600 hover:text-cyan-700 font-medium",children:"Edit"})]}),m?e.jsxs("div",{className:"space-y-2",children:[e.jsx("input",{type:"url",value:N,onChange:t=>U(t.target.value),placeholder:"https://your-app.com/api/learncard/callback",className:"w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono",autoFocus:!0}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:async()=>{try{const t=r.guideState||{},a=t.config||{},y=a.consentFlowConfig||{};await l.mutateAsync({id:r.id,updates:{guideState:{...t,config:{...a,consentFlowConfig:{...y,redirectUrl:N}}}}}),j(!1),u("Callback URL updated",{type:I.Success})}catch{u("Failed to update callback URL",{type:I.Error})}},disabled:l.isPending,className:"px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 font-medium",children:l.isPending?"Saving...":"Save"}),e.jsx("button",{onClick:()=>j(!1),className:"px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium",children:"Cancel"})]})]}):e.jsx("code",{className:"text-xs text-gray-700 break-all block",children:i||"(not set)"})]}),e.jsx("div",{className:"flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg",children:e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-gray-500",children:"Templates"}),e.jsxs("code",{className:"text-xs text-gray-700",children:[o.filter(t=>t.boostUri).length," saved"]})]})})]})})]})};export{me as ConsentFlowCodeTab};
