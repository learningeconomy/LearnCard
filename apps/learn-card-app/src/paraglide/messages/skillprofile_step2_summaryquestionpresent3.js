/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Summaryquestionpresent3Inputs */

const en_skillprofile_step2_summaryquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What do you do?`)
};

const es_skillprofile_step2_summaryquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué haces?`)
};

const fr_skillprofile_step2_summaryquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que faites-vous ?`)
};

const ar_skillprofile_step2_summaryquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا تفعل؟`)
};

/**
* | output |
* | --- |
* | "What do you do?" |
*
* @param {Skillprofile_Step2_Summaryquestionpresent3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_summaryquestionpresent3 = /** @type {((inputs?: Skillprofile_Step2_Summaryquestionpresent3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Summaryquestionpresent3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_summaryquestionpresent3(inputs)
	if (locale === "es") return es_skillprofile_step2_summaryquestionpresent3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_summaryquestionpresent3(inputs)
	return ar_skillprofile_step2_summaryquestionpresent3(inputs)
});
export { skillprofile_step2_summaryquestionpresent3 as "skillProfile.step2.summaryQuestionPresent" }