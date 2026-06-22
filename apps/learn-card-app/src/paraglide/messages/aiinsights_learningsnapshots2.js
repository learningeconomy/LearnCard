/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Learningsnapshots2Inputs */

const en_aiinsights_learningsnapshots2 = /** @type {(inputs: Aiinsights_Learningsnapshots2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning Snapshots`)
};

const es_aiinsights_learningsnapshots2 = /** @type {(inputs: Aiinsights_Learningsnapshots2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instantáneas de aprendizaje`)
};

const fr_aiinsights_learningsnapshots2 = /** @type {(inputs: Aiinsights_Learningsnapshots2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instantanés d'apprentissage`)
};

const ar_aiinsights_learningsnapshots2 = /** @type {(inputs: Aiinsights_Learningsnapshots2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقطات التعلم`)
};

/**
* | output |
* | --- |
* | "Learning Snapshots" |
*
* @param {Aiinsights_Learningsnapshots2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_learningsnapshots2 = /** @type {((inputs?: Aiinsights_Learningsnapshots2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Learningsnapshots2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_learningsnapshots2(inputs)
	if (locale === "es") return es_aiinsights_learningsnapshots2(inputs)
	if (locale === "fr") return fr_aiinsights_learningsnapshots2(inputs)
	return ar_aiinsights_learningsnapshots2(inputs)
});
export { aiinsights_learningsnapshots2 as "aiInsights.learningSnapshots" }