const root = document.getElementById('app');
const token = document.querySelector('meta[name="demo-token"]').content;
let state = { ready: false, activity: [], webhooks: [] };
let role = 'learner';
let busy = '';
let notice = '';
let error = false;
let detail = false;
let review = null;
let confirmation = false;
let selections = { name: true, email: false, receiveOutcomes: true, shareOutcomes: true };
const names = { referrer: 'Hire Heroes USA', learner: 'Veteran', partner: 'Hiring Our Heroes' };
const escape = value =>
    String(value ?? '').replace(
        /[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
const time = value =>
    new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const icons = {
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
    building: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 8h1m4 0h1M9 12h1m4 0h1"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    cap: '<path d="m2 8 10-5 10 5-10 5-10-5Zm4 3v6c4 3 8 3 12 0v-6M22 8v9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    shield: '<path d="M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7l-9-4Z"/><path d="m8 12 3 3 5-5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-3l2 3M4 17l2 3a8 8 0 0 0 13-3"/>',
    handshake:
        '<path d="m2 12 4-7 5 1 3-1 8 7-4 6-4 3-8-5-4-4Zm4-7 4 4 3-3 5 5M6 16l3-3 6 5M9 18l3-3"/>',
    alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
};
const icon = name =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
        icons[name] ?? icons.link
    }</svg>`;
const button = (action, label, { disabled = false, style = 'primary', symbol = '' } = {}) =>
    `<button type="button" class="${style}" data-action="${action}" ${
        busy || disabled ? 'disabled' : ''
    }>${
        busy === action
            ? '<span class="spin" aria-hidden="true"></span>Working…'
            : `${symbol ? icon(symbol) : ''}${label}`
    }</button>`;
const status = () => state.request?.status ?? 'not sent';
const pill = (label, color = '') => `<span class="pill ${color}">${escape(label)}</span>`;
const permission = (key, title, description) =>
    `<label class="permission"><span><strong>${title}</strong><small>${description}</small></span><input type="checkbox" data-choice="${key}" ${
        selections[key] ? 'checked' : ''
    } ${busy ? 'disabled' : ''}/></label>`;
const permissions = () =>
    `<div class="permissions">${permission('name', 'Name', 'Alex Morgan · optional')}${permission(
        'email',
        'Email address',
        'alex@example.test · optional'
    )}${permission(
        'receiveOutcomes',
        'Receive career outcomes',
        'Let Hiring Our Heroes send an enrollment credential'
    )}${permission(
        'shareOutcomes',
        'Share claimed career outcomes',
        'With the organizations listed above'
    )}</div>`;
const audience = () =>
    `<div class="audience">${(state.contract?.audience ?? [])
        .map(org => `<span>${escape(org.name)}</span>`)
        .join('')}</div>`;
const outcomeCard = () =>
    state.outcome
        ? `<div class="outcome"><div class="node-icon navy">${icon(
              'cap'
          )}</div><div><strong>Career services enrollment</strong><p>${
              state.outcome.shared && state.sharingActive && state.choices.shareOutcomes
                  ? 'Claimed and shared under your current permissions.'
                  : state.outcome.claimed
                    ? 'Claimed by Alex. Currently withheld from future data reads.'
                    : 'Recorded by Hiring Our Heroes. Waiting for Alex to claim.'
          }</p></div></div>`
        : '';

const learner = () => {
    if (!state.ready || status() === 'not sent')
        return `<div class="empty"><div class="node-icon">${icon(
            'person'
        )}</div><h3>Your next chapter starts here</h3><p>${
            state.ready
                ? 'Switch to Hire Heroes USA and send Alex a referral. No information is shared until Alex confirms.'
                : 'Set up the demo to create three local test accounts and a partner contract. You will make each decision through this interface.'
        }</p>${
            !state.ready
                ? button('setup', 'Set up demo', { symbol: 'people', style: 'positive' })
                : ''
        }</div>`;
    const pending = status() === 'pending';
    const card =
        pending && !state.dismissed
            ? `<div class="invite"><button class="icon" type="button" aria-label="Dismiss invitation" data-action="dismiss" ${
                  busy ? 'disabled' : ''
              }>${icon('close')}</button><div class="invite-content"><div class="handshake">${icon(
                  'handshake'
              )}</div><div><div class="eyebrow">Partner Connect</div><h3>Hire Heroes USA has referred you<br/>to Hiring Our Heroes.</h3><p>Get personalized career support and access resources through Hiring Our Heroes.</p><div class="invite-actions">${button(
                  'review',
                  'Accept &amp; Connect'
              )}${button('details', 'View Details', {
                  style: 'secondary',
              })}</div></div></div></div>`
            : '';
    const recovery =
        pending && state.dismissed
            ? `<div class="empty"><div class="node-icon">${icon(
                  'link'
              )}</div><h3>Invitation saved for later</h3><p>Closing the alert did not decline it. The invitation is still available in your pending invitations.</p>${button(
                  'reopen',
                  'Open pending invitation',
                  { style: 'secondary' }
              )}</div>`
            : '';
    const details =
        detail || review
            ? `<div class="detail"><div class="eyebrow">${
                  review ? 'Review before connecting' : 'Partner details'
              }</div><h3 style="margin-top:8px">Choose what you want to share</h3><p>Hiring Our Heroes offers career support. Your approved information will be available to these organizations:</p>${audience()}${
                  review
                      ? `${permissions()}<p>You can change these choices or stop sharing later. No consent is recorded until you confirm.</p><div class="button-row">${button(
                            'accept',
                            'Confirm &amp; Connect',
                            { style: 'positive', symbol: 'check' }
                        )}${button('back', 'Back', {
                            style: 'secondary',
                        })}</div><details class="testing"><summary>Test cancellation during review</summary><p>Have the partner cancel this invitation, then try Confirm &amp; Connect. The backend should reject the stale invitation.</p>${button(
                            'cancel',
                            'Partner: cancel invitation',
                            { style: 'secondary' }
                        )}</details>`
                      : `<p style="margin-top:14px">Requested: optional name and email, plus permission to receive and share career outcomes.</p><div class="button-row">${button(
                            'review',
                            'Review my permissions',
                            { style: 'positive' }
                        )}${button('askDecline', 'Decline', { style: 'secondary' })}${button(
                            'notNow',
                            'Not Now',
                            { style: 'secondary' }
                        )}</div>`
              }</div>`
            : '';
    const confirmed =
        status() === 'accepted' && !review
            ? `<div class="explain"><strong>${
                  state.sharingActive ? 'You are connected.' : 'You stopped sharing.'
              }</strong> ${
                  state.sharingActive
                      ? 'Your choices control what both organizations can read.'
                      : 'No consented records are available for future reads. Previously delivered copies may remain with recipients.'
              }</div>${
                  state.sharingActive
                      ? `<div class="detail"><h3>Privacy &amp; Data</h3><p>Organizations receiving your approved information:</p>${audience()}${permissions()}<div class="button-row">${button(
                            'permissions',
                            'Save permissions',
                            { style: 'positive' }
                        )}${button('withdraw', 'Stop sharing', { style: 'secondary' })}</div></div>`
                      : ''
              }${outcomeCard()}${
                  state.outcome &&
                  state.sharingActive &&
                  (!state.outcome.claimed || (state.choices.shareOutcomes && !state.outcome.shared))
                      ? button(
                            'claim',
                            state.outcome.claimed
                                ? 'Share claimed outcome'
                                : state.choices.shareOutcomes
                                  ? 'Claim &amp; share outcome'
                                  : 'Claim outcome privately',
                            { symbol: 'cap', style: 'positive' }
                        )
                      : ''
              }`
            : '';
    const terminal =
        ['denied', 'cancelled'].includes(status()) && !review
            ? `<div class="empty"><div class="node-icon">${icon('shield')}</div><h3>${
                  status() === 'denied'
                      ? 'You declined this referral'
                      : 'This invitation was cancelled'
              }</h3><p>No consent was created. Start a fresh scenario to try a different decision.</p></div>`
            : '';
    return `${card}${recovery}${details}${confirmed}${terminal}${
        confirmation
            ? `<div class="confirmation">Decline this referral to Hiring Our Heroes?<div class="button-row">${button(
                  'decline',
                  'Confirm decline',
                  { style: 'danger' }
              )}${button('keep', 'Keep invitation', { style: 'secondary' })}</div></div>`
            : ''
    }`;
};
const referrer = () =>
    `<div class="explain"><strong>Your role: referring organization.</strong> Hire Heroes USA introduces Alex to the partner. Being named as a data recipient lets you read only what Alex approves.</div><div class="detail"><h3>Refer Alex to Hiring Our Heroes</h3><p>Career services and personalized resources, with the veteran in control.</p>${audience()}<div class="button-row">${button(
        'send',
        'Send referral',
        { style: 'positive', symbol: 'send', disabled: !state.ready || status() !== 'not sent' }
    )}</div></div><div class="external">Salesforce / external mediator: context from the product brief. This demo calls the referral API directly.</div>${outcomeCard()}<div class="timeline"><h3>Referral record</h3><div class="data-row"><span>Decision</span><strong>${escape(
        status()
    )}</strong></div><div class="data-row"><span>Reference</span><strong>${escape(
        state.reference || 'Created on setup'
    )}</strong></div></div>`;
const partner = () =>
    `<div class="explain"><strong>Your role: receiving partner.</strong> Hiring Our Heroes owns the consent contract. Receiving a referral grants no access by itself; Alex must approve the requested permissions.</div><div class="detail"><h3>Record a career outcome</h3><p>Record Alex’s enrollment in career services. The credential first goes to Alex; sharing follows their choice after claim.</p>${outcomeCard()}<div class="button-row">${button(
        'issue',
        'Record enrollment outcome',
        {
            style: 'positive',
            symbol: 'cap',
            disabled: !state.sharingActive || !state.choices?.receiveOutcomes || !!state.outcome,
        }
    )}</div>${
        !state.sharingActive
            ? '<p style="margin-top:13px">Waiting for Alex’s active consent.</p>'
            : !state.choices.receiveOutcomes
              ? '<p style="margin-top:13px">Alex has not permitted career outcome issuance.</p>'
              : ''
    }</div><details class="testing"><summary>Test partner controls</summary><p>Cancel a pending invitation, or remove the referrer after consent to narrow future access.</p><div class="button-row">${button(
        'cancel',
        'Cancel invitation',
        { style: 'secondary', disabled: status() !== 'pending' }
    )}${button('removeRecipient', 'Remove Hire Heroes USA', {
        style: 'secondary',
        disabled: !state.sharingActive || state.contract?.audience.length < 2,
    })}</div></details>`;

const organization = (key, title) => {
    const data = state.data?.[key];
    return `<div class="org-data"><header><strong>${title}</strong>${pill(
        data?.records
            ? 'Approved data'
            : data?.allowed === false
              ? 'Access removed'
              : 'No shared data',
        data?.records ? 'green' : ''
    )}</header>${
        data?.records
            ? `${Object.entries(data.personal)
                  .map(
                      ([field, value]) =>
                          `<div class="data-row"><span>${escape(field)}</span><strong>${escape(
                              value
                          )}</strong></div>`
                  )
                  .join('')}${data.credentials
                  .map(
                      credential =>
                          `<div class="data-row"><span>Outcome</span><strong>${escape(
                              credential.name
                          )}</strong></div>`
                  )
                  .join('')}${
                  data.credentials.length
                      ? '<div class="data-row"><span>Encrypted copy</span><strong>Decryption verified</strong></div>'
                      : ''
              }`
            : '<div class="data-empty">No consented records returned.</div>'
    }</div>`;
};
const eventNames = {
    request_sent: 'Referral sent',
    request_accepted: 'Referral accepted',
    request_denied: 'Referral declined',
    request_cancelled: 'Referral cancelled',
    consent_created: 'Consent recorded',
    consent_updated: 'Permissions updated',
    consent_withdrawn: 'Sharing stopped',
    credentials_synced: 'Claimed outcome shared',
};
const render = () => {
    const stage = !state.ready
        ? 0
        : status() === 'not sent'
          ? 1
          : status() === 'pending' || status() === 'denied' || status() === 'cancelled'
            ? 2
            : !state.outcome
              ? 3
              : !state.outcome.shared
                ? 4
                : 5;
    const steps = ['Set up', 'Refer', 'Review & consent', 'Record outcome', 'Claim & share'];
    root.innerHTML = `<main class="shell"><header><div class="wordmark"><div class="mark">${icon(
        'people'
    )}</div><div><strong>Partner Connect</strong><small>Local referral playground · LC-2226</small></div></div><div class="header-actions"><span class="local-badge"><span class="dot"></span>Local test APIs</span>${button(
        state.ready ? 'fresh' : 'setup',
        state.ready ? 'Fresh scenario' : 'Set up demo',
        { style: 'secondary', symbol: state.ready ? 'refresh' : 'people' }
    )}</div></header><section class="intro"><div><div class="eyebrow">Inspired by the VetPass product brief</div><h1>A stronger referral.<br/>A veteran in control.</h1><p>Explore one referral from introduction to shared outcome. Switch roles to see what each person can do, and watch the live evidence as you go.</p></div><span class="chapter">Three accounts. One clear journey.</span></section><section class="flow" aria-label="Referral flow"><div class="flow-title"><strong>The Partner Connect way</strong><span>Synthetic example · real local API actions</span></div><div class="flow-nodes"><div class="flow-node"><div class="node-icon red">${icon(
        'building'
    )}</div><div><strong>Hire Heroes USA</strong><small>Referring organization</small></div></div><div class="arrow"><span>referral</span><i class="arrow-line"></i><i class="arrow-line back"></i><span>approved updates</span></div><div class="flow-node"><div class="node-icon">${icon(
        'person'
    )}</div><div><strong>Alex in VetPass</strong><small>Reviews and controls sharing</small></div></div><div class="arrow"><span>approved data</span><i class="arrow-line"></i><i class="arrow-line back"></i><span>career outcomes</span></div><div class="flow-node"><div class="node-icon navy">${icon(
        'cap'
    )}</div><div><strong>Hiring Our Heroes</strong><small>Receiving partner</small></div></div></div><div class="journey">${steps
        .map(
            (step, i) =>
                `<div class="step ${i < stage ? 'done' : i === stage ? 'current' : ''}"><i>${
                    i < stage ? icon('check') : i + 1
                }</i>${step}</div>`
        )
        .join('')}</div></section>${
        notice
            ? `<div class="notice ${error ? 'error' : ''}" role="${
                  error ? 'alert' : 'status'
              }">${icon(error ? 'alert' : 'check')}<p>${escape(
                  notice
              )}</p><button data-action="clear" aria-label="Dismiss message">Close</button></div>`
            : ''
    }<div class="workspace"><section><nav class="tabs" aria-label="Choose a role">${Object.entries(
        names
    )
        .map(
            ([key, name]) =>
                `<button class="tab ${
                    key === role ? 'active' : ''
                }" type="button" data-role="${key}" aria-pressed="${key === role}">${icon(
                    key === 'referrer' ? 'building' : key === 'learner' ? 'person' : 'cap'
                )}${name}</button>`
        )
        .join('')}</nav><div class="pane"><div class="pane-header"><div><h2>${
        role === 'learner' ? 'Alex’s invitation & sharing' : names[role]
    }</h2><p class="pane-subtitle">${
        role === 'learner'
            ? 'Learner view · demo interface'
            : role === 'referrer'
              ? 'Referrer view · introduces the partner'
              : 'Partner view · owns the contract'
    }</p></div>${pill(
        state.sharingActive ? 'Connected' : status() === 'not sent' ? 'Ready to refer' : status(),
        state.sharingActive ? 'green' : status() === 'pending' ? 'amber' : ''
    )}</div>${
        role === 'learner' ? learner() : role === 'referrer' ? referrer() : partner()
    }</div><div class="timeline"><h3>What just happened</h3>${
        state.activity
            .slice(0, 5)
            .map(
                item =>
                    `<div class="activity">${escape(item.message)}<time>${time(
                        item.at
                    )}</time></div>`
            )
            .join('') || '<div class="activity">Set up the three accounts to begin.</div>'
    }</div></section><aside><section class="aside-card"><div class="aside-heading">${icon(
        'shield'
    )}<h2>What organizations can read</h2></div><p>Fetched from the consent APIs. No shared record appears before approval; unselected fields stay absent.</p>${organization(
        'referrer',
        'Hire Heroes USA'
    )}${organization(
        'partner',
        'Hiring Our Heroes'
    )}</section><section class="aside-card"><div class="aside-heading">${icon(
        'link'
    )}<h2>Signed updates</h2></div><p>Delivered to the local receiver. The service signature is verified and the original referral reference follows permitted updates.</p><div class="events">${
        state.webhooks
            .slice(0, 12)
            .map(
                event =>
                    `<div class="event"><span class="dot"></span><div><strong>${escape(
                        eventNames[event.event] ?? event.event
                    )}</strong><span>${escape(names[event.role])} · ${time(
                        event.at
                    )} · verified</span>${
                        event.reference ? `<code>${escape(event.reference)}</code>` : ''
                    }</div></div>`
            )
            .join('') || '<div class="data-empty">Updates will appear as you act.</div>'
    }</div></section><section class="aside-card"><details><summary>API &amp; test details</summary><div class="technical">Brain / cloud / signing service<code>localhost:4000 / 4100 / 5200</code>Contract<code>${escape(
        state.contract?.uri || 'Not created'
    )}</code>Referral reference<code>${escape(state.reference)}</code>Request<code>${escape(
        state.request?.requestId || 'Not sent'
    )}</code>${Object.entries(state.actors ?? {})
        .map(([key, actor]) => `${escape(names[key])}<code>${escape(actor.profileId)}</code>`)
        .join(
            ''
        )}Fresh scenario creates a new contract and referral; earlier synthetic history remains in the local database. No real accounts are used.</div></details></section></aside></div><footer class="footer">This is a local test interface for the PR’s real APIs, inspired by the Hire Heroes USA mockup.<br/>Salesforce is an external client. Actual VetPass alert screens, guardian approval and automatic app claim-to-sync need separate app QA.</footer></main>`;
};
const getState = async () => {
    const response = await fetch('/api/state');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    state = result;
};
const act = async (action, extra = {}) => {
    if (busy) return;
    busy = action;
    notice = '';
    error = false;
    render();
    try {
        const response = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Demo-Token': token },
            body: JSON.stringify({ action, ...extra }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        state = result;
        if (['setup', 'fresh', 'accept', 'permissions'].includes(action))
            selections = { ...state.choices };
        if (['fresh', 'accept', 'decline', 'withdraw'].includes(action)) {
            review = null;
            detail = false;
        }
        confirmation = false;
        if (action !== 'seen')
            notice =
                action === 'claim'
                    ? 'Outcome claimed. Check both organizations’ live data and signed updates.'
                    : action === 'fresh'
                      ? 'Fresh scenario ready. Send a new referral from Hire Heroes USA.'
                      : (state.activity[0]?.message ?? 'Action complete.');
    } catch (err) {
        notice = err.message;
        error = true;
        try {
            await getState();
        } catch {
            /* Preserve the current screen and actionable error. */
        }
    } finally {
        busy = '';
        render();
    }
};
root.addEventListener('change', event => {
    if (event.target.dataset.choice) selections[event.target.dataset.choice] = event.target.checked;
});
root.addEventListener('click', async event => {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.dataset.role) {
        role = target.dataset.role;
        render();
        return;
    }
    const action = target.dataset.action;
    if (action === 'clear') {
        notice = '';
        render();
        return;
    }
    if (action === 'details') {
        detail = true;
        await act('seen');
        return;
    }
    if (action === 'review') {
        review = {
            expectedRequestId: state.request.requestId,
            audienceVersion: state.contract.audienceVersion,
        };
        detail = true;
        await act('seen');
        return;
    }
    if (action === 'back' || action === 'notNow') {
        review = null;
        detail = action === 'back';
        render();
        return;
    }
    if (action === 'askDecline' || action === 'keep') {
        confirmation = action === 'askDecline';
        render();
        return;
    }
    if (action === 'accept') {
        await act(action, { choices: selections, ...review });
        return;
    }
    if (action === 'permissions') {
        await act(action, { choices: selections });
        return;
    }
    await act(action);
});
render();
getState()
    .then(() => {
        if (state.choices) selections = { ...state.choices };
        render();
    })
    .catch(err => {
        notice = err.message;
        error = true;
        render();
    });
setInterval(async () => {
    if (busy || document.hidden) return;
    const openDetails = [...document.querySelectorAll('details')].map(node => node.open);
    try {
        await getState();
        render();
        document.querySelectorAll('details').forEach((node, i) => {
            node.open = openDetails[i] ?? false;
        });
    } catch {
        /* Explicit actions report connection failures. */
    }
}, 5000);
