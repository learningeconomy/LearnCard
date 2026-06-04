/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Notitle1Inputs */

const en_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No title`)
};

const es_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin título`)
};

const de_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kein Titel`)
};

const ar_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدون عنوان`)
};

const fr_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sans titre`)
};

const ko_wallet_notitle1 = /** @type {(inputs: Wallet_Notitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`제목 없음`)
};

/**
* | output |
* | --- |
* | "No title" |
*
* @param {Wallet_Notitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_notitle1 = /** @type {((inputs?: Wallet_Notitle1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Notitle1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_notitle1(inputs)
	if (locale === "es") return es_wallet_notitle1(inputs)
	if (locale === "de") return de_wallet_notitle1(inputs)
	if (locale === "ar") return ar_wallet_notitle1(inputs)
	if (locale === "fr") return fr_wallet_notitle1(inputs)
	return ko_wallet_notitle1(inputs)
});
export { wallet_notitle1 as "wallet.noTitle" }