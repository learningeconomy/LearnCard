/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Aipathways1Inputs */

const en_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Pathways`)
};

const es_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathways`)
};

const de_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Pfade`)
};

const ar_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسارات الذكاء الاصطناعي`)
};

const fr_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Pathways`)
};

const ko_wallet_categories_aipathways1 = /** @type {(inputs: Wallet_Categories_Aipathways1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI 경로`)
};

/**
* | output |
* | --- |
* | "AI Pathways" |
*
* @param {Wallet_Categories_Aipathways1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_aipathways1 = /** @type {((inputs?: Wallet_Categories_Aipathways1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Aipathways1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_aipathways1(inputs)
	if (locale === "es") return es_wallet_categories_aipathways1(inputs)
	if (locale === "de") return de_wallet_categories_aipathways1(inputs)
	if (locale === "ar") return ar_wallet_categories_aipathways1(inputs)
	if (locale === "fr") return fr_wallet_categories_aipathways1(inputs)
	return ko_wallet_categories_aipathways1(inputs)
});
export { wallet_categories_aipathways1 as "wallet.categories.aiPathways" }