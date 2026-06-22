/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Skillgoaljobalt4Inputs */

const en_aipathways_skillgoaljobalt4 = /** @type {(inputs: Aipathways_Skillgoaljobalt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill, goal, or job...`)
};

const es_aipathways_skillgoaljobalt4 = /** @type {(inputs: Aipathways_Skillgoaljobalt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad, objetivo o trabajo...`)
};

const fr_aipathways_skillgoaljobalt4 = /** @type {(inputs: Aipathways_Skillgoaljobalt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence, objectif ou métier...`)
};

const ar_aipathways_skillgoaljobalt4 = /** @type {(inputs: Aipathways_Skillgoaljobalt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...مهارة أو هدف أو وظيفة`)
};

/**
* | output |
* | --- |
* | "Skill, goal, or job..." |
*
* @param {Aipathways_Skillgoaljobalt4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_skillgoaljobalt4 = /** @type {((inputs?: Aipathways_Skillgoaljobalt4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Skillgoaljobalt4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_skillgoaljobalt4(inputs)
	if (locale === "es") return es_aipathways_skillgoaljobalt4(inputs)
	if (locale === "fr") return fr_aipathways_skillgoaljobalt4(inputs)
	return ar_aipathways_skillgoaljobalt4(inputs)
});
export { aipathways_skillgoaljobalt4 as "aiPathways.skillGoalJobAlt" }