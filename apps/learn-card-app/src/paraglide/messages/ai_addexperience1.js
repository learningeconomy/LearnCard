/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Addexperience1Inputs */

const en_ai_addexperience1 = /** @type {(inputs: Ai_Addexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Experience`)
};

const es_ai_addexperience1 = /** @type {(inputs: Ai_Addexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar experiencia`)
};

const fr_ai_addexperience1 = /** @type {(inputs: Ai_Addexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une expérience`)
};

const ar_ai_addexperience1 = /** @type {(inputs: Ai_Addexperience1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة خبرة`)
};

/**
* | output |
* | --- |
* | "Add Experience" |
*
* @param {Ai_Addexperience1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_addexperience1 = /** @type {((inputs?: Ai_Addexperience1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Addexperience1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_addexperience1(inputs)
	if (locale === "es") return es_ai_addexperience1(inputs)
	if (locale === "fr") return fr_ai_addexperience1(inputs)
	return ar_ai_addexperience1(inputs)
});
export { ai_addexperience1 as "ai.addExperience" }