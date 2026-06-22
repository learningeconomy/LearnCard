/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Experiences1Inputs */

const en_wallet_categoriessingular_experiences1 = /** @type {(inputs: Wallet_Categoriessingular_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experience`)
};

const es_wallet_categoriessingular_experiences1 = /** @type {(inputs: Wallet_Categoriessingular_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia`)
};

const fr_wallet_categoriessingular_experiences1 = /** @type {(inputs: Wallet_Categoriessingular_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience`)
};

const ar_wallet_categoriessingular_experiences1 = /** @type {(inputs: Wallet_Categoriessingular_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة`)
};

/**
* | output |
* | --- |
* | "Experience" |
*
* @param {Wallet_Categoriessingular_Experiences1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_experiences1 = /** @type {((inputs?: Wallet_Categoriessingular_Experiences1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Experiences1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_experiences1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_experiences1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_experiences1(inputs)
	return ar_wallet_categoriessingular_experiences1(inputs)
});
export { wallet_categoriessingular_experiences1 as "wallet.categoriesSingular.experiences" }