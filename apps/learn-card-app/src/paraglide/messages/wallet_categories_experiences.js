/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_ExperiencesInputs */

const en_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiences`)
};

const es_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencias`)
};

const fr_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expériences`)
};

const ar_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرات`)
};

/**
* | output |
* | --- |
* | "Experiences" |
*
* @param {Wallet_Categories_ExperiencesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_experiences = /** @type {((inputs?: Wallet_Categories_ExperiencesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_ExperiencesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_experiences(inputs)
	if (locale === "es") return es_wallet_categories_experiences(inputs)
	if (locale === "fr") return fr_wallet_categories_experiences(inputs)
	return ar_wallet_categories_experiences(inputs)
});
export { wallet_categories_experiences as "wallet.categories.experiences" }