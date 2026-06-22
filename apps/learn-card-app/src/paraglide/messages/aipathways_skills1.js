/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Skills1Inputs */

const en_aipathways_skills1 = /** @type {(inputs: Aipathways_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_aipathways_skills1 = /** @type {(inputs: Aipathways_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_aipathways_skills1 = /** @type {(inputs: Aipathways_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_aipathways_skills1 = /** @type {(inputs: Aipathways_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Aipathways_Skills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_skills1 = /** @type {((inputs?: Aipathways_Skills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Skills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_skills1(inputs)
	if (locale === "es") return es_aipathways_skills1(inputs)
	if (locale === "fr") return fr_aipathways_skills1(inputs)
	return ar_aipathways_skills1(inputs)
});
export { aipathways_skills1 as "aiPathways.skills" }