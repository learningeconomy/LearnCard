/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Viewmode1Inputs */

const en_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View`)
};

const es_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista`)
};

const de_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ansicht`)
};

const ar_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العرض`)
};

const fr_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vue`)
};

const ko_wallet_viewmode1 = /** @type {(inputs: Wallet_Viewmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보기`)
};

/**
* | output |
* | --- |
* | "View" |
*
* @param {Wallet_Viewmode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_viewmode1 = /** @type {((inputs?: Wallet_Viewmode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Viewmode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_viewmode1(inputs)
	if (locale === "es") return es_wallet_viewmode1(inputs)
	if (locale === "de") return de_wallet_viewmode1(inputs)
	if (locale === "ar") return ar_wallet_viewmode1(inputs)
	if (locale === "fr") return fr_wallet_viewmode1(inputs)
	return ko_wallet_viewmode1(inputs)
});
export { wallet_viewmode1 as "wallet.viewMode" }