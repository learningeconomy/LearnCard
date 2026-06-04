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

const de_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familien`)
};

const ar_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلات`)
};

const fr_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familles`)
};

const ko_wallet_categories_families = /** @type {(inputs: Wallet_Categories_FamiliesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가족`)
};

/**
* | output |
* | --- |
* | "Families" |
*
* @param {Wallet_Categories_FamiliesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_families = /** @type {((inputs?: Wallet_Categories_FamiliesInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_FamiliesInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_families(inputs)
	if (locale === "es") return es_wallet_categories_families(inputs)
	if (locale === "de") return de_wallet_categories_families(inputs)
	if (locale === "ar") return ar_wallet_categories_families(inputs)
	if (locale === "fr") return fr_wallet_categories_families(inputs)
	return ko_wallet_categories_families(inputs)
});
export { wallet_categories_families as "wallet.categories.families" }