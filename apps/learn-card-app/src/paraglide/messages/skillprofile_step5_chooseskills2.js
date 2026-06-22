/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step5_Chooseskills2Inputs */

const en_skillprofile_step5_chooseskills2 = /** @type {(inputs: Skillprofile_Step5_Chooseskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose your current skills`)
};

const es_skillprofile_step5_chooseskills2 = /** @type {(inputs: Skillprofile_Step5_Chooseskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige tus habilidades actuales`)
};

const fr_skillprofile_step5_chooseskills2 = /** @type {(inputs: Skillprofile_Step5_Chooseskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez vos compétences actuelles`)
};

const ar_skillprofile_step5_chooseskills2 = /** @type {(inputs: Skillprofile_Step5_Chooseskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مهاراتك الحالية`)
};

/**
* | output |
* | --- |
* | "Choose your current skills" |
*
* @param {Skillprofile_Step5_Chooseskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step5_chooseskills2 = /** @type {((inputs?: Skillprofile_Step5_Chooseskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step5_Chooseskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step5_chooseskills2(inputs)
	if (locale === "es") return es_skillprofile_step5_chooseskills2(inputs)
	if (locale === "fr") return fr_skillprofile_step5_chooseskills2(inputs)
	return ar_skillprofile_step5_chooseskills2(inputs)
});
export { skillprofile_step5_chooseskills2 as "skillProfile.step5.chooseSkills" }