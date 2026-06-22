/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_CertificateInputs */

const en_wallet_certificate = /** @type {(inputs: Wallet_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificate`)
};

const es_wallet_certificate = /** @type {(inputs: Wallet_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificado`)
};

const fr_wallet_certificate = /** @type {(inputs: Wallet_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat`)
};

const ar_wallet_certificate = /** @type {(inputs: Wallet_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شهادة`)
};

/**
* | output |
* | --- |
* | "Certificate" |
*
* @param {Wallet_CertificateInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_certificate = /** @type {((inputs?: Wallet_CertificateInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_CertificateInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_certificate(inputs)
	if (locale === "es") return es_wallet_certificate(inputs)
	if (locale === "fr") return fr_wallet_certificate(inputs)
	return ar_wallet_certificate(inputs)
});
export { wallet_certificate as "wallet.certificate" }