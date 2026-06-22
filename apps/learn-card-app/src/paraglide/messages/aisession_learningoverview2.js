/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Learningoverview2Inputs */

const en_aisession_learningoverview2 = /** @type {(inputs: Aisession_Learningoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning Overview`)
};

const es_aisession_learningoverview2 = /** @type {(inputs: Aisession_Learningoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen de aprendizaje`)
};

const fr_aisession_learningoverview2 = /** @type {(inputs: Aisession_Learningoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu des apprentissages`)
};

const ar_aisession_learningoverview2 = /** @type {(inputs: Aisession_Learningoverview2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظرة عامة على التعلّم`)
};

/**
* | output |
* | --- |
* | "Learning Overview" |
*
* @param {Aisession_Learningoverview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_learningoverview2 = /** @type {((inputs?: Aisession_Learningoverview2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Learningoverview2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_learningoverview2(inputs)
	if (locale === "es") return es_aisession_learningoverview2(inputs)
	if (locale === "fr") return fr_aisession_learningoverview2(inputs)
	return ar_aisession_learningoverview2(inputs)
});
export { aisession_learningoverview2 as "aiSession.learningOverview" }