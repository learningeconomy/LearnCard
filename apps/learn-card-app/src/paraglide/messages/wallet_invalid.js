/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_InvalidInputs */

const en_wallet_invalid = /** @type {(inputs: Wallet_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid ID`)
};

const es_wallet_invalid = /** @type {(inputs: Wallet_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificación inválida`)
};

const fr_wallet_invalid = /** @type {(inputs: Wallet_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant invalide`)
};

const ar_wallet_invalid = /** @type {(inputs: Wallet_InvalidInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هوية غير صالحة`)
};

/**
* | output |
* | --- |
* | "Invalid ID" |
*
* @param {Wallet_InvalidInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_invalid = /** @type {((inputs?: Wallet_InvalidInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_InvalidInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_invalid(inputs)
	if (locale === "es") return es_wallet_invalid(inputs)
	if (locale === "fr") return fr_wallet_invalid(inputs)
	return ar_wallet_invalid(inputs)
});
export { wallet_invalid as "wallet.invalid" }