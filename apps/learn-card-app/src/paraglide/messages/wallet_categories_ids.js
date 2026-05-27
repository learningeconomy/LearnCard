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
	return /** @type {LocalizedString} */ (`Identifikationen`)
};

const ar_wallet_categories_ids = /** @type {(inputs: Wallet_Categories_IdsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهويات`)
};

/**
* | output |
* | --- |
* | "IDs" |
*
* @param {Wallet_Categories_IdsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_ids = /** @type {((inputs?: Wallet_Categories_IdsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_IdsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_ids(inputs)
	if (locale === "es") return es_wallet_categories_ids(inputs)
	if (locale === "de") return de_wallet_categories_ids(inputs)
	return ar_wallet_categories_ids(inputs)
});
export { wallet_categories_ids as "wallet.categories.ids" }