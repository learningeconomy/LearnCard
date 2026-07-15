/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_TitleInputs */

const en_wallet_title = /** @type {(inputs: Wallet_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet`)
};

const es_wallet_title = /** @type {(inputs: Wallet_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet`)
};

const fr_wallet_title = /** @type {(inputs: Wallet_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portefeuille`)
};

const ar_wallet_title = /** @type {(inputs: Wallet_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet`)
};

/**
* | output |
* | --- |
* | "Wallet" |
*
* @param {Wallet_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_title = /** @type {((inputs?: Wallet_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_title(inputs)
	if (locale === "es") return es_wallet_title(inputs)
	if (locale === "fr") return fr_wallet_title(inputs)
	return ar_wallet_title(inputs)
});
export { wallet_title as "wallet.title" }