/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_FilterInputs */

const en_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filter`)
};

const es_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrar`)
};

const de_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtern`)
};

const ar_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفية`)
};

const fr_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer`)
};

const ko_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`필터`)
};

/**
* | output |
* | --- |
* | "Filter" |
*
* @param {Wallet_FilterInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_filter = /** @type {((inputs?: Wallet_FilterInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_FilterInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_filter(inputs)
	if (locale === "es") return es_wallet_filter(inputs)
	if (locale === "de") return de_wallet_filter(inputs)
	if (locale === "ar") return ar_wallet_filter(inputs)
	if (locale === "fr") return fr_wallet_filter(inputs)
	return ko_wallet_filter(inputs)
});
export { wallet_filter as "wallet.filter" }