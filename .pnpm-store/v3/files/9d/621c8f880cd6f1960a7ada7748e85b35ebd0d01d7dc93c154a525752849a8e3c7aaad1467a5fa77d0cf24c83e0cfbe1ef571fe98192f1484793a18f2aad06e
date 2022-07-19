import apgApi from 'apg-js/src/apg-api/api.js';
import apgLib from 'apg-js/src/apg-lib/node-exports.js';
import { AccountId, ChainId } from 'caip';
import { verifyMessage } from '@ethersproject/wallet';
import * as dagCbor from '@ipld/dag-cbor';
import * as Block from 'multiformats/block';
import { sha256 } from 'multiformats/hashes/sha2';

const GRAMMAR = `
sign-in-with-ethereum =
    domain %s" wants you to sign in with your Ethereum account:" LF
    address LF
    LF
    [ statement LF ]
    LF
    %s"URI: " URI LF
    %s"Version: " version LF
    %s"Nonce: " nonce LF
    %s"Issued At: " issued-at
    [ LF %s"Expiration Time: " expiration-time ]
    [ LF %s"Not Before: " not-before ]
    [ LF %s"Request ID: " request-id ]
    [ LF %s"Chain ID: " chain-id ]
    [ LF %s"Resources:"
    resources ]

domain = dnsauthority

address = "0x" 40*40HEXDIG
    ; Must also conform to captilization
    ; checksum encoding specified in EIP-55
    ; where applicable (EOAs).

statement = *( reserved / unreserved / " " )
    ; The purpose is to exclude LF (line breaks).

version = "1"

nonce = 8*( ALPHA / DIGIT )

issued-at = date-time
expiration-time = date-time
not-before = date-time

request-id = *pchar

chain-id = 1*DIGIT
    ; See EIP-155 for valid CHAIN_IDs.

resources = *( LF resource )

resource = "- " URI

; ------------------------------------------------------------------------------
; RFC 3986

URI           = scheme ":" hier-part [ "?" query ] [ "#" fragment ]

hier-part     = "//" authority path-abempty
              / path-absolute
              / path-rootless
              / path-empty

scheme        = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )

authority     = [ userinfo "@" ] host [ ":" port ]
userinfo      = *( unreserved / pct-encoded / sub-delims / ":" )
host          = IP-literal / IPv4address / reg-name
port          = *DIGIT

IP-literal    = "[" ( IPv6address / IPvFuture  ) "]"

IPvFuture     = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )

IPv6address   =                            6( h16 ":" ) ls32
              /                       "::" 5( h16 ":" ) ls32
              / [               h16 ] "::" 4( h16 ":" ) ls32
              / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
              / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
              / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
              / [ *4( h16 ":" ) h16 ] "::"              ls32
              / [ *5( h16 ":" ) h16 ] "::"              h16
              / [ *6( h16 ":" ) h16 ] "::"

h16           = 1*4HEXDIG
ls32          = ( h16 ":" h16 ) / IPv4address
IPv4address   = dec-octet "." dec-octet "." dec-octet "." dec-octet
dec-octet     = DIGIT                 ; 0-9
                 / %x31-39 DIGIT         ; 10-99
                 / "1" 2DIGIT            ; 100-199
                 / "2" %x30-34 DIGIT     ; 200-249
                 / "25" %x30-35          ; 250-255

reg-name      = *( unreserved / pct-encoded / sub-delims )

path-abempty  = *( "/" segment )
path-absolute = "/" [ segment-nz *( "/" segment ) ]
path-rootless = segment-nz *( "/" segment )
path-empty    = 0pchar

segment       = *pchar
segment-nz    = 1*pchar

pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"

query         = *( pchar / "/" / "?" )

fragment      = *( pchar / "/" / "?" )

pct-encoded   = "%" HEXDIG HEXDIG

unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
reserved      = gen-delims / sub-delims
gen-delims    = ":" / "/" / "?" / "#" / "[" / "]" / "@"
sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
              / "*" / "+" / "," / ";" / "="

; ------------------------------------------------------------------------------
; RFC 4501

dnsauthority    = host [ ":" port ]
                             ; See RFC 3986 for the
                             ; definition of "host" and "port".

; ------------------------------------------------------------------------------
; RFC 3339

date-fullyear   = 4DIGIT
date-month      = 2DIGIT  ; 01-12
date-mday       = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
                          ; month/year
time-hour       = 2DIGIT  ; 00-23
time-minute     = 2DIGIT  ; 00-59
time-second     = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second
                          ; rules
time-secfrac    = "." 1*DIGIT
time-numoffset  = ("+" / "-") time-hour ":" time-minute
time-offset     = "Z" / time-numoffset

partial-time    = time-hour ":" time-minute ":" time-second
                  [time-secfrac]
full-date       = date-fullyear "-" date-month "-" date-mday
full-time       = partial-time time-offset

date-time       = full-date "T" full-time

; ------------------------------------------------------------------------------
; RFC 5234

ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
LF             =  %x0A
                  ; linefeed
DIGIT          =  %x30-39
                  ; 0-9
HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
`;
class ParsedMessage {
  constructor(msg) {
    this.domain = void 0;
    this.address = void 0;
    this.statement = void 0;
    this.uri = void 0;
    this.version = void 0;
    this.nonce = void 0;
    this.issuedAt = void 0;
    this.expirationTime = void 0;
    this.notBefore = void 0;
    this.requestId = void 0;
    this.chainId = void 0;
    this.resources = void 0;
    const api = new apgApi(GRAMMAR);
    api.generate();

    if (api.errors.length) {
      console.error(api.errorsToAscii());
      console.error(api.linesToAscii());
      console.log(api.displayAttributeErrors());
      throw new Error(`ABNF grammar has errors`);
    }

    const grammarObj = api.toObject();
    const parser = new apgLib.parser();
    parser.ast = new apgLib.ast();
    const id = apgLib.ids;

    const domain = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.domain = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks.domain = domain;

    const address = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.address = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks.address = address;

    const statement = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.statement = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks.statement = statement;

    const uri = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        if (!data.uri) {
          data.uri = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
        }
      }

      return ret;
    };

    parser.ast.callbacks.uri = uri;

    const version = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.version = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks.version = version;

    const chainId = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.chainId = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks['chain-id'] = chainId;

    const nonce = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.nonce = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks.nonce = nonce;

    const issuedAt = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.issuedAt = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks['issued-at'] = issuedAt;

    const expirationTime = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.expirationTime = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks['expiration-time'] = expirationTime;

    const notBefore = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.notBefore = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks['not-before'] = notBefore;

    const requestId = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.requestId = apgLib.utils.charsToString(chars, phraseIndex, phraseLength);
      }

      return ret;
    };

    parser.ast.callbacks['request-id'] = requestId;

    const resources = function (state, chars, phraseIndex, phraseLength, data) {
      const ret = id.SEM_OK;

      if (state === id.SEM_PRE) {
        data.resources = apgLib.utils.charsToString(chars, phraseIndex, phraseLength).slice(3).split('\n- ');
      }

      return ret;
    };

    parser.ast.callbacks.resources = resources;
    const result = parser.parse(grammarObj, 'sign-in-with-ethereum', msg);

    if (!result.success) {
      throw new Error(`Invalid message: ${JSON.stringify(result)}`);
    }

    const elements = {};
    parser.ast.translate(elements);

    for (const [key, value] of Object.entries(elements)) {
      this[key] = value;
    }
  }

}

var ErrorTypes;

(function (ErrorTypes) {
  ErrorTypes["INVALID_SIGNATURE"] = "Invalid signature.";
  ErrorTypes["EXPIRED_MESSAGE"] = "Expired message.";
  ErrorTypes["MALFORMED_SESSION"] = "Malformed session.";
})(ErrorTypes || (ErrorTypes = {}));

var SignatureType;

(function (SignatureType) {
  SignatureType["PERSONAL_SIGNATURE"] = "Personal signature";
})(SignatureType || (SignatureType = {}));

class SiweMessage {
  constructor(param) {
    this.domain = void 0;
    this.address = void 0;
    this.statement = void 0;
    this.uri = void 0;
    this.version = void 0;
    this.nonce = void 0;
    this.issuedAt = void 0;
    this.expirationTime = void 0;
    this.notBefore = void 0;
    this.requestId = void 0;
    this.chainId = void 0;
    this.resources = void 0;
    this.signature = void 0;
    this.type = void 0;

    if (typeof param === 'string') {
      const parsedMessage = new ParsedMessage(param);
      this.domain = parsedMessage.domain;
      this.address = parsedMessage.address;
      this.statement = parsedMessage.statement;
      this.uri = parsedMessage.uri;
      this.version = parsedMessage.version;
      this.nonce = parsedMessage.nonce;
      this.issuedAt = parsedMessage.issuedAt;
      this.expirationTime = parsedMessage.expirationTime;
      this.notBefore = parsedMessage.notBefore;
      this.requestId = parsedMessage.requestId;
      this.chainId = parsedMessage.chainId;
      this.resources = parsedMessage.resources;
    } else {
      Object.assign(this, param);
    }
  }

  static fromCacao(cacao) {
    const account = AccountId.parse(cacao.p.iss.replace('did:pkh:', ''));
    const siwe = new SiweMessage({
      domain: cacao.p.domain,
      address: account.address,
      uri: cacao.p.aud,
      version: cacao.p.version,
      chainId: new ChainId(account.chainId).reference
    });
    if (cacao.p.statement) siwe.statement = cacao.p.statement;
    if (cacao.p.nonce) siwe.nonce = cacao.p.nonce;
    if (cacao.p.iat) siwe.issuedAt = cacao.p.iat;
    if (cacao.p.exp) siwe.expirationTime = cacao.p.exp;
    if (cacao.p.nbf) siwe.notBefore = cacao.p.nbf;
    if (cacao.p.requestId) siwe.requestId = cacao.p.requestId;
    if (cacao.p.resources) siwe.resources = cacao.p.resources;

    if (cacao.s) {
      if (cacao.s.s) siwe.signature = cacao.s.s;
      if (cacao.s.t === 'eip191') siwe.type = SignatureType.PERSONAL_SIGNATURE;
    }

    return siwe;
  }

  toMessage() {
    const header = `${this.domain} wants you to sign in with your Ethereum account:`;
    const uriField = `URI: ${this.uri}`;
    let prefix = [header, this.address].join('\n');
    const versionField = `Version: ${this.version}`;

    if (!this.nonce) {
      this.nonce = (Math.random() + 1).toString(36).substring(4);
    }

    const nonceField = `Nonce: ${this.nonce}`;
    const suffixArray = [uriField, versionField, nonceField];

    this.issuedAt = this.issuedAt ? this.issuedAt : new Date().toISOString();
    suffixArray.push(`Issued At: ${this.issuedAt}`);

    if (this.expirationTime) {
      const expiryField = `Expiration Time: ${this.expirationTime}`;
      suffixArray.push(expiryField);
    }

    if (this.notBefore) {
      suffixArray.push(`Not Before: ${this.notBefore}`);
    }

    if (this.requestId) {
      suffixArray.push(`Request ID: ${this.requestId}`);
    }

    if (this.chainId) {
      suffixArray.push(`Chain ID: ${this.chainId}`);
    }

    if (this.resources) {
      suffixArray.push([`Resources:`, ...this.resources.map(x => `- ${x}`)].join('\n'));
    }

    const suffix = suffixArray.join('\n');

    if (this.statement) {
      prefix = [prefix, this.statement].join('\n\n');
    }

    return [prefix, suffix].join('\n\n');
  }

  signMessage() {
    let message;

    switch (this.type) {
      case SignatureType.PERSONAL_SIGNATURE:
        {
          message = this.toMessage();
          break;
        }

      default:
        {
          message = this.toMessage();
          break;
        }
    }

    return message;
  }

}

const CLOCK_SKEW_DEFAULT_SEC = 5 * 60;
var Cacao;

(function (Cacao) {
  function fromSiweMessage(siweMessage) {
    const cacao = {
      h: {
        t: 'eip4361'
      },
      p: {
        domain: siweMessage.domain,
        iat: siweMessage.issuedAt,
        iss: `did:pkh:eip155:${siweMessage.chainId}:${siweMessage.address}`,
        aud: siweMessage.uri,
        version: siweMessage.version,
        nonce: siweMessage.nonce
      }
    };

    if (siweMessage.signature) {
      cacao.s = {
        t: 'eip191',
        s: siweMessage.signature
      };
    }

    if (siweMessage.notBefore) {
      cacao.p.nbf = siweMessage.notBefore;
    }

    if (siweMessage.expirationTime) {
      cacao.p.exp = siweMessage.expirationTime;
    }

    if (siweMessage.statement) {
      cacao.p.statement = siweMessage.statement;
    }

    if (siweMessage.requestId) {
      cacao.p.requestId = siweMessage.requestId;
    }

    if (siweMessage.resources) {
      cacao.p.resources = siweMessage.resources;
    }

    return cacao;
  }

  Cacao.fromSiweMessage = fromSiweMessage;

  function verify(cacao, options = {}) {
    var _cacao$s;

    if (cacao.h.t === 'eip4361' && ((_cacao$s = cacao.s) == null ? void 0 : _cacao$s.t) === 'eip191') {
      return verifyEIP191Signature(cacao, options);
    }

    throw new Error('Unsupported CACAO signature type');
  }

  Cacao.verify = verify;

  function verifyEIP191Signature(cacao, options) {
    if (!cacao.s) {
      throw new Error(`CACAO does not have a signature`);
    }

    const atTime = options.atTime ? options.atTime.getTime() : Date.now();
    const clockSkew = (options.clockSkewSecs ?? CLOCK_SKEW_DEFAULT_SEC) * 1000;

    if (Date.parse(cacao.p.iat) > atTime + clockSkew || Date.parse(cacao.p.nbf) > atTime + clockSkew) {
      throw new Error(`CACAO is not valid yet`);
    }

    const phaseOutMS = options.revocationPhaseOutSecs ? options.revocationPhaseOutSecs * 1000 : 0;

    if (Date.parse(cacao.p.exp) + phaseOutMS + clockSkew < atTime) {
      throw new Error(`CACAO has expired`);
    }

    const msg = SiweMessage.fromCacao(cacao);
    const sig = cacao.s.s;
    const recoveredAddress = verifyMessage(msg.toMessage(), sig);
    const issAddress = AccountId.parse(cacao.p.iss.replace('did:pkh:', '')).address;

    if (recoveredAddress.toLowerCase() !== issAddress.toLowerCase()) {
      throw new Error(`Signature does not belong to issuer`);
    }
  }

  Cacao.verifyEIP191Signature = verifyEIP191Signature;
})(Cacao || (Cacao = {}));

var CacaoBlock;

(function (CacaoBlock) {
  const fromCacao = function (cacao) {
    try {
      return Promise.resolve(Block.encode({
        value: cacao,
        codec: dagCbor,
        hasher: sha256
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  };

  CacaoBlock.fromCacao = fromCacao;
})(CacaoBlock || (CacaoBlock = {}));

export { Cacao, CacaoBlock, ErrorTypes, SignatureType, SiweMessage };
//# sourceMappingURL=index.mjs.map
