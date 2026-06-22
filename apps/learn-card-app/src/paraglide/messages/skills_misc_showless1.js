/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Misc_Showless1Inputs */

const en_skills_misc_showless1 = /** @type {(inputs: Skills_Misc_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Less`)
};

const es_skills_misc_showless1 = /** @type {(inputs: Skills_Misc_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar menos`)
};

const fr_skills_misc_showless1 = /** @type {(inputs: Skills_Misc_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher moins`)
};

const ar_skills_misc_showless1 = /** @type {(inputs: Skills_Misc_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض أقل`)
};

/**
* | output |
* | --- |
* | "Show Less" |
*
* @param {Skills_Misc_Showless1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_misc_showless1 = /** @type {((inputs?: Skills_Misc_Showless1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Misc_Showless1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_misc_showless1(inputs)
	if (locale === "es") return es_skills_misc_showless1(inputs)
	if (locale === "fr") return fr_skills_misc_showless1(inputs)
	return ar_skills_misc_showless1(inputs)
});
export { skills_misc_showless1 as "skills.misc.showLess" }