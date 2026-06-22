/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Skill1Inputs */

const en_aipathways_skill1 = /** @type {(inputs: Aipathways_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill`)
};

const es_aipathways_skill1 = /** @type {(inputs: Aipathways_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad`)
};

const fr_aipathways_skill1 = /** @type {(inputs: Aipathways_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence`)
};

const ar_aipathways_skill1 = /** @type {(inputs: Aipathways_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة`)
};

/**
* | output |
* | --- |
* | "Skill" |
*
* @param {Aipathways_Skill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_skill1 = /** @type {((inputs?: Aipathways_Skill1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Skill1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_skill1(inputs)
	if (locale === "es") return es_aipathways_skill1(inputs)
	if (locale === "fr") return fr_aipathways_skill1(inputs)
	return ar_aipathways_skill1(inputs)
});
export { aipathways_skill1 as "aiPathways.skill" }