// Vanilla island for LearnCard Embed SDK (no framework)
// Uses window.__LC_EMBED__ provided by parent page via inline script.
(function () {
  var config = window.__LC_EMBED__ || {};
  var root = document.getElementById('root');
  if (!root) {
    console.error('LearnCard Embed: #root not found in iframe');
    return;
  }

  var state = {
    view: 'email',
    email: '',
    code: '',
    consent: false,
    error: ''
  };

  function validEmail(v) { return /.+@.+\..+/.test(v); }

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
          setDigit(idx, v);
          if (v && idx < 5) focusIndex(idx + 1);
          if (!v && idx > 0) focusIndex(idx - 1);
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) focusIndex(idx - 1);
        });
        wrap.appendChild(input);
      })(i);
    }

    return wrap;
  }

  function EmailView() {
    var partner = config.partnerLabel || '';
    var cred = config.credentialName || 'Credential';

    return el('div', { id: 'view-email' }, [
      el('div', { class: 'title' }, [text('Claim “' + cred + '”')]),
      el('div', { class: 'subtitle' }, [text('Enter your email to receive a one-time code to add this credential to your LearnCard.')]),
      el('div', { class: 'field' }, [
        el('label', { class: 'label', for: 'email' }, [text('Email')]),
        (function () {
          var input = el('input', {
            id: 'email', class: 'input', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', value: state.email
          }, []);
          input.addEventListener('input', function (e) { state.email = e.target.value; });
          return input;
        })()
      ]),
      el('div', { class: 'center' }, [
        el('button', {
          id: 'send', class: 'btn btn-primary', onClick: function () {
            var email = (state.email || '').trim();
            if (!validEmail(email)) { state.error = 'Please enter a valid email.'; render(); return; }
            state.error = '';
            setTimeout(function () { state.view = 'otp'; render(); }, 300);
          }
        }, [text('Send Code')])
      ]),
      el('div', { class: 'error' }, [text(state.error || '')])
    ]);
  }

  function OtpView() {
    var codeWrap = otpInputs(state.code, function (v) { state.code = v; render(); });

    return el('div', { id: 'view-otp' }, [
      el('div', { class: 'title' }, [text('Enter 6‑digit code')]),
      el('div', { class: 'subtitle' }, [text('We sent a code to '), el('span', { id: 'email-disp' }, [text(state.email)]), text('. It expires in 10 minutes.')]),
      codeWrap,
      el('div', { class: 'center', style: 'margin-top: 8px' }, [
        el('button', {
          id: 'verify', class: 'btn btn-primary', disabled: state.code.length !== 6,
          onClick: function () {
            if (state.code.length !== 6) { state.error = 'Enter the 6-digit code.'; render(); return; }
            state.error = '';
            setTimeout(function () { state.view = 'success'; render(); }, 300);
          }
        }, [text('Verify')])
      ]),
      el('div', { class: 'error' }, [text(state.error || '')]),
      el('div', { class: 'hint' }, [text("Didn't get it? Check spam or try again.")])
    ]);
  }

  function SuccessView() {
    var consentWrap = null;
    if (config.showConsent) {
      var check = el('input', { id: 'consent', type: 'checkbox' }, []);
      check.checked = !!state.consent;
      check.addEventListener('change', function (e) { state.consent = !!e.target.checked; });
      consentWrap = el('label', { class: 'check', id: 'consent-wrap' }, [
        check,
        el('span', null, [text('Allow ' + (config.partnerLabel || '') + ' to automatically add future credentials to my LearnCard.')])
      ]);
    }

    return el('div', { id: 'view-success' }, [
      el('div', { class: 'success' }, [
        el('div', { class: 'title' }, [text('Success!')]),
        el('div', { class: 'subtitle' }, [text('Your credential has been added to your LearnCard.')]),
        consentWrap,
        el('div', { class: 'center' }, [
          el('button', {
            id: 'viewWallet', class: 'btn btn-primary', onClick: function () {
              var payload = {
                __lcEmbed: true,
                type: 'lc-embed:complete',
                nonce: config.nonce,
                payload: {
                  credentialId: 'temp-' + Date.now(),
                  consentGiven: !!state.consent
                }
              };
              window.parent.postMessage(payload, config.parentOrigin || '*');
            }
          }, [text('View My LearnCard')])
        ])
      ])
    ]);
  }

  function render() {
    clear(root);
    var wrap = el('div', { class: 'wrap' }, []);
    var viewEl = state.view === 'email' ? EmailView() : state.view === 'otp' ? OtpView() : SuccessView();
    wrap.appendChild(viewEl);
    root.appendChild(wrap);
  }

  render();
})();
