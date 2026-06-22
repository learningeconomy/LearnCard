/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ step: NonNullable<unknown> }} Aipathways_Stepcontent2Inputs */

const en_aipathways_stepcontent2 = /** @type {(inputs: Aipathways_Stepcontent2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Step ${i?.step} content...`)
};

const es_aipathways_stepcontent2 = /** @type {(inputs: Aipathways_Stepcontent2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Paso ${i?.step} contenido...`)
};

const fr_aipathways_stepcontent2 = /** @type {(inputs: Aipathways_Stepcontent2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contenu de l'étape ${i?.step}...`)
};

const ar_aipathways_stepcontent2 = /** @type {(inputs: Aipathways_Stepcontent2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`...محتوى الخطوة ${i?.step}`)
};

/**
* | output |
* | --- |
* | "Step {step} content..." |
*
* @param {Aipathways_Stepcontent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_stepcontent2 = /** @type {((inputs: Aipathways_Stepcontent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Stepcontent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_stepcontent2(inputs)
	if (locale === "es") return es_aipathways_stepcontent2(inputs)
	if (locale === "fr") return fr_aipathways_stepcontent2(inputs)
	return ar_aipathways_stepcontent2(inputs)
});
export { aipathways_stepcontent2 as "aiPathways.stepContent" }