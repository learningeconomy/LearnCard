/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Aipathways2Inputs */

const en_wallet_categoriessingular_aipathways2 = /** @type {(inputs: Wallet_Categoriessingular_Aipathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Pathway`)
};

const es_wallet_categoriessingular_aipathways2 = /** @type {(inputs: Wallet_Categoriessingular_Aipathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathway`)
};

const fr_wallet_categoriessingular_aipathways2 = /** @type {(inputs: Wallet_Categoriessingular_Aipathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathway`)
};

const ar_wallet_categoriessingular_aipathways2 = /** @type {(inputs: Wallet_Categoriessingular_Aipathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسار ذكاء اصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Pathway" |
*
* @param {Wallet_Categoriessingular_Aipathways2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_aipathways2 = /** @type {((inputs?: Wallet_Categoriessingular_Aipathways2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Aipathways2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_aipathways2(inputs)
	if (locale === "es") return es_wallet_categoriessingular_aipathways2(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_aipathways2(inputs)
	return ar_wallet_categoriessingular_aipathways2(inputs)
});
export { wallet_categoriessingular_aipathways2 as "wallet.categoriesSingular.aiPathways" }