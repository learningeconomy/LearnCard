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

const fr_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste`)
};

const ar_wallet_listview1 = /** @type {(inputs: Wallet_Listview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة`)
};

/**
* | output |
* | --- |
* | "List" |
*
* @param {Wallet_Listview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_listview1 = /** @type {((inputs?: Wallet_Listview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Listview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_listview1(inputs)
	if (locale === "es") return es_wallet_listview1(inputs)
	if (locale === "fr") return fr_wallet_listview1(inputs)
	return ar_wallet_listview1(inputs)
});
export { wallet_listview1 as "wallet.listView" }