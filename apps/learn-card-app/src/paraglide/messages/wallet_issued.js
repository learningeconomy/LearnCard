/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_IssuedInputs */

const en_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

const es_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitida`)
};

const de_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausgestellt`)
};

const ar_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدرت`)
};

const fr_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis`)
};

const ko_wallet_issued = /** @type {(inputs: Wallet_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급됨`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Wallet_IssuedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_issued = /** @type {((inputs?: Wallet_IssuedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_IssuedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issued(inputs)
	if (locale === "es") return es_wallet_issued(inputs)
	if (locale === "de") return de_wallet_issued(inputs)
	if (locale === "ar") return ar_wallet_issued(inputs)
	if (locale === "fr") return fr_wallet_issued(inputs)
	return ko_wallet_issued(inputs)
});
export { wallet_issued as "wallet.issued" }