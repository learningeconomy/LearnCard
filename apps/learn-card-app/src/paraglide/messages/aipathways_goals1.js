/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Goals1Inputs */

const en_aipathways_goals1 = /** @type {(inputs: Aipathways_Goals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Goals`)
};

const es_aipathways_goals1 = /** @type {(inputs: Aipathways_Goals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objetivos`)
};

const fr_aipathways_goals1 = /** @type {(inputs: Aipathways_Goals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectifs`)
};

const ar_aipathways_goals1 = /** @type {(inputs: Aipathways_Goals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأهداف`)
};

/**
* | output |
* | --- |
* | "Goals" |
*
* @param {Aipathways_Goals1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_goals1 = /** @type {((inputs?: Aipathways_Goals1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Goals1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_goals1(inputs)
	if (locale === "es") return es_aipathways_goals1(inputs)
	if (locale === "fr") return fr_aipathways_goals1(inputs)
	return ar_aipathways_goals1(inputs)
});
export { aipathways_goals1 as "aiPathways.goals" }