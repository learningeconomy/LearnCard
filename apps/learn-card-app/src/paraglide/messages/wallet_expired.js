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

const de_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abgelaufen`)
};

const ar_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهية الصلاحية`)
};

const fr_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ko_wallet_expired = /** @type {(inputs: Wallet_ExpiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료됨`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Wallet_ExpiredInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_expired = /** @type {((inputs?: Wallet_ExpiredInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_ExpiredInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_expired(inputs)
	if (locale === "es") return es_wallet_expired(inputs)
	if (locale === "de") return de_wallet_expired(inputs)
	if (locale === "ar") return ar_wallet_expired(inputs)
	if (locale === "fr") return fr_wallet_expired(inputs)
	return ko_wallet_expired(inputs)
});
export { wallet_expired as "wallet.expired" }