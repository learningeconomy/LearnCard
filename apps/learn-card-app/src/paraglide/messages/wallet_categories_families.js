/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_FamiliesInputs */

const en_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Families`)
};

const es_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familias`)
};

const fr_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familles`)
};

const ar_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلات`)
};

/**
* | output |
* | --- |
* | "Families" |
*
* @param {Wallet_Categories_FamiliesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_families = /** @type {((inputs?: Wallet_Categories_FamiliesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_FamiliesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_families(inputs)
	if (locale === "es") return es_wallet_categories_families(inputs)
	if (locale === "fr") return fr_wallet_categories_families(inputs)
	return ar_wallet_categories_families(inputs)
});
export { wallet_categories_families as "wallet.categories.families" }