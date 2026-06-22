/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Jobtitle2Inputs */

const en_skillprofile_step2_jobtitle2 = /** @type {(inputs: Skillprofile_Step2_Jobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Title`)
};

const es_skillprofile_step2_jobtitle2 = /** @type {(inputs: Skillprofile_Step2_Jobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puesto`)
};

const fr_skillprofile_step2_jobtitle2 = /** @type {(inputs: Skillprofile_Step2_Jobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intitulé du poste`)
};

const ar_skillprofile_step2_jobtitle2 = /** @type {(inputs: Skillprofile_Step2_Jobtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسمى الوظيفي`)
};

/**
* | output |
* | --- |
* | "Job Title" |
*
* @param {Skillprofile_Step2_Jobtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_jobtitle2 = /** @type {((inputs?: Skillprofile_Step2_Jobtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Jobtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_jobtitle2(inputs)
	if (locale === "es") return es_skillprofile_step2_jobtitle2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_jobtitle2(inputs)
	return ar_skillprofile_step2_jobtitle2(inputs)
});
export { skillprofile_step2_jobtitle2 as "skillProfile.step2.jobTitle" }