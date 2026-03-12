// Vanilla island for LearnCard Embed SDK (no framework)
// Uses window.__LC_EMBED__ provided by parent page via inline script.
(function () {
  var config = window.__LC_EMBED__ || {};
  var root = document.getElementById('root');
  if (!root) {
    console.error('LearnCard Embed: #root not found in iframe');
    return;
  }

  // --- State ---
  var state = {
    view: (config.loggedInEmail ? 'accept' : 'email'),
    email: (config.loggedInEmail || ''),
    code: '',
    consent: false,
    error: '',
    pending: false,
    usedEmailFlow: !config.loggedInEmail // tracks if user went through email/otp (for stepper on success)
  };

  // --- Helpers ---
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function text(t) { return document.createTextNode(t); }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (k === 'class') n.className = v;
        else if (k === 'for') n.htmlFor = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'onClick') n.addEventListener('click', v);
        else if (k === 'onInput') n.addEventListener('input', v);
        else if (k === 'onChange') n.addEventListener('change', v);
        else if (k === 'disabled') n.disabled = !!v;
        else if (k === 'checked') n.checked = !!v;
        else if (v != null) n.setAttribute(k, String(v));
      }
    }
    if (children && children.length) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        n.appendChild(typeof c === 'string' ? text(c) : c);
      }
    }
    return n;
  }

  function validEmail(v) {
    if (typeof v !== 'string') return false;
    var s = v.trim();
    if (!s) return false;
    try {
      var inp = document.createElement('input');
      inp.type = 'email';
      inp.value = s;
      return inp.checkValidity();
    } catch (e) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
  }

  // --- PostMessage ---
  function sendToParent(type, payload) {
    try {
      if (!config.parentOrigin) { console.error('LearnCard Embed: missing parentOrigin'); return; }
      window.parent.postMessage({ __lcEmbed: true, type: type, nonce: config.nonce, payload: payload }, config.parentOrigin);
    } catch (e) {}
  }

  function isTrustedReply(data, type) {
    return (
      data && typeof data === 'object' && data.__lcEmbed === true && data.type === type && data.nonce === config.nonce
    );
  }

  // --- Shared Components ---

  function ProgressStepper(step) {
    // step: 1 (email), 2 (otp), 3 (success)
    var dots = [];
    for (var i = 1; i <= 3; i++) {
      var cls = 'lc-dot';
      if (i < step) cls += ' done';
      else if (i === step) cls += ' active';
      dots.push(el('div', { class: cls }, []));
      if (i < 3) {
        var barCls = 'lc-bar';
        if (i < step) barCls += ' done';
        dots.push(el('div', { class: barCls }, []));
      }
    }
    return el('div', { class: 'lc-stepper' }, dots);
  }

  function CredentialCard() {
    var credName = config.credentialName || 'Credential';
    var issuer = config.partnerName || config.partnerLabel || '';
    return el('div', { class: 'cred-card' }, [
      el('div', { class: 'cred-card-label' }, [text('Credential')]),
      el('div', { class: 'cred-card-name' }, [text(credName)]),
      issuer ? el('div', { class: 'cred-card-issuer' }, [text('Issued by ' + issuer)]) : null
    ]);
  }

  function Footer() {
    var logoUrl = config.logoUrl || '';
    var lockSvg = '<svg viewBox="0 0 24 24" fill="#c0c8d0" style="width:10px;height:10px;flex-shrink:0;"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>';
    var footer = el('div', { class: 'lc-footer' }, []);
    footer.innerHTML = lockSvg + ' Secured by ';
    if (logoUrl) {
      var img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'LearnCard';
      footer.appendChild(img);
    } else {
      footer.appendChild(text('LearnCard'));
    }
    return footer;
  }

  function spinnerSvg() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'spinner');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '10');
    circle.setAttribute('stroke-dasharray', '42');
    circle.setAttribute('stroke-dashoffset', '14');
    circle.setAttribute('stroke-linecap', 'round');
    svg.appendChild(circle);
    return svg;
  }

  function setButtonLoading(btn, loadingText) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = '';
    btn.appendChild(spinnerSvg());
    btn.appendChild(text(loadingText));
  }

  // --- OTP Inputs ---
  function otpInputs(value, onInput) {
    var wrap = el('div', { class: 'otp' }, []);
    var digits = (value || '').split('');

    function setDigit(i, v) {
      digits[i] = v || '';
      onInput(digits.join(''));
    }

    function focusIndex(i) {
      var inputs = wrap.querySelectorAll('input');
      if (inputs[i]) inputs[i].focus();
    }

    for (var i = 0; i < 6; i++) {
      (function (idx) {
        var input = el('input', {
          type: 'text', inputMode: 'numeric', maxLength: 1,
          value: digits[idx] || ''
        }, []);
        input.addEventListener('input', function (e) {
          var v = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
          e.target.value = v;
          setDigit(idx, v);
          // Add/remove filled class
          if (v) {
            e.target.classList.add('filled');
            if (idx < 5) focusIndex(idx + 1);
          } else {
            e.target.classList.remove('filled');
            if (idx > 0) focusIndex(idx - 1);
          }
        });
        input.addEventListener('paste', function (e) {
          e.preventDefault();
          var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
          if (!pasted) return;
          var inputs = wrap.querySelectorAll('input');
          for (var j = 0; j < pasted.length && j < 6; j++) {
            digits[j] = pasted[j];
            if (inputs[j]) {
              inputs[j].value = pasted[j];
              inputs[j].classList.add('filled');
            }
          }
          onInput(digits.join(''));
          focusIndex(Math.min(pasted.length, 5));
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) focusIndex(idx - 1);
        });
        // Set filled class on initial render if digit exists
        if (digits[idx]) input.className = 'filled';
        wrap.appendChild(input);
      })(i);
    }

    return wrap;
  }

  // --- Confetti ---
  var confettiColors = ['#2EC4A5','#f59e0b','#8b5cf6','#ef4444','#3b82f6','#ec4899','#10b981','#06b6d4','#f43f5e','#fbbf24','#a78bfa','#34d399'];
  var confettiShapes = [
    {w:8,h:8,r:2}, {w:6,h:10,r:2}, {w:10,h:6,r:2}, {w:7,h:7,r:50}, {w:5,h:5,r:50}
  ];

  function createConfetti(container) {
    for (var i = 0; i < 24; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      var color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      var shape = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
      var left = (Math.random() * 90 + 5);
      var delay = (Math.random() * 0.4);
      var duration = (2.0 + Math.random() * 1.2);
      var rotation = (540 + Math.random() * 540);
      piece.style.cssText =
        'left:' + left + '%;' +
        'background:' + color + ';' +
        'width:' + shape.w + 'px;' +
        'height:' + shape.h + 'px;' +
        'border-radius:' + shape.r + '%;' +
        '--delay:' + delay + 's;' +
        '--duration:' + duration + 's;' +
        '--rotation:' + rotation + 'deg;';
      container.appendChild(piece);
    }
  }

  // --- Views ---

  function EmailView() {
    var emailInput;

    return el('div', { id: 'view-email' }, [
      ProgressStepper(1),
      CredentialCard(),
      el('div', { class: 'view-content' }, [
        el('div', { class: 'field' }, [
          el('label', { class: 'label', for: 'email' }, [text('Email address')]),
          (function () {
            emailInput = el('input', {
              id: 'email', class: 'input', type: 'email',
              placeholder: 'you@example.com', autocomplete: 'email', value: state.email
            }, []);
            emailInput.addEventListener('input', function (e) {
              state.email = e.target.value;
              var btn = document.getElementById('send');
              if (btn) btn.disabled = !validEmail((state.email || '').trim()) || !!state.pending;
              if (state.error) {
                state.error = '';
                var err = document.getElementById('error');
                if (err) err.textContent = '';
              }
            });
            emailInput.addEventListener('keydown', function (e) {
              if (e.key === 'Enter') { var btn = document.getElementById('send'); if (btn && !btn.disabled) btn.click(); }
            });
            return emailInput;
          })()
        ]),
        el('button', {
          id: 'send', class: 'btn btn-primary',
          disabled: !validEmail((state.email || '').trim()) || !!state.pending,
          onClick: function () {
            var email = (state.email || '').trim();
            if (!validEmail(email)) { state.error = 'Please enter a valid email.'; render(); return; }
            state.error = '';
            state.pending = true;
            var btn = document.getElementById('send');
            if (btn) setButtonLoading(btn, 'Sending...');
            sendToParent('lc-embed:email-submit', { email: email });
          }
        }, [text('Send Code \u2192')]),
        el('div', { class: 'error', id: 'error' }, [text(state.error || '')])
      ])
    ]);
  }

  function OtpView() {
    var codeWrap = otpInputs(state.code, function (v) {
      state.code = v;
      var verifyBtn = document.getElementById('verify');
      if (verifyBtn) verifyBtn.disabled = (state.code.length !== 6) || !!state.pending;
      if (state.error && state.code.length > 0) {
        state.error = '';
        var err = document.getElementById('error');
        if (err) err.textContent = '';
      }
    });

    return el('div', { id: 'view-otp' }, [
      ProgressStepper(2),
      el('div', { class: 'view-content' }, [
        el('div', { class: 'title' }, [text('Enter verification code')]),
        el('div', { class: 'subtitle' }, [text('We sent a code to '), el('strong', null, [text(state.email)]), text('. It expires in 10 minutes.')]),
        codeWrap,
        el('button', {
          id: 'verify', class: 'btn btn-primary',
          disabled: state.code.length !== 6 || !!state.pending,
          onClick: function () {
            if (state.code.length !== 6) { state.error = 'Enter the 6-digit code.'; render(); return; }
            state.error = '';
            state.pending = true;
            var btn = document.getElementById('verify');
            if (btn) setButtonLoading(btn, 'Verifying...');
            sendToParent('lc-embed:otp-verify', { email: state.email, code: state.code });
          }
        }, [text('Verify')]),
        el('div', { class: 'error', id: 'error' }, [text(state.error || '')]),
        el('div', { class: 'hint' }, [text("Didn't get it? Check spam or try again.")])
      ])
    ]);
  }

  function AcceptView() {
    return el('div', { id: 'view-accept' }, [
      CredentialCard(),
      el('div', { class: 'view-content' }, [
        el('div', { class: 'subtitle', style: 'margin-top: 8px' }, [
          text('Signed in as '),
          el('strong', null, [text(state.email)])
        ]),
        el('button', {
          id: 'accept', class: 'btn btn-primary',
          disabled: !!state.pending,
          onClick: function () {
            state.error = '';
            state.pending = true;
            var btn = document.getElementById('accept');
            if (btn) setButtonLoading(btn, 'Claiming...');
            sendToParent('lc-embed:accept', { email: state.email });
          }
        }, [text('Accept Credential \u2192')]),
        el('button', {
          id: 'logout', class: 'btn btn-secondary',
          disabled: !!state.pending,
          onClick: function () {
            state.error = '';
            state.pending = true;
            render();
            sendToParent('lc-embed:logout', {});
          }
        }, [text('Use a different email')]),
        el('div', { class: 'error', id: 'error' }, [text(state.error || '')])
      ])
    ]);
  }

  function SuccessView() {
    // Show stepper only if user went through email/otp flow (not accept-only)
    var showStepper = state.usedEmailFlow;

    var consentWrap = null;
    if (config.showConsent) {
      var check = el('input', { id: 'consent', type: 'checkbox' }, []);
      check.checked = !!state.consent;
      check.addEventListener('change', function (e) { state.consent = !!e.target.checked; });
      consentWrap = el('label', { class: 'consent-row', id: 'consent-wrap' }, [
        check,
        el('span', null, [text('Allow ' + (config.partnerName || config.partnerLabel || '') + ' to automatically add future credentials to my LearnCard.')])
      ]);
    }

    // Build checkmark SVG
    var checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    checkSvg.setAttribute('viewBox', '0 0 24 24');
    checkSvg.setAttribute('fill', 'none');
    checkSvg.setAttribute('stroke', '#10b981');
    checkSvg.setAttribute('stroke-width', '2.5');
    checkSvg.style.cssText = 'width:36px;height:36px;';
    var checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    checkPath.setAttribute('class', 'checkmark-path');
    checkPath.setAttribute('d', 'M20 6L9 17l-5-5');
    checkPath.setAttribute('stroke-linecap', 'round');
    checkPath.setAttribute('stroke-linejoin', 'round');
    checkSvg.appendChild(checkPath);

    var confettiContainer = el('div', { class: 'confetti-container' }, []);

    var children = [];
    if (showStepper) children.push(ProgressStepper(3));
    children.push(confettiContainer);
    children.push(el('div', { class: 'view-content' }, [
      el('div', { class: 'success' }, [
        el('div', { class: 'success-circle' }, [checkSvg]),
        el('div', { class: 'title' }, [text('Credential Claimed!')]),
        el('div', { class: 'subtitle' }, [text('Your credential has been securely added to your LearnCard wallet.')]),
        consentWrap,
        el('button', {
          id: 'viewWallet', class: 'btn btn-primary',
          onClick: function () {
            var payload = {
              __lcEmbed: true,
              type: 'lc-embed:complete',
              nonce: config.nonce,
              payload: {
                credentialId: 'temp-' + Date.now(),
                consentGiven: !!state.consent
              }
            };
            if (!config.parentOrigin) { console.error('LearnCard Embed: missing parentOrigin'); return; }
            window.parent.postMessage(payload, config.parentOrigin);
          }
        }, [text('View My LearnCard')])
      ])
    ]));

    var viewEl = el('div', { id: 'view-success' }, children);

    // Fire confetti after mount
    setTimeout(function () { createConfetti(confettiContainer); }, 100);

    return viewEl;
  }

  // --- Message Handlers ---
  window.addEventListener('message', function (ev) {
    var data = ev.data;

    if (isTrustedReply(data, 'lc-embed:email-submit:result')) {
      state.pending = false;
      if (data.payload && data.payload.ok) {
        state.view = 'otp';
        state.error = '';
      } else {
        state.error = (data.payload && data.payload.error) || 'Failed to send code.';
      }
      render();
      return;
    }

    if (isTrustedReply(data, 'lc-embed:otp-verify:result')) {
      state.pending = false;
      if (data.payload && data.payload.ok) {
        state.view = 'success';
        state.error = '';
      } else {
        state.error = (data.payload && data.payload.error) || 'Verification failed.';
      }
      render();
      return;
    }

    if (isTrustedReply(data, 'lc-embed:accept:result')) {
      state.pending = false;
      if (data.payload && data.payload.ok) {
        state.view = 'success';
        state.error = '';
      } else {
        state.error = (data.payload && data.payload.error) || 'Failed to claim credential.';
      }
      render();
      return;
    }

    if (isTrustedReply(data, 'lc-embed:logout:result')) {
      state.pending = false;
      state.view = 'email';
      state.email = '';
      state.code = '';
      state.error = '';
      state.usedEmailFlow = true; // user switched to email flow
      render();
      return;
    }
  });

  // --- Render ---
  var currentView = null;

  function render() {
    var viewEl = state.view === 'email'
      ? EmailView()
      : state.view === 'otp'
      ? OtpView()
      : state.view === 'accept'
      ? AcceptView()
      : SuccessView();

    var wrap = el('div', { class: 'wrap' }, []);
    var viewWrap = el('div', { class: 'view-wrap' }, [viewEl]);
    wrap.appendChild(viewWrap);
    wrap.appendChild(Footer());

    if (currentView && currentView !== state.view) {
      // View transition: fade out old, swap, fade in new
      var oldContent = root.firstChild;
      if (oldContent) {
        var oldViewWrap = oldContent.querySelector('.view-wrap');
        if (oldViewWrap) {
          oldViewWrap.classList.add('exiting');
          setTimeout(function () {
            clear(root);
            viewWrap.classList.add('entering');
            root.appendChild(wrap);
            // Force reflow then remove entering class to trigger transition
            void viewWrap.offsetWidth;
            viewWrap.classList.remove('entering');
          }, 200);
          currentView = state.view;
          return;
        }
      }
    }

    // No transition (first render or same view re-render)
    clear(root);
    root.appendChild(wrap);
    currentView = state.view;
  }

  // --- Init ---
  render();
})();
