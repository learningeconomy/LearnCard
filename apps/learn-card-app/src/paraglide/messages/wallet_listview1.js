/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Listview1Inputs */

const en_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`List`)
};

const es_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista`)
};

const de_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste`)
};

const ar_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة`)
};

const fr_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste`)
};

const ko_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`목록`)
};

/**
* | output |
* | --- |
* | "List" |
*
* @param {Wallet_Listview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_listview1 = /** @type {((inputs?: Wallet_Listview1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Listview1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_listview1(inputs)
	if (locale === "es") return es_wallet_listview1(inputs)
	if (locale === "de") return de_wallet_listview1(inputs)
	if (locale === "ar") return ar_wallet_listview1(inputs)
	if (locale === "fr") return fr_wallet_listview1(inputs)
	return ko_wallet_listview1(inputs)
});
export { wallet_listview1 as "wallet.listView" }