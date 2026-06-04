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

const de_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungen suchen...`)
};

const ar_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث في الشهادات...`)
};

const fr_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des titres...`)
};

const ko_wallet_search = /** @type {(inputs: Wallet_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명 검색...`)
};

/**
* | output |
* | --- |
* | "Search credentials..." |
*
* @param {Wallet_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_search = /** @type {((inputs?: Wallet_SearchInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_SearchInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_search(inputs)
	if (locale === "es") return es_wallet_search(inputs)
	if (locale === "de") return de_wallet_search(inputs)
	if (locale === "ar") return ar_wallet_search(inputs)
	if (locale === "fr") return fr_wallet_search(inputs)
	return ko_wallet_search(inputs)
});
export { wallet_search as "wallet.search" }