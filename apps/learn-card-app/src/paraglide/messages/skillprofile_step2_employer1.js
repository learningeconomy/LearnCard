/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Employer1Inputs */

const en_skillprofile_step2_employer1 = /** @type {(inputs: Skillprofile_Step2_Employer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employer`)
};

const es_skillprofile_step2_employer1 = /** @type {(inputs: Skillprofile_Step2_Employer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empleador`)
};

const fr_skillprofile_step2_employer1 = /** @type {(inputs: Skillprofile_Step2_Employer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employeur`)
};

const ar_skillprofile_step2_employer1 = /** @type {(inputs: Skillprofile_Step2_Employer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صاحب العمل`)
};

/**
* | output |
* | --- |
* | "Employer" |
*
* @param {Skillprofile_Step2_Employer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_employer1 = /** @type {((inputs?: Skillprofile_Step2_Employer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Employer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_employer1(inputs)
	if (locale === "es") return es_skillprofile_step2_employer1(inputs)
	if (locale === "fr") return fr_skillprofile_step2_employer1(inputs)
	return ar_skillprofile_step2_employer1(inputs)
});
export { skillprofile_step2_employer1 as "skillProfile.step2.employer" }