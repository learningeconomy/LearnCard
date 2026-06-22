/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Loadingskills1Inputs */

const en_skills_loadingskills1 = /** @type {(inputs: Skills_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... skills`)
};

const es_skills_loadingskills1 = /** @type {(inputs: Skills_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... habilidades`)
};

const fr_skills_loadingskills1 = /** @type {(inputs: Skills_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... compétences`)
};

const ar_skills_loadingskills1 = /** @type {(inputs: Skills_Loadingskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... مهارة`)
};

/**
* | output |
* | --- |
* | "... skills" |
*
* @param {Skills_Loadingskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_loadingskills1 = /** @type {((inputs?: Skills_Loadingskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Loadingskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_loadingskills1(inputs)
	if (locale === "es") return es_skills_loadingskills1(inputs)
	if (locale === "fr") return fr_skills_loadingskills1(inputs)
	return ar_skills_loadingskills1(inputs)
});
export { skills_loadingskills1 as "skills.loadingSkills" }