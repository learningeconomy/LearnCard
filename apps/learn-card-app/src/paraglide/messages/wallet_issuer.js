/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_IssuerInputs */

const en_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer`)
};

const es_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor`)
};

const fr_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur`)
};

const ar_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المُصدر`)
};

/**
* | output |
* | --- |
* | "Issuer" |
*
* @param {Wallet_IssuerInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_issuer = /** @type {((inputs?: Wallet_IssuerInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_IssuerInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuer(inputs)
	if (locale === "es") return es_wallet_issuer(inputs)
	if (locale === "fr") return fr_wallet_issuer(inputs)
	return ar_wallet_issuer(inputs)
});
export { wallet_issuer as "wallet.issuer" }