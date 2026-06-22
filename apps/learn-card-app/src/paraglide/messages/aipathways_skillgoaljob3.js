/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Skillgoaljob3Inputs */

const en_aipathways_skillgoaljob3 = /** @type {(inputs: Aipathways_Skillgoaljob3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill, goal or job...`)
};

const es_aipathways_skillgoaljob3 = /** @type {(inputs: Aipathways_Skillgoaljob3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad, objetivo o trabajo...`)
};

const fr_aipathways_skillgoaljob3 = /** @type {(inputs: Aipathways_Skillgoaljob3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence, objectif ou métier...`)
};

const ar_aipathways_skillgoaljob3 = /** @type {(inputs: Aipathways_Skillgoaljob3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...مهارة أو هدف أو وظيفة`)
};

/**
* | output |
* | --- |
* | "Skill, goal or job..." |
*
* @param {Aipathways_Skillgoaljob3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_skillgoaljob3 = /** @type {((inputs?: Aipathways_Skillgoaljob3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Skillgoaljob3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_skillgoaljob3(inputs)
	if (locale === "es") return es_aipathways_skillgoaljob3(inputs)
	if (locale === "fr") return fr_aipathways_skillgoaljob3(inputs)
	return ar_aipathways_skillgoaljob3(inputs)
});
export { aipathways_skillgoaljob3 as "aiPathways.skillGoalJob" }