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

const de_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aussteller`)
};

const ar_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المُصدر`)
};

const fr_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur`)
};

const ko_wallet_issuer = /** @type {(inputs: Wallet_IssuerInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급자`)
};

/**
* | output |
* | --- |
* | "Issuer" |
*
* @param {Wallet_IssuerInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_issuer = /** @type {((inputs?: Wallet_IssuerInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_IssuerInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuer(inputs)
	if (locale === "es") return es_wallet_issuer(inputs)
	if (locale === "de") return de_wallet_issuer(inputs)
	if (locale === "ar") return ar_wallet_issuer(inputs)
	if (locale === "fr") return fr_wallet_issuer(inputs)
	return ko_wallet_issuer(inputs)
});
export { wallet_issuer as "wallet.issuer" }