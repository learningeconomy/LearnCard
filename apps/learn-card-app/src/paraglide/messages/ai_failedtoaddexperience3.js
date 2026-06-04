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

const de_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erfahrung konnte nicht hinzugefügt werden`)
};

const ar_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إضافة الخبرة`)
};

const fr_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible d'ajouter l'expérience`)
};

const ko_ai_failedtoaddexperience3 = /** @type {(inputs: Ai_Failedtoaddexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경험 추가 실패`)
};

/**
* | output |
* | --- |
* | "Failed to add experience" |
*
* @param {Ai_Failedtoaddexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_failedtoaddexperience3 = /** @type {((inputs?: Ai_Failedtoaddexperience3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Failedtoaddexperience3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_failedtoaddexperience3(inputs)
	if (locale === "es") return es_ai_failedtoaddexperience3(inputs)
	if (locale === "de") return de_ai_failedtoaddexperience3(inputs)
	if (locale === "ar") return ar_ai_failedtoaddexperience3(inputs)
	if (locale === "fr") return fr_ai_failedtoaddexperience3(inputs)
	return ko_ai_failedtoaddexperience3(inputs)
});
export { ai_failedtoaddexperience3 as "ai.failedToAddExperience" }