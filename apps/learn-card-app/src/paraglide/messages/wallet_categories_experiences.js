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

const de_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erfahrungen`)
};

const ar_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرات`)
};

const fr_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expériences`)
};

const ko_wallet_categories_experiences = /** @type {(inputs: Wallet_Categories_ExperiencesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경험`)
};

/**
* | output |
* | --- |
* | "Experiences" |
*
* @param {Wallet_Categories_ExperiencesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_experiences = /** @type {((inputs?: Wallet_Categories_ExperiencesInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_ExperiencesInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_experiences(inputs)
	if (locale === "es") return es_wallet_categories_experiences(inputs)
	if (locale === "de") return de_wallet_categories_experiences(inputs)
	if (locale === "ar") return ar_wallet_categories_experiences(inputs)
	if (locale === "fr") return fr_wallet_categories_experiences(inputs)
	return ko_wallet_categories_experiences(inputs)
});
export { wallet_categories_experiences as "wallet.categories.experiences" }