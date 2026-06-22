/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Jobtitlequestionpresent4Inputs */

const en_skillprofile_step2_jobtitlequestionpresent4 = /** @type {(inputs: Skillprofile_Step2_Jobtitlequestionpresent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What is your job title?`)
};

const es_skillprofile_step2_jobtitlequestionpresent4 = /** @type {(inputs: Skillprofile_Step2_Jobtitlequestionpresent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cuál es tu puesto?`)
};

const fr_skillprofile_step2_jobtitlequestionpresent4 = /** @type {(inputs: Skillprofile_Step2_Jobtitlequestionpresent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quel est votre intitulé de poste ?`)
};

const ar_skillprofile_step2_jobtitlequestionpresent4 = /** @type {(inputs: Skillprofile_Step2_Jobtitlequestionpresent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما هو مسماك الوظيفي؟`)
};

/**
* | output |
* | --- |
* | "What is your job title?" |
*
* @param {Skillprofile_Step2_Jobtitlequestionpresent4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_jobtitlequestionpresent4 = /** @type {((inputs?: Skillprofile_Step2_Jobtitlequestionpresent4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Jobtitlequestionpresent4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_jobtitlequestionpresent4(inputs)
	if (locale === "es") return es_skillprofile_step2_jobtitlequestionpresent4(inputs)
	if (locale === "fr") return fr_skillprofile_step2_jobtitlequestionpresent4(inputs)
	return ar_skillprofile_step2_jobtitlequestionpresent4(inputs)
});
export { skillprofile_step2_jobtitlequestionpresent4 as "skillProfile.step2.jobTitleQuestionPresent" }