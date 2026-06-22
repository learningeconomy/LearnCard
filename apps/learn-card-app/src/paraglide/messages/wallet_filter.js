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

const fr_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer`)
};

const ar_wallet_filter = /** @type {(inputs: Wallet_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفية`)
};

/**
* | output |
* | --- |
* | "Filter" |
*
* @param {Wallet_FilterInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_filter = /** @type {((inputs?: Wallet_FilterInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_FilterInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_filter(inputs)
	if (locale === "es") return es_wallet_filter(inputs)
	if (locale === "fr") return fr_wallet_filter(inputs)
	return ar_wallet_filter(inputs)
});
export { wallet_filter as "wallet.filter" }