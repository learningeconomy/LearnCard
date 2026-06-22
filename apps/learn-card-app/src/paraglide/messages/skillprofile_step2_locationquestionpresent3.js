/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Locationquestionpresent3Inputs */

const en_skillprofile_step2_locationquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where is this job located?`)
};

const es_skillprofile_step2_locationquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Dónde está ubicado este empleo?`)
};

const fr_skillprofile_step2_locationquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Où se situe cet emploi ?`)
};

const ar_skillprofile_step2_locationquestionpresent3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpresent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أين موقع هذه الوظيفة؟`)
};

/**
* | output |
* | --- |
* | "Where is this job located?" |
*
* @param {Skillprofile_Step2_Locationquestionpresent3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_locationquestionpresent3 = /** @type {((inputs?: Skillprofile_Step2_Locationquestionpresent3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Locationquestionpresent3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_locationquestionpresent3(inputs)
	if (locale === "es") return es_skillprofile_step2_locationquestionpresent3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_locationquestionpresent3(inputs)
	return ar_skillprofile_step2_locationquestionpresent3(inputs)
});
export { skillprofile_step2_locationquestionpresent3 as "skillProfile.step2.locationQuestionPresent" }