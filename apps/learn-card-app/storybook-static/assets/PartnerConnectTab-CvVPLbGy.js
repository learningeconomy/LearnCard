import{j as e}from"./jsx-runtime-wMSHVw5E.js";import{r as h}from"./index-C6th1qJj.js";import{bH as xe,b8 as ye,eh as fe,el as k,ei as E,ep as Y,ej as $,eB as W,ew as be,eC as le,eA as ce,es as de,e2 as Ne}from"./mermaid-GHXKKRXX-6Qn97T64.js";import{u as je}from"./DeveloperPortalContext-DjHihLxD.js";import{o as oe,p as we,C as _,q as U,r as Ce,F as pe,s as me,N as z}from"./DeveloperPortalRoutes-giAedgkk.js";import{P as ve}from"./AppStoreHeader-C6-TxiCL.js";import{I as Te}from"./info-H9IS8N_U.js";import{C as K}from"./clipboard-check-CkjjoLt0.js";import"./iframe-CuYDMKrt.js";import"./index-BrmLqkzj.js";import"./index-CR_VHyiH.js";import"./ModalsContext-hN0d-LEw.js";import"./tiny-invariant-DKC21gSL.js";import"./v4-Ansaqd2-.js";import"./search-TBxl5v6T.js";import"./shield-check-D3OzW_tA.js";import"./rocket-1gVCdnUo.js";import"./refresh-cw-Czc7U5ZT.js";import"./play-CwAriJi6.js";import"./eye-OZVAWaf5.js";import"./arrow-right-B7j--7Iy.js";import"./code-xml-4deXUxLt.js";import"./lock-kJFIDZPo.js";import"./circle-check-big-vSLo3RDN.js";import"./circle-x-TTsCXMdh.js";import"./circle-question-mark-RBXS8Kob.js";import"./useFinalizeInboxCredentials-B1VZtK2Y.js";const Ie=[{id:"issue-credentials",title:"Issue Credentials",icon:e.jsx(k,{className:"w-4 h-4"})},{id:"peer-badges",title:"Peer-to-Peer Badges",icon:e.jsx(Y,{className:"w-4 h-4"})},{id:"request-credentials",title:"Request Credentials",icon:e.jsx(me,{className:"w-4 h-4"})},{id:"request-data-consent",title:"Request Data Consent",icon:e.jsx(K,{className:"w-4 h-4"})},{id:"launch-feature",title:"Launch Features",icon:e.jsx(z,{className:"w-4 h-4"})}],J=[{id:"requestIdentity",name:"requestIdentity",category:"auth",icon:e.jsx(de,{className:"w-4 h-4"}),shortDescription:"SSO authentication",description:"Request the user's identity for single sign-on. Since the user is already authenticated in the LearnCard wallet, this instantly returns their DID and profile information — no login flow required.",parameters:[],returns:{type:"Promise<Identity>",description:"User identity object with DID and profile",example:`{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "Jane Smith",
    "profileId": "janesmith",
    "image": "https://cdn.learncard.com/avatars/abc123.png",
    "email": "jane@example.com"
  }
}`},code:`import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect();

// Get the authenticated user's identity
const identity = await learnCard.requestIdentity();

// Use the identity in your app
console.log('Welcome,', identity.profile.displayName);
console.log('User DID:', identity.did);

// You can use the DID as a unique user identifier
const userId = identity.did;`,tips:["Call this on app load to immediately identify the user","The DID is a unique, cryptographic identifier for the user","Profile data may be partial depending on user privacy settings"]},{id:"sendCredential",name:"sendCredential",category:"credentials",icon:e.jsx(Y,{className:"w-4 h-4"}),shortDescription:"Issue a credential",description:"Issue a credential to the user's wallet using a pre-configured template. Create templates in the Templates tab, then reference them by alias. The credential is automatically signed and issued.",parameters:[{name:"templateAlias",type:"string",required:!0,description:"The alias of the credential template to use (configured in Templates tab)"},{name:"templateData",type:"Record<string, string>",required:!1,description:"Values for template variables (e.g., recipient_name, course_name)"}],returns:{type:"Promise<{ credentialUri?: string }>",description:"The URI of the issued credential if successful",example:'{ "credentialUri": "urn:lc:credential:abc123" }'},code:`// Issue a credential using a template alias
// Templates are configured in the Templates tab

// Simple credential (no template variables)
const result = await learnCard.sendCredential({
    templateAlias: 'course-completion',
});

// Credential with template variables
const resultWithData = await learnCard.sendCredential({
    templateAlias: 'course-completion',
    templateData: {
        recipient_name: 'Jane Doe',
        course_name: 'JavaScript Fundamentals',
        completion_date: new Date().toISOString(),
    },
});

if (resultWithData.credentialUri) {
    console.log('Credential issued:', resultWithData.credentialUri);
    showSuccessMessage('Credential added to your wallet!');
}`,tips:["Create templates in the Templates tab first","Template aliases are auto-generated from the template name","Use templateData to fill in dynamic values like names and dates","Check the generated code in the Code tab for your specific templates"]},{id:"askCredentialSearch",name:"askCredentialSearch",category:"credentials",icon:e.jsx(me,{className:"w-4 h-4"}),shortDescription:"Query user credentials",description:"Request access to search the user's credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.",parameters:[{name:"query",type:"CredentialQuery",required:!1,description:"Optional filter criteria for credential types"}],returns:{type:"Promise<{ credentials: VerifiableCredential[] }>",description:"Array of credentials the user chose to share",example:`{
  "credentials": [
    {
      "@context": [...],
      "type": ["VerifiableCredential", "OpenBadgeCredential"],
      "name": "Python Developer Certificate",
      ...
    }
  ]
}`},code:`// Search for specific credential types
const result = await learnCard.askCredentialSearch({
    type: ['OpenBadgeCredential']
});

// User selects which credentials to share
if (result.credentials.length > 0) {
    console.log('User shared', result.credentials.length, 'credentials');
    
    // Process the shared credentials
    for (const cred of result.credentials) {
        console.log('Credential:', cred.name);
        // Verify, display, or store the credential
    }
} else {
    console.log('User declined or has no matching credentials');
}`,tips:["Users control what they share — respect their privacy","Filter by type to only request relevant credentials","Credentials are cryptographically verifiable"]},{id:"initiateTemplateIssue",name:"initiateTemplateIssue",category:"credentials",icon:e.jsx(pe,{className:"w-4 h-4"}),shortDescription:"Issue from template",description:"Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.",parameters:[{name:"templateUri",type:"string",required:!0,description:"The URI of the boost/template to issue from"},{name:"recipientDid",type:"string",required:!1,description:"DID of the recipient (defaults to current user)"}],returns:{type:"Promise<{ success: boolean, credentialId?: string }>",description:"Result of the issuance",example:`{
  "success": true,
  "credentialId": "urn:uuid:new-cred-123..."
}`},code:`// Issue from a pre-configured template
const templateUri = 'lc:boost:your-org:course-completion-template';

const result = await learnCard.initiateTemplateIssue({
    templateUri,
    // Optionally specify recipient (defaults to current user)
    // recipientDid: 'did:web:...'
});

if (result.success) {
    console.log('Credential issued:', result.credentialId);
    showSuccess('Achievement unlocked!');
}`,tips:["Create templates in the Templates tab first","Templates ensure consistent branding and fields","Great for gamification with pre-defined achievements"]},{id:"launchFeature",name:"launchFeature",category:"navigation",icon:e.jsx(z,{className:"w-4 h-4"}),shortDescription:"Navigate host app",description:"Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.",parameters:[{name:"path",type:"string",required:!0,description:"The wallet path to navigate to"},{name:"description",type:"string",required:!1,description:"Optional description shown during navigation"}],returns:{type:"Promise<void>",description:"Resolves when navigation completes",example:"// No return value"},code:`// Navigate to the user's credential wallet
await learnCard.launchFeature('/wallet', 'View your credentials');

// Open the contacts/connections page
await learnCard.launchFeature('/contacts', 'Find and connect with others');

// Open settings
await learnCard.launchFeature('/settings', 'Manage your preferences');

// Open a specific credential detail
await learnCard.launchFeature('/credential/abc123', 'View credential details');

// Available paths:
// /wallet     - Credential wallet
// /contacts   - Connections & contacts
// /settings   - User settings
// /profile    - User profile
// /activity   - Activity feed`,tips:["Use this to complement your app's features with wallet features","The description appears as a toast or transition message","Navigation happens within the wallet, not your iframe"]},{id:"requestConsent",name:"requestConsent",category:"consent",icon:e.jsx(K,{className:"w-4 h-4"}),shortDescription:"Request permissions",description:"Request user consent for specific permissions or data access. Consent is tied to a contract URI that defines what access is being granted. Use this for ongoing data access agreements.",parameters:[{name:"contractUri",type:"string",required:!0,description:"The URI of the consent contract"},{name:"options",type:"ConsentOptions",required:!1,description:"Additional options like scope and duration"}],returns:{type:"Promise<{ granted: boolean, consentId?: string }>",description:"Whether consent was granted",example:`{
  "granted": true,
  "consentId": "consent:abc123..."
}`},code:`// Request consent for a data sharing agreement
const result = await learnCard.requestConsent('lc:contract:your-app:data-access', {
    scope: ['profile', 'credentials'],
    duration: '30d' // 30 days
});

if (result.granted) {
    console.log('Consent granted! ID:', result.consentId);
    
    // Store the consent ID for future reference
    await saveUserConsent(userId, result.consentId);
    
    // Now you can access data per the contract terms
    enablePremiumFeatures();
} else {
    console.log('User declined consent');
    showLimitedFeatures();
}`,tips:["Be clear about what access you're requesting","Users can revoke consent at any time","Store consent IDs to track active agreements"]}],Ae=[{id:"auth",name:"Authentication",icon:e.jsx(de,{className:"w-4 h-4"})},{id:"credentials",name:"Credentials",icon:e.jsx(k,{className:"w-4 h-4"})},{id:"navigation",name:"Navigation",icon:e.jsx(z,{className:"w-4 h-4"})},{id:"consent",name:"Consent",icon:e.jsx(K,{className:"w-4 h-4"})}],tt=({integration:d,selectedListing:S})=>{var ie;const{presentToast:ue}=xe(),{initWallet:Q}=ye(),{useListingsForIntegration:he}=je(),{data:y,isLoading:H}=he(d.id),[O,Z]=h.useState(S||null),s=S||O;h.useEffect(()=>{y&&y.length>0&&!O&&!S&&Z(y[0])},[y,O,S]);const[R,ge]=h.useState("requestIdentity"),[N,X]=h.useState(null),[g,F]=h.useState([]),[x,L]=h.useState([]),[C,M]=h.useState("templates"),[A,ee]=h.useState("issue-credentials"),B=d==null?void 0:d.guideState,v=(ie=B==null?void 0:B.config)==null?void 0:ie.embedAppConfig,te=(v==null?void 0:v.selectedFeatures)||[],G=(v==null?void 0:v.featureConfig)||{},m=G["issue-credentials"],P=G["request-data-consent"],j=G["request-credentials"];h.useEffect(()=>{if(!(s!=null&&s.listing_id)){F([]),L([]);return}let t=!1;return(async()=>{try{const i=await Q(),V=r=>{const n=[],l=/\{\{(\w+)\}\}/g,f=b=>{if(typeof b=="string"){let I;for(;(I=l.exec(b))!==null;)n.includes(I[1])||n.push(I[1])}else Array.isArray(b)?b.forEach(f):b&&typeof b=="object"&&Object.values(b).forEach(f)};return f(r),n},a=[],o=await i.invoke.getAppBoosts(s.listing_id)||[];for(const r of o)try{const n=await i.invoke.getBoost(r.boostUri),l=(n==null?void 0:n.boost)||{};a.push({uri:r.boostUri,name:(n==null?void 0:n.name)||(l==null?void 0:l.name)||"Untitled Template",description:l==null?void 0:l.description,type:n==null?void 0:n.type,category:n==null?void 0:n.category,templateAlias:r.templateAlias,variables:V(l)})}catch(n){console.warn("Failed to fetch boost:",r.boostUri,n)}const T=[],D=await i.invoke.getPaginatedBoosts({limit:50,query:{meta:{appListingId:s.listing_id,featureType:"peer-badges"}}});for(const r of(D==null?void 0:D.records)||[])try{const n=r.uri,l=await i.invoke.getBoost(n),f=(l==null?void 0:l.boost)||{};T.push({uri:n,name:(l==null?void 0:l.name)||r.name||"Untitled Template",description:(f==null?void 0:f.description)||"",type:l==null?void 0:l.type,category:l==null?void 0:l.category})}catch(n){console.warn("Failed to fetch peer boost:",r.uri,n)}t||(F(a),L(T))}catch(i){console.error("Failed to fetch templates:",i),t||(F([]),L([]))}})(),()=>{t=!0}},[s==null?void 0:s.listing_id,Q]);const u=h.useMemo(()=>{const t=new Set(te);return g.length>0&&t.add("issue-credentials"),x.length>0&&t.add("peer-badges"),Array.from(t)},[te,g,x]);u.length>0;const se=h.useMemo(()=>{const t=[],c=(P==null?void 0:P.contractUri)||null,i=(m==null?void 0:m.contractUri)||null,V={app:{name:(s==null?void 0:s.display_name)||"Your App Name",listingId:(s==null?void 0:s.listing_id)||"",integrationId:(d==null?void 0:d.id)||""},features:u,templates:{peerBadges:x.map(a=>({uri:a.uri,name:a.name,description:a.description,type:a.type})),issueCredentials:g.map(a=>({uri:a.uri,name:a.name,templateAlias:a.templateAlias,variables:a.variables,description:a.description,type:a.type}))},contracts:{dataConsent:c,issueCredentials:i},permissions:["request_identity",...u.includes("issue-credentials")?["send_credential"]:[],...u.includes("peer-badges")?["initiate_template_issuance"]:[]],generatedAt:new Date().toISOString()};if(t.push(`/**
 * ================================================================
 * LEARNCARD EMBEDDED APP INTEGRATION
 * ================================================================
 * 
 * App: ${(s==null?void 0:s.display_name)||"Your App Name"}
 * Listing ID: ${(s==null?void 0:s.listing_id)||"NOT_SET"}
 * Integration ID: ${(d==null?void 0:d.id)||"NOT_SET"}
 * Generated: ${new Date().toISOString()}
 * 
 * Features configured:
 * ${u.length>0?u.map(a=>{var o;return`  - ${((o=Ie.find(T=>T.id===a))==null?void 0:o.title)||a}`}).join(`
 * `):"  - None selected (complete the setup wizard first)"}
 * 
 * ================================================================
 * LLM INTEGRATION METADATA
 * ================================================================
 * The following JSON contains all configured URIs and settings.
 * Use these values directly - no placeholders to replace!
 * 
 * @llm-config
${JSON.stringify(V,null,2).split(`
`).map(a=>" * "+a).join(`
`)}
 * 
 * ================================================================
 * QUICK REFERENCE
 * ================================================================
 * ${g.length>0?`Issue Credentials Templates: ${g.length} available`:"Issue Credentials Templates: None configured"}
 * ${x.length>0?`Peer Badges Templates: ${x.length} available`:"Peer Badges Templates: None configured"}
 * ${c?`Data Consent Contract: ${c}`:"Data Consent Contract: Not configured"}
 * ${i?`Issue Credentials Contract: ${i}`:"Issue Credentials Contract: Not configured"}
 * 
 * Prerequisites:
 *   1. Install the SDK: npm install @learncard/partner-connect
 *   2. Your app must be served in an iframe within LearnCard
 *   3. Configure CORS headers to allow iframe embedding
 * 
 * Documentation: https://docs.learncard.com/sdks/partner-connect
 */`),t.push(`
// ============================================================
// IMPORTS
// ============================================================
import { createPartnerConnect } from '@learncard/partner-connect';`),t.push(`
// ============================================================
// SDK INITIALIZATION
// ============================================================
const learnCard = createPartnerConnect();`),t.push(`
// ============================================================
// USER IDENTITY
// ============================================================
async function getUserIdentity() {
    try {
        const identity = await learnCard.requestIdentity();
        
        console.log('User DID:', identity.did);
        console.log('Display Name:', identity.profile.displayName);
        console.log('Profile ID:', identity.profile.profileId);
        
        return identity;
    } catch (error) {
        console.error('Failed to get user identity:', error);
        throw error;
    }
}`),u.includes("issue-credentials"))if(((m==null?void 0:m.mode)||"prompt-claim")==="prompt-claim")t.push(`
// ============================================================
// ISSUE CREDENTIALS - Prompt to Claim
// ============================================================
async function issueCredentialToUser() {
    const identity = await learnCard.requestIdentity();
    const recipientDid = identity.did;

    // Build credential (customize fields as needed)
    const credential = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "name": "${(m==null?void 0:m.credentialName)||"Achievement Badge"}",
        "issuer": {
            "id": "YOUR_ISSUER_DID", // Replace with your issuer DID
            "name": "${(s==null?void 0:s.display_name)||"Your Organization"}"
        },
        "credentialSubject": {
            "id": recipientDid,
            "achievement": {
                "type": ["Achievement"],
                "name": "${(m==null?void 0:m.credentialName)||"Achievement Badge"}",
                "achievementType": "Badge"
            }
        }
    };

    // Send to your server for signing, then prompt user
    const response = await fetch('/api/issue-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, recipientDid })
    });

    const { issuedVC } = await response.json();

    const result = await learnCard.sendCredential({ credential: issuedVC });

    if (result.success) {
        console.log('Credential claimed!');
    }
}`);else{const o=i||"urn:lc:contract:YOUR_CONTRACT_URI",T=JSON.stringify(g.map(r=>({templateAlias:r.templateAlias,uri:r.uri,name:r.name,description:r.description||"",variables:r.variables||[]})),null,4),D=g.map(r=>{var f,b,I;const n=r.variables&&r.variables.length>0,l=n?`{
${r.variables.map(w=>`        ${w}: 'value', // Replace with actual value`).join(`
`)}
    }`:"// No template variables needed";return n?`
// Issue "${r.name}" credential
async function issue${((f=r.templateAlias)==null?void 0:f.replace(/-/g,"_").replace(/^./,w=>w.toUpperCase()))||"Credential"}(templateData: Record<string, string>) {
    const result = await learnCard.sendCredential({
        templateAlias: '${r.templateAlias}',
        templateData,
    });
    
    if (result.credentialUri) {
        console.log('Credential issued:', result.credentialUri);
    }
    return result;
}

// Example usage:
// await issue${((b=r.templateAlias)==null?void 0:b.replace(/-/g,"_").replace(/^./,w=>w.toUpperCase()))||"Credential"}(${l});`:`
// Issue "${r.name}" credential (no template variables)
async function issue${((I=r.templateAlias)==null?void 0:I.replace(/-/g,"_").replace(/^./,w=>w.toUpperCase()))||"Credential"}() {
    const result = await learnCard.sendCredential({
        templateAlias: '${r.templateAlias}',
    });
    
    if (result.credentialUri) {
        console.log('Credential issued:', result.credentialUri);
    }
    return result;
}`}).join(`
`);t.push(`
// ============================================================
// ISSUE CREDENTIALS - Using Templates
// ============================================================
// Contract URI: ${o}
// Templates configured: ${g.length}

const CREDENTIAL_TEMPLATES = ${T};
${D}

// Generic function to issue any template by alias
async function issueCredentialByAlias(templateAlias: string, templateData?: Record<string, string>) {
    const template = CREDENTIAL_TEMPLATES.find(t => t.templateAlias === templateAlias);
    if (!template) {
        throw new Error(\`Template not found: \${templateAlias}. Available: \${CREDENTIAL_TEMPLATES.map(t => t.templateAlias).join(', ')}\`);
    }
    
    const result = await learnCard.sendCredential({
        templateAlias,
        ...(templateData && { templateData }),
    });
    
    if (result.credentialUri) {
        console.log('Credential issued:', result.credentialUri);
    }
    return result;
}`)}if(u.includes("peer-badges")){const a=x.length>0?JSON.stringify(x.map(o=>({id:o.uri.split(":").pop()||o.uri,uri:o.uri,name:o.name,description:o.description||"",type:o.type||"achievement"})),null,4):"[]";t.push(`
// ============================================================
// PEER-TO-PEER BADGES - Template Configuration
// ============================================================
// LLM INTEGRATION NOTE: Use these template URIs when calling sendPeerBadge().
// Templates configured: ${x.length}

const PEER_BADGE_TEMPLATES = ${a};

function findPeerBadgeTemplate(query: string) {
    const q = query.toLowerCase();
    return PEER_BADGE_TEMPLATES.find(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
}

async function sendPeerBadge(templateUri: string) {
    try {
        await learnCard.initiateTemplateIssue(templateUri);
        console.log('Peer badge flow initiated with template:', templateUri);
    } catch (error) {
        console.error('Failed to initiate peer badge:', error);
        throw error;
    }
}

async function sendPeerBadgeByName(searchQuery: string) {
    const template = findTemplate(searchQuery);

    if (!template) {
        throw new Error(\`No template found matching: \${searchQuery}. Available: \${PEER_BADGE_TEMPLATES.map(t => t.name).join(', ')}\`);
    }

    return sendPeerBadge(template.uri);
}`)}if(u.includes("request-credentials")){const a=(j==null?void 0:j.queryTitle)||"Share Your Credentials",o=(j==null?void 0:j.queryReason)||"Please share relevant credentials";t.push(`
// ============================================================
// REQUEST CREDENTIALS
// ============================================================
async function requestUserCredentials() {
    try {
        const response = await learnCard.askCredentialSearch({
            title: "${a}",
            reason: "${o}",
        });

        if (response.credentials?.length > 0) {
            console.log('User shared', response.credentials.length, 'credentials');
            return response.credentials;
        }
        return [];
    } catch (error) {
        console.error('Error requesting credentials:', error);
        throw error;
    }
}`)}if(u.includes("request-data-consent")){const a=c||"urn:lc:contract:YOUR_CONTRACT_URI";t.push(`
// ============================================================
// REQUEST DATA CONSENT
// ============================================================
// Contract URI: ${a}

async function requestDataConsent() {
    try {
        const result = await learnCard.requestConsent({
            contractUri: '${a}',
        });

        if (result.granted) {
            console.log('User granted consent! User ID:', result.userId);

            await fetch('/api/consent-granted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: result.userId, contractUri: '${a}' })
            });

            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to request consent:', error);
        throw error;
    }
}`)}return u.includes("launch-feature")&&t.push(`
// ============================================================
// LAUNCH WALLET FEATURES
// ============================================================
async function launchWalletFeature(path: string, description?: string) {
    await learnCard.launchFeature(path, description);
}

// Available paths:
// launchWalletFeature('/wallet', 'View your credentials');
// launchWalletFeature('/contacts', 'Manage connections');
// launchWalletFeature('/settings', 'Update preferences');`),t.join(`
`)},[u,s,d,g,x,m,P,j]),p=h.useMemo(()=>J.find(t=>t.id===R)||J[0],[R]),q=async(t,c)=>{await Ne.write({string:t}),X(c),setTimeout(()=>X(null),2e3),ue("Copied!",{hasDismissButton:!0})},ae=t=>{switch(t){case"auth":return"text-violet-600 bg-violet-100";case"credentials":return"text-cyan-600 bg-cyan-100";case"navigation":return"text-amber-600 bg-amber-100";case"consent":return"text-emerald-600 bg-emerald-100";default:return"text-gray-600 bg-gray-100"}},re="npm install @learncard/partner-connect",ne=`import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect();

// Get user identity (SSO - no login needed!)
const identity = await learnCard.requestIdentity();
console.log('User:', identity.profile.displayName);`;return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between gap-4 flex-wrap",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold text-gray-800",children:"Partner Connect SDK"}),e.jsx("p",{className:"text-sm text-gray-500",children:"Manage templates and generate integration code"})]}),y&&y.length>0&&e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ve,{className:"w-4 h-4 text-gray-400"}),e.jsx("select",{value:(s==null?void 0:s.listing_id)||"",onChange:t=>{const c=y.find(i=>i.listing_id===t.target.value);Z(c||null)},className:"px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500",children:y.map(t=>e.jsx("option",{value:t.listing_id,children:t.display_name},t.listing_id))})]})]}),H&&e.jsxs("div",{className:"p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3",children:[e.jsx(fe,{className:"w-5 h-5 text-cyan-500 animate-spin"}),e.jsx("span",{className:"text-gray-600",children:"Loading app listings..."})]}),!H&&(!y||y.length===0)&&e.jsx("div",{className:"p-4 bg-amber-50 border border-amber-200 rounded-xl",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Te,{className:"w-5 h-5 text-amber-600"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-amber-800 font-medium",children:"No app listings found"}),e.jsx("p",{className:"text-xs text-amber-700",children:'Create an app listing in the "App Listings" tab first.'})]})]})}),s&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"flex border-b border-gray-200",children:[e.jsxs("button",{onClick:()=>M("templates"),className:`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${C==="templates"?"border-cyan-500 text-cyan-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,children:[e.jsx(k,{className:"w-4 h-4"}),"Templates"]}),e.jsxs("button",{onClick:()=>M("code"),className:`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${C==="code"?"border-cyan-500 text-cyan-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,children:[e.jsx(E,{className:"w-4 h-4"}),"Code"]}),e.jsxs("button",{onClick:()=>M("setup"),className:`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${C==="setup"?"border-cyan-500 text-cyan-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`,children:[e.jsx(oe,{className:"w-4 h-4"}),"Setup"]})]}),C==="templates"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit",children:[e.jsxs("button",{onClick:()=>ee("issue-credentials"),className:`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${A==="issue-credentials"?"bg-white text-gray-800 shadow-sm":"text-gray-600 hover:text-gray-800"}`,children:[e.jsx(k,{className:"w-4 h-4"}),"Issue Credentials"]}),e.jsxs("button",{onClick:()=>ee("peer-badges"),className:`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${A==="peer-badges"?"bg-white text-gray-800 shadow-sm":"text-gray-600 hover:text-gray-800"}`,children:[e.jsx(Y,{className:"w-4 h-4"}),"Peer Badges"]})]}),e.jsx("div",{className:`p-3 rounded-lg text-sm ${A==="issue-credentials"?"bg-emerald-50 border border-emerald-200 text-emerald-800":"bg-violet-50 border border-violet-200 text-violet-800"}`,children:A==="issue-credentials"?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Issue Credentials:"})," Templates for credentials your app issues to users via"," ",e.jsx("code",{className:"bg-emerald-100 px-1 rounded",children:"sendCredential()"})]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Peer Badges:"})," Templates users can send to each other via"," ",e.jsx("code",{className:"bg-violet-100 px-1 rounded",children:"initiateTemplateIssue()"})]})}),e.jsx(we,{listingId:s.listing_id,integrationId:d==null?void 0:d.id,featureType:A,showCodeSnippets:!0,editable:!0})]}),C==="code"&&e.jsx("div",{className:"space-y-4",children:e.jsxs("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[e.jsxs("div",{className:"p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2 bg-cyan-100 rounded-lg",children:e.jsx(E,{className:"w-5 h-5 text-cyan-600"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-gray-800",children:"Your Integration Code"}),e.jsxs("p",{className:"text-xs text-gray-500",children:[g.length+x.length," ","template",g.length+x.length!==1?"s":""," ","configured"]})]})]}),e.jsxs("button",{onClick:()=>q(se,"personalized"),className:"flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors",children:[N==="personalized"?e.jsx($,{className:"w-4 h-4"}):e.jsx(_,{className:"w-4 h-4"}),N==="personalized"?"Copied!":"Copy All"]})]}),e.jsxs("div",{className:"p-4",children:[e.jsx(U,{code:se,maxHeight:"max-h-[500px]"}),e.jsx("div",{className:"mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg",children:e.jsxs("p",{className:"text-sm text-amber-800",children:[e.jsx("strong",{children:"💡 LLM-Ready:"})," Copy this code and paste it into an AI assistant (like ChatGPT or Claude) along with your requirements. The"," ",e.jsx("code",{className:"bg-amber-100 px-1 rounded",children:"@llm-config"})," ","section contains all your template URIs and settings."]})})]})]})}),C==="setup"&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[e.jsx("div",{className:"p-4 bg-gray-50 border-b border-gray-200",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(oe,{className:"w-5 h-5 text-cyan-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-gray-800",children:"Installation & Setup"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Install the SDK and initialize it in your app"})]})]})}),e.jsxs("div",{className:"p-4 space-y-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"1. Install the SDK"}),e.jsxs("button",{onClick:()=>q(re,"install"),className:"text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1",children:[N==="install"?e.jsx($,{className:"w-3 h-3 text-emerald-500"}):e.jsx(_,{className:"w-3 h-3"}),N==="install"?"Copied!":"Copy"]})]}),e.jsx(U,{code:re}),e.jsxs("p",{className:"text-xs text-gray-500 mt-1",children:["Also works with"," ",e.jsx("code",{className:"bg-gray-100 px-1 rounded",children:"yarn add"})," ","or"," ",e.jsx("code",{className:"bg-gray-100 px-1 rounded",children:"pnpm add"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"2. Initialize"}),e.jsxs("button",{onClick:()=>q(ne,"init"),className:"text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1",children:[N==="init"?e.jsx($,{className:"w-3 h-3 text-emerald-500"}):e.jsx(_,{className:"w-3 h-3"}),N==="init"?"Copied!":"Copy"]})]}),e.jsx(U,{code:ne})]}),e.jsx("div",{className:"p-3 bg-cyan-50 border border-cyan-200 rounded-xl",children:e.jsxs("p",{className:"text-sm text-cyan-800",children:[e.jsx("strong",{children:"That's it!"})," Users are already logged in when inside the wallet, so"," ",e.jsx("code",{className:"bg-cyan-100 px-1 rounded",children:"requestIdentity()"})," ","returns instantly with their profile."]})})]})]}),e.jsxs("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:[e.jsx("div",{className:"p-4 bg-gray-50 border-b border-gray-200",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(E,{className:"w-5 h-5 text-gray-600"}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-gray-800",children:"API Reference"}),e.jsx("p",{className:"text-xs text-gray-500",children:"Explore all available SDK methods"})]})]})}),e.jsx("div",{className:"p-4",children:e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-4",children:[e.jsx("div",{className:"lg:col-span-4 space-y-3",children:Ae.map(t=>{const c=J.filter(i=>i.category===t.id);return e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider",children:[t.icon,t.name]}),e.jsx("div",{className:"space-y-1",children:c.map(i=>e.jsxs("button",{onClick:()=>ge(i.id),className:`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${R===i.id?"bg-cyan-50 border border-cyan-200 text-cyan-700":"hover:bg-gray-50 text-gray-700"}`,children:[e.jsx("span",{className:`p-1.5 rounded-md ${ae(i.category)}`,children:i.icon}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"font-mono text-sm font-medium truncate",children:[i.name,"()"]}),e.jsx("div",{className:"text-xs text-gray-500 truncate",children:i.shortDescription})]}),R===i.id&&e.jsx(W,{className:"w-4 h-4 text-cyan-500 flex-shrink-0"})]},i.id))})]},t.id)})}),e.jsxs("div",{className:"lg:col-span-8 space-y-4",children:[e.jsx("div",{className:"p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:`p-3 rounded-xl ${ae(p.category)}`,children:p.icon}),e.jsxs("div",{className:"flex-1",children:[e.jsxs("h4",{className:"text-lg font-mono font-semibold text-gray-800",children:["learnCard.",p.name,"()"]}),e.jsx("p",{className:"mt-2 text-gray-600 text-sm leading-relaxed",children:p.description})]})]})}),p.parameters.length>0&&e.jsxs("div",{children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2",children:[e.jsx(E,{className:"w-4 h-4 text-gray-500"}),"Parameters"]}),e.jsx("div",{className:"border border-gray-200 rounded-xl overflow-hidden",children:p.parameters.map((t,c)=>e.jsxs("div",{className:`p-3 ${c>0?"border-t border-gray-200":""}`,children:[e.jsxs("div",{className:"flex items-start gap-2 flex-wrap",children:[e.jsx("code",{className:"px-2 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800",children:t.name}),e.jsx("code",{className:"px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs",children:t.type}),t.required&&e.jsx("span",{className:"px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium",children:"required"})]}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:t.description})]},t.name))})]}),e.jsxs("div",{children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2",children:[e.jsx(W,{className:"w-4 h-4 text-gray-500"}),"Returns"]}),e.jsxs("div",{className:"p-3 border border-gray-200 rounded-xl",children:[e.jsx("code",{className:"px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-sm",children:p.returns.type}),e.jsx("p",{className:"mt-1 text-sm text-gray-600",children:p.returns.description}),e.jsx("div",{className:"mt-2",children:e.jsx(U,{code:p.returns.example,maxHeight:"max-h-32"})})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("h5",{className:"text-sm font-semibold text-gray-800 flex items-center gap-2",children:[e.jsx(Ce,{className:"w-4 h-4 text-gray-500"}),"Example"]}),e.jsxs("button",{onClick:()=>q(p.code,"example"),className:"text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1",children:[N==="example"?e.jsx($,{className:"w-3 h-3 text-emerald-500"}):e.jsx(_,{className:"w-3 h-3"}),N==="example"?"Copied!":"Copy"]})]}),e.jsx(U,{code:p.code,maxHeight:"max-h-72"})]}),p.tips&&p.tips.length>0&&e.jsxs("div",{className:"p-3 bg-amber-50 border border-amber-200 rounded-xl",children:[e.jsxs("h5",{className:"text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2",children:[e.jsx(be,{className:"w-4 h-4"}),"Pro Tips"]}),e.jsx("ul",{className:"space-y-1",children:p.tips.map((t,c)=>e.jsxs("li",{className:"flex items-start gap-2 text-sm text-amber-700",children:[e.jsx(W,{className:"w-4 h-4 flex-shrink-0 mt-0.5"}),t]},c))})]})]})]})})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4 border-t border-gray-200",children:[e.jsxs("button",{onClick:()=>le("https://docs.learncard.com/sdks/partner-connect"),className:"flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors",children:[e.jsx(pe,{className:"w-4 h-4"}),"SDK Documentation",e.jsx(ce,{className:"w-3 h-3"})]}),e.jsxs("button",{onClick:()=>le("https://github.com/learningeconomy/LearnCard"),className:"flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors",children:[e.jsx(E,{className:"w-4 h-4"}),"GitHub Examples",e.jsx(ce,{className:"w-3 h-3"})]})]})]})]})]})};export{tt as PartnerConnectTab};
