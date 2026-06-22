/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Locationquestionpast3Inputs */

const en_skillprofile_step2_locationquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where was this job located?`)
};

const es_skillprofile_step2_locationquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Dónde estaba ubicado este empleo?`)
};

const fr_skillprofile_step2_locationquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Où se situait cet emploi ?`)
};

const ar_skillprofile_step2_locationquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Locationquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أين كان موقع هذه الوظيفة؟`)
};

/**
* | output |
* | --- |
* | "Where was this job located?" |
*
* @param {Skillprofile_Step2_Locationquestionpast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_locationquestionpast3 = /** @type {((inputs?: Skillprofile_Step2_Locationquestionpast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Locationquestionpast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_locationquestionpast3(inputs)
	if (locale === "es") return es_skillprofile_step2_locationquestionpast3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_locationquestionpast3(inputs)
	return ar_skillprofile_step2_locationquestionpast3(inputs)
});
export { skillprofile_step2_locationquestionpast3 as "skillProfile.step2.locationQuestionPast" }