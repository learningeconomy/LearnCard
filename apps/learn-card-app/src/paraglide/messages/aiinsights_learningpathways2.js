/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Learningpathways2Inputs */

const en_aiinsights_learningpathways2 = /** @type {(inputs: Aiinsights_Learningpathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning Pathways`)
};

const es_aiinsights_learningpathways2 = /** @type {(inputs: Aiinsights_Learningpathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rutas de aprendizaje`)
};

const fr_aiinsights_learningpathways2 = /** @type {(inputs: Aiinsights_Learningpathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcours d'apprentissage`)
};

const ar_aiinsights_learningpathways2 = /** @type {(inputs: Aiinsights_Learningpathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسارات التعلم`)
};

/**
* | output |
* | --- |
* | "Learning Pathways" |
*
* @param {Aiinsights_Learningpathways2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_learningpathways2 = /** @type {((inputs?: Aiinsights_Learningpathways2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Learningpathways2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_learningpathways2(inputs)
	if (locale === "es") return es_aiinsights_learningpathways2(inputs)
	if (locale === "fr") return fr_aiinsights_learningpathways2(inputs)
	return ar_aiinsights_learningpathways2(inputs)
});
export { aiinsights_learningpathways2 as "aiInsights.learningPathways" }