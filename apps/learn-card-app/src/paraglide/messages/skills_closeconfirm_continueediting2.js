/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Closeconfirm_Continueediting2Inputs */

const en_skills_closeconfirm_continueediting2 = /** @type {(inputs: Skills_Closeconfirm_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Editing`)
};

const es_skills_closeconfirm_continueediting2 = /** @type {(inputs: Skills_Closeconfirm_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir editando`)
};

const fr_skills_closeconfirm_continueediting2 = /** @type {(inputs: Skills_Closeconfirm_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la modification`)
};

const ar_skills_closeconfirm_continueediting2 = /** @type {(inputs: Skills_Closeconfirm_Continueediting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة التحرير`)
};

/**
* | output |
* | --- |
* | "Continue Editing" |
*
* @param {Skills_Closeconfirm_Continueediting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_closeconfirm_continueediting2 = /** @type {((inputs?: Skills_Closeconfirm_Continueediting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Closeconfirm_Continueediting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_closeconfirm_continueediting2(inputs)
	if (locale === "es") return es_skills_closeconfirm_continueediting2(inputs)
	if (locale === "fr") return fr_skills_closeconfirm_continueediting2(inputs)
	return ar_skills_closeconfirm_continueediting2(inputs)
});
export { skills_closeconfirm_continueediting2 as "skills.closeConfirm.continueEditing" }