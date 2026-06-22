/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Employerquestionpresent3Inputs */

const en_skillprofile_step2_employerquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who do you work for?`)
};

const es_skillprofile_step2_employerquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Para quién trabajas?`)
};

const fr_skillprofile_step2_employerquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour qui travaillez-vous ?`)
};

const ar_skillprofile_step2_employerquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لمن تعمل؟`)
};

/**
* | output |
* | --- |
* | "Who do you work for?" |
*
* @param {Skillprofile_Step2_Employerquestionpresent3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_employerquestionpresent3 = /** @type {((inputs?: Skillprofile_Step2_Employerquestionpresent3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Employerquestionpresent3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_employerquestionpresent3(inputs)
	if (locale === "es") return es_skillprofile_step2_employerquestionpresent3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_employerquestionpresent3(inputs)
	return ar_skillprofile_step2_employerquestionpresent3(inputs)
});
export { skillprofile_step2_employerquestionpresent3 as "skillProfile.step2.employerQuestionPresent" }