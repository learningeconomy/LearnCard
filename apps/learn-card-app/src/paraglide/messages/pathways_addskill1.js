/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Addskill1Inputs */

const en_pathways_addskill1 = /** @type {(inputs: Pathways_Addskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Skill`)
};

const es_pathways_addskill1 = /** @type {(inputs: Pathways_Addskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar habilidad`)
};

const fr_pathways_addskill1 = /** @type {(inputs: Pathways_Addskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une compétence`)
};

const ar_pathways_addskill1 = /** @type {(inputs: Pathways_Addskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مهارة`)
};

/**
* | output |
* | --- |
* | "Add Skill" |
*
* @param {Pathways_Addskill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_addskill1 = /** @type {((inputs?: Pathways_Addskill1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Addskill1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_addskill1(inputs)
	if (locale === "es") return es_pathways_addskill1(inputs)
	if (locale === "fr") return fr_pathways_addskill1(inputs)
	return ar_pathways_addskill1(inputs)
});
export { pathways_addskill1 as "pathways.addSkill" }