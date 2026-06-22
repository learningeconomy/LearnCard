/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Newworkexperience3Inputs */

const en_skillprofile_step2_newworkexperience3 = /** @type {(inputs: Skillprofile_Step2_Newworkexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Work Experience`)
};

const es_skillprofile_step2_newworkexperience3 = /** @type {(inputs: Skillprofile_Step2_Newworkexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva experiencia laboral`)
};

const fr_skillprofile_step2_newworkexperience3 = /** @type {(inputs: Skillprofile_Step2_Newworkexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle expérience professionnelle`)
};

const ar_skillprofile_step2_newworkexperience3 = /** @type {(inputs: Skillprofile_Step2_Newworkexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة عمل جديدة`)
};

/**
* | output |
* | --- |
* | "New Work Experience" |
*
* @param {Skillprofile_Step2_Newworkexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_newworkexperience3 = /** @type {((inputs?: Skillprofile_Step2_Newworkexperience3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Newworkexperience3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_newworkexperience3(inputs)
	if (locale === "es") return es_skillprofile_step2_newworkexperience3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_newworkexperience3(inputs)
	return ar_skillprofile_step2_newworkexperience3(inputs)
});
export { skillprofile_step2_newworkexperience3 as "skillProfile.step2.newWorkExperience" }