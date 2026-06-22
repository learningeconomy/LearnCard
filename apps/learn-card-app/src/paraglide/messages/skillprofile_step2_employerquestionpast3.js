/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Employerquestionpast3Inputs */

const en_skillprofile_step2_employerquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who did you work for?`)
};

const es_skillprofile_step2_employerquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Para quién trabajabas?`)
};

const fr_skillprofile_step2_employerquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour qui travailliez-vous ?`)
};

const ar_skillprofile_step2_employerquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Employerquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لمن كنت تعمل؟`)
};

/**
* | output |
* | --- |
* | "Who did you work for?" |
*
* @param {Skillprofile_Step2_Employerquestionpast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_employerquestionpast3 = /** @type {((inputs?: Skillprofile_Step2_Employerquestionpast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Employerquestionpast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_employerquestionpast3(inputs)
	if (locale === "es") return es_skillprofile_step2_employerquestionpast3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_employerquestionpast3(inputs)
	return ar_skillprofile_step2_employerquestionpast3(inputs)
});
export { skillprofile_step2_employerquestionpast3 as "skillProfile.step2.employerQuestionPast" }