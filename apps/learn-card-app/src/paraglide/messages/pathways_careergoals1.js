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

const de_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Karriereziele`)
};

const ar_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأهداف المهنية`)
};

const fr_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectifs professionnels`)
};

const ko_pathways_careergoals1 = /** @type {(inputs: Pathways_Careergoals1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경력 목표`)
};

/**
* | output |
* | --- |
* | "Career Goals" |
*
* @param {Pathways_Careergoals1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_careergoals1 = /** @type {((inputs?: Pathways_Careergoals1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Careergoals1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_careergoals1(inputs)
	if (locale === "es") return es_pathways_careergoals1(inputs)
	if (locale === "de") return de_pathways_careergoals1(inputs)
	if (locale === "ar") return ar_pathways_careergoals1(inputs)
	if (locale === "fr") return fr_pathways_careergoals1(inputs)
	return ko_pathways_careergoals1(inputs)
});
export { pathways_careergoals1 as "pathways.careerGoals" }