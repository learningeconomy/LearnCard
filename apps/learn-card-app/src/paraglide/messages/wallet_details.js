/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_DetailsInputs */

const en_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const de_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const ar_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

const fr_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ko_wallet_details = /** @type {(inputs: Wallet_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`상세`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Wallet_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_details = /** @type {((inputs?: Wallet_DetailsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_DetailsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_details(inputs)
	if (locale === "es") return es_wallet_details(inputs)
	if (locale === "de") return de_wallet_details(inputs)
	if (locale === "ar") return ar_wallet_details(inputs)
	if (locale === "fr") return fr_wallet_details(inputs)
	return ko_wallet_details(inputs)
});
export { wallet_details as "wallet.details" }