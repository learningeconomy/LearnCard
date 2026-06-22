/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_ExpiredInputs */

const en_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expirada`)
};

const fr_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Wallet_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_expired = /** @type {((inputs?: Wallet_ExpiredInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_ExpiredInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_expired(inputs)
	if (locale === "es") return es_wallet_expired(inputs)
	if (locale === "fr") return fr_wallet_expired(inputs)
	return ar_wallet_expired(inputs)
});
export { wallet_expired as "wallet.expired" }