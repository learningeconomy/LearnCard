/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Joblocation2Inputs */

const en_skillprofile_step2_joblocation2 = /** @type {(inputs: Skillprofile_Step2_Joblocation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Location`)
};

const es_skillprofile_step2_joblocation2 = /** @type {(inputs: Skillprofile_Step2_Joblocation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ubicación del empleo`)
};

const fr_skillprofile_step2_joblocation2 = /** @type {(inputs: Skillprofile_Step2_Joblocation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lieu de travail`)
};

const ar_skillprofile_step2_joblocation2 = /** @type {(inputs: Skillprofile_Step2_Joblocation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موقع العمل`)
};

/**
* | output |
* | --- |
* | "Job Location" |
*
* @param {Skillprofile_Step2_Joblocation2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_joblocation2 = /** @type {((inputs?: Skillprofile_Step2_Joblocation2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Joblocation2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_joblocation2(inputs)
	if (locale === "es") return es_skillprofile_step2_joblocation2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_joblocation2(inputs)
	return ar_skillprofile_step2_joblocation2(inputs)
});
export { skillprofile_step2_joblocation2 as "skillProfile.step2.jobLocation" }