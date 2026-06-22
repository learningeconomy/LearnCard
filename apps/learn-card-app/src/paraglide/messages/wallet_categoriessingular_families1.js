/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Families1Inputs */

const en_wallet_categoriessingular_families1 = /** @type {(inputs: Wallet_Categoriessingular_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family`)
};

const es_wallet_categoriessingular_families1 = /** @type {(inputs: Wallet_Categoriessingular_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familia`)
};

const fr_wallet_categoriessingular_families1 = /** @type {(inputs: Wallet_Categoriessingular_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Famille`)
};

const ar_wallet_categoriessingular_families1 = /** @type {(inputs: Wallet_Categoriessingular_Families1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عائلة`)
};

/**
* | output |
* | --- |
* | "Family" |
*
* @param {Wallet_Categoriessingular_Families1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_families1 = /** @type {((inputs?: Wallet_Categoriessingular_Families1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Families1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_families1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_families1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_families1(inputs)
	return ar_wallet_categoriessingular_families1(inputs)
});
export { wallet_categoriessingular_families1 as "wallet.categoriesSingular.families" }