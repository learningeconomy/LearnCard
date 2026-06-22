/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Aipathways1Inputs */

const en_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways`)
};

const es_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways`)
};

const fr_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways`)
};

const ar_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسارات`)
};

/**
* | output |
* | --- |
* | "Pathways" |
*
* @param {Wallet_Categories_Aipathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_aipathways1 = /** @type {((inputs?: Wallet_Categories_Aipathways1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Aipathways1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_aipathways1(inputs)
	if (locale === "es") return es_wallet_categories_aipathways1(inputs)
	if (locale === "fr") return fr_wallet_categories_aipathways1(inputs)
	return ar_wallet_categories_aipathways1(inputs)
});
export { wallet_categories_aipathways1 as "wallet.categories.aiPathways" }