/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Careergoals1Inputs */

const en_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Career Goals`)
};

const es_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Metas profesionales`)
};

const fr_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectifs professionnels`)
};

const ar_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأهداف المهنية`)
};

/**
* | output |
* | --- |
* | "Career Goals" |
*
* @param {Pathways_Careergoals1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_careergoals1 = /** @type {((inputs?: Pathways_Careergoals1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Careergoals1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_careergoals1(inputs)
	if (locale === "es") return es_pathways_careergoals1(inputs)
	if (locale === "fr") return fr_pathways_careergoals1(inputs)
	return ar_pathways_careergoals1(inputs)
});
export { pathways_careergoals1 as "pathways.careerGoals" }