/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Sharecredential1Inputs */

const en_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const de_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teilen`)
};

const ar_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

const fr_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ko_wallet_sharecredential1 = /** @type {(inputs: Wallet_Sharecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Wallet_Sharecredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_sharecredential1 = /** @type {((inputs?: Wallet_Sharecredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Sharecredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_sharecredential1(inputs)
	if (locale === "es") return es_wallet_sharecredential1(inputs)
	if (locale === "de") return de_wallet_sharecredential1(inputs)
	if (locale === "ar") return ar_wallet_sharecredential1(inputs)
	if (locale === "fr") return fr_wallet_sharecredential1(inputs)
	return ko_wallet_sharecredential1(inputs)
});
export { wallet_sharecredential1 as "wallet.shareCredential" }