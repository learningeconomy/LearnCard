/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Dark2Inputs */

const en_learncardid_dark2 = /** @type {(inputs: Learncardid_Dark2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark`)
};

const es_learncardid_dark2 = /** @type {(inputs: Learncardid_Dark2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oscuro`)
};

const fr_learncardid_dark2 = /** @type {(inputs: Learncardid_Dark2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sombre`)
};

const ar_learncardid_dark2 = /** @type {(inputs: Learncardid_Dark2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`داكن`)
};

/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Learncardid_Dark2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_dark2 = /** @type {((inputs?: Learncardid_Dark2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Dark2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_dark2(inputs)
	if (locale === "es") return es_learncardid_dark2(inputs)
	if (locale === "fr") return fr_learncardid_dark2(inputs)
	return ar_learncardid_dark2(inputs)
});
export { learncardid_dark2 as "learnCardId.dark" }