/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_TaglineInputs */

const en_common_tagline = /** @type {(inputs: Common_TaglineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Universal Learning & Work Portfolio`)
};

const es_common_tagline = /** @type {(inputs: Common_TaglineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portafolio universal de aprendizaje y trabajo`)
};

const fr_common_tagline = /** @type {(inputs: Common_TaglineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio universel d'apprentissage et de travail`)
};

const ar_common_tagline = /** @type {(inputs: Common_TaglineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`محفظة التعلّم والعمل الشاملة`)
};

/**
* | output |
* | --- |
* | "Universal Learning & Work Portfolio" |
*
* @param {Common_TaglineInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_tagline = /** @type {((inputs?: Common_TaglineInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_TaglineInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_tagline(inputs)
	if (locale === "es") return es_common_tagline(inputs)
	if (locale === "fr") return fr_common_tagline(inputs)
	return ar_common_tagline(inputs)
});
export { common_tagline as "common.tagline" }