// Minimal Preact island for LearnCard Embed SDK
// Assumes Preact UMD is already loaded and available as window.preact
(function(){
  var preact = window.preact;
  if (!preact) { throw new Error('LearnCard Embed: Preact not available in island'); }
  var h = preact.h, Component = preact.Component, render = preact.render;

  function validEmail(v){ return /.+@.+\..+/.test(v); }

  function OtpInputs(props){
    var digits = props.value.split('');
    function onChange(i, e){
      var v = e.target.value.replace(/[^0-9]/g,'').slice(0,1);
      if (v) digits[i] = v; else digits[i] = '';
      props.onInput(digits.join(''));
      if (v && i < 5) {
        var next = e.target.parentElement.querySelectorAll('input')[i+1];
        if (next) next.focus();
      } else if (!v && i > 0) {
        var prev = e.target.parentElement.querySelectorAll('input')[i-1];
        if (prev) prev.focus();
      }
    }
    return h('div', { class: 'otp' },
      [0,1,2,3,4,5].map(function(i){
        return h('input', {
          type: 'text', inputMode: 'numeric', maxLength: 1,
          value: digits[i] || '',
          onInput: onChange.bind(null, i),
          onKeyDown: function(ev){ if (ev.key === 'Backspace' && !ev.target.value && i>0) {
            var prev = ev.target.parentElement.querySelectorAll('input')[i-1]; if (prev) prev.focus();
          }}
        });
      })
    );
  }

  function EmailView(props){
    return h('div', { id: 'view-email' }, [
      h('div', { class: 'title' }, 'Claim “' + props.credentialName + '”'),
      h('div', { class: 'subtitle' }, 'Enter your email to receive a one-time code to add this credential to your LearnCard.'),
      h('div', { class: 'field' }, [
        h('label', { class: 'label', htmlFor: 'email' }, 'Email'),
        h('input', { id: 'email', class: 'input', type: 'email', placeholder: 'you@example.com', autocomplete: 'email', value: props.email, onInput: function(e){ props.onEmail(e.target.value); } })
      ]),
      h('div', { class: 'center' }, [
        h('button', { id: 'send', class: 'btn btn-primary', onClick: props.onSend }, 'Send Code')
      ]),
      h('div', { class: 'error' }, props.error || '')
    ]);
  }

  function OtpView(props){
    return h('div', { id: 'view-otp' }, [
      h('div', { class: 'title' }, 'Enter 6‑digit code'),
      h('div', { class: 'subtitle' }, ['We sent a code to ', h('span', { id: 'email-disp' }, props.email), '. It expires in 10 minutes.']),
      h(OtpInputs, { value: props.code, onInput: function(v){ props.onCode(v); } }),
      h('div', { class: 'center', style: 'margin-top: 8px' }, [
        h('button', { id: 'verify', class: 'btn btn-primary', disabled: props.code.length !== 6, onClick: props.onVerify }, 'Verify')
      ]),
      h('div', { class: 'error' }, props.error || ''),
      h('div', { class: 'hint' }, "Didn't get it? Check spam or try again.")
    ]);
  }

  function SuccessView(props){
    return h('div', { id: 'view-success' }, [
      h('div', { class: 'success' }, [
        h('div', { class: 'title' }, 'Success!'),
        h('div', { class: 'subtitle' }, 'Your credential has been added to your LearnCard.'),
        props.showConsent ? h('label', { class: 'check', id: 'consent-wrap' }, [
          h('input', { id: 'consent', type: 'checkbox', checked: props.consent, onChange: function(e){ props.onConsent(e.target.checked); } }),
          h('span', null, 'Allow ' + props.partnerLabel + ' to automatically add future credentials to my LearnCard.')
        ]) : null,
        h('div', { class: 'center' }, [
          h('button', { id: 'viewWallet', class: 'btn btn-primary', onClick: props.onViewWallet }, 'View My LearnCard')
        ])
      ])
    ]);
  }

  function Root(props){
    var config = props.config;
    var App = function(_super){
      function App(){ _super.apply(this, arguments); this.state = { view: 'email', email: '', code: '', error: '', consent: false }; }
      App.prototype.onSend = function(){
        var email = this.state.email.trim();
        if (!validEmail(email)) { this.setState({ error: 'Please enter a valid email.' }); return; }
        this.setState({ error: '' });
        var self = this;
        setTimeout(function(){ self.setState({ view: 'otp' }); }, 300);
      };
      App.prototype.onVerify = function(){
        var code = this.state.code || '';
        if (code.length !== 6) { this.setState({ error: 'Enter the 6-digit code.' }); return; }
        var self = this;
        this.setState({ error: '' });
        setTimeout(function(){ self.setState({ view: 'success' }); }, 300);
      };
      App.prototype.onViewWallet = function(){
        var payload = { __lcEmbed: true, type: 'lc-embed:complete', nonce: config.nonce, payload: { credentialId: 'temp-' + Date.now(), consentGiven: !!this.state.consent } };
        window.parent.postMessage(payload, config.parentOrigin || '*');
      };
      App.prototype.render = function(){
        if (this.state.view === 'email') return h('div', { class: 'wrap' }, [h(EmailView, { credentialName: config.credentialName, email: this.state.email, error: this.state.error, onEmail: (v)=>this.setState({ email: v }), onSend: this.onSend.bind(this) })]);
        if (this.state.view === 'otp') return h('div', { class: 'wrap' }, [h(OtpView, { email: this.state.email, code: this.state.code, error: this.state.error, onCode: (v)=>this.setState({ code: v }), onVerify: this.onVerify.bind(this) })]);
        return h('div', { class: 'wrap' }, [h(SuccessView, { partnerLabel: config.partnerLabel, showConsent: !!config.showConsent, consent: this.state.consent, onConsent: (v)=>this.setState({ consent: v }), onViewWallet: this.onViewWallet.bind(this) })]);
      };
      return App;
    }(Component);

    return h(App, null);
  }

  var rootEl = document.getElementById('root');
  render(h(Root, { config: window.__LC_EMBED__ || {} }), rootEl);
})();
