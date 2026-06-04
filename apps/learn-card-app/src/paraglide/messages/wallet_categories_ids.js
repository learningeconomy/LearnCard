/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_IdsInputs */

const en_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IDs`)
};

const es_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificaciones`)
};

const de_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausweise`)
};

const ar_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهويات`)
};

const fr_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiants`)
};

const ko_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`신분증`)
};

/**
* | output |
* | --- |
* | "IDs" |
*
* @param {Wallet_Categories_IdsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_ids = /** @type {((inputs?: Wallet_Categories_IdsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_IdsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_ids(inputs)
	if (locale === "es") return es_wallet_categories_ids(inputs)
	if (locale === "de") return de_wallet_categories_ids(inputs)
	if (locale === "ar") return ar_wallet_categories_ids(inputs)
	if (locale === "fr") return fr_wallet_categories_ids(inputs)
	return ko_wallet_categories_ids(inputs)
});
export { wallet_categories_ids as "wallet.categories.ids" }