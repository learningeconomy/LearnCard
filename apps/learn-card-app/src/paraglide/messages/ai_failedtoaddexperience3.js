/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Failedtoaddexperience3Inputs */

const en_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to add experience`)
};

const es_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al agregar experiencia`)
};

const fr_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ajouter l'expérience`)
};

const ar_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إضافة الخبرة`)
};

/**
* | output |
* | --- |
* | "Failed to add experience" |
*
* @param {Ai_Failedtoaddexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_failedtoaddexperience3 = /** @type {((inputs?: Ai_Failedtoaddexperience3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Failedtoaddexperience3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_failedtoaddexperience3(inputs)
	if (locale === "es") return es_ai_failedtoaddexperience3(inputs)
	if (locale === "fr") return fr_ai_failedtoaddexperience3(inputs)
	return ar_ai_failedtoaddexperience3(inputs)
});
export { ai_failedtoaddexperience3 as "ai.failedToAddExperience" }