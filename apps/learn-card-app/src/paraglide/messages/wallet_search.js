/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_SearchInputs */

const en_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search credentials...`)
};

const es_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar credenciales...`)
};

const fr_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des titres...`)
};

const ar_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث في الشهادات...`)
};

/**
* | output |
* | --- |
* | "Search credentials..." |
*
* @param {Wallet_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_search = /** @type {((inputs?: Wallet_SearchInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_SearchInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_search(inputs)
	if (locale === "es") return es_wallet_search(inputs)
	if (locale === "fr") return fr_wallet_search(inputs)
	return ar_wallet_search(inputs)
});
export { wallet_search as "wallet.search" }