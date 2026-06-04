/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_StudiesInputs */

const en_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Studies`)
};

const es_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estudios`)
};

const de_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Studien`)
};

const ar_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدراسات`)
};

const fr_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Études`)
};

const ko_wallet_categories_studies = /** @type {(inputs: Wallet_Categories_StudiesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습`)
};

/**
* | output |
* | --- |
* | "Studies" |
*
* @param {Wallet_Categories_StudiesInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_studies = /** @type {((inputs?: Wallet_Categories_StudiesInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_StudiesInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_studies(inputs)
	if (locale === "es") return es_wallet_categories_studies(inputs)
	if (locale === "de") return de_wallet_categories_studies(inputs)
	if (locale === "ar") return ar_wallet_categories_studies(inputs)
	if (locale === "fr") return fr_wallet_categories_studies(inputs)
	return ko_wallet_categories_studies(inputs)
});
export { wallet_categories_studies as "wallet.categories.studies" }