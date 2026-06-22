/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Summaryquestionpast3Inputs */

const en_skillprofile_step2_summaryquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What did you do?`)
};

const es_skillprofile_step2_summaryquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué hacías?`)
};

const fr_skillprofile_step2_summaryquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que faisiez-vous ?`)
};

const ar_skillprofile_step2_summaryquestionpast3 = /** @type {(inputs: Skillprofile_Step2_Summaryquestionpast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا كنت تفعل؟`)
};

/**
* | output |
* | --- |
* | "What did you do?" |
*
* @param {Skillprofile_Step2_Summaryquestionpast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_summaryquestionpast3 = /** @type {((inputs?: Skillprofile_Step2_Summaryquestionpast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Summaryquestionpast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_summaryquestionpast3(inputs)
	if (locale === "es") return es_skillprofile_step2_summaryquestionpast3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_summaryquestionpast3(inputs)
	return ar_skillprofile_step2_summaryquestionpast3(inputs)
});
export { skillprofile_step2_summaryquestionpast3 as "skillProfile.step2.summaryQuestionPast" }