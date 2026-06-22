/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Misc_Hideoptions1Inputs */

const en_skills_misc_hideoptions1 = /** @type {(inputs: Skills_Misc_Hideoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide options`)
};

const es_skills_misc_hideoptions1 = /** @type {(inputs: Skills_Misc_Hideoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar opciones`)
};

const fr_skills_misc_hideoptions1 = /** @type {(inputs: Skills_Misc_Hideoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer les options`)
};

const ar_skills_misc_hideoptions1 = /** @type {(inputs: Skills_Misc_Hideoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء الخيارات`)
};

/**
* | output |
* | --- |
* | "Hide options" |
*
* @param {Skills_Misc_Hideoptions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_misc_hideoptions1 = /** @type {((inputs?: Skills_Misc_Hideoptions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Misc_Hideoptions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_misc_hideoptions1(inputs)
	if (locale === "es") return es_skills_misc_hideoptions1(inputs)
	if (locale === "fr") return fr_skills_misc_hideoptions1(inputs)
	return ar_skills_misc_hideoptions1(inputs)
});
export { skills_misc_hideoptions1 as "skills.misc.hideOptions" }