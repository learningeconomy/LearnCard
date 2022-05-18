import { Crypto } from '@peculiar/webcrypto';

function isNodejs() {
  return (
    typeof process === 'object' &&
    typeof process.versions === 'object' &&
    typeof process.versions.node !== 'undefined'
  );
}

let crypto: Crypto;

if (isNodejs()) {
  crypto = new Crypto();
} else {
  crypto = window.crypto;
}

export default crypto;
