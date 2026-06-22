/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Years1Inputs */

const en_skillprofile_step1_years1 = /** @type {(inputs: Skillprofile_Step1_Years1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`years`)
};

const es_skillprofile_step1_years1 = /** @type {(inputs: Skillprofile_Step1_Years1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`años`)
};

const fr_skillprofile_step1_years1 = /** @type {(inputs: Skillprofile_Step1_Years1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ans`)
};

const ar_skillprofile_step1_years1 = /** @type {(inputs: Skillprofile_Step1_Years1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنوات`)
};

/**
* | output |
* | --- |
* | "years" |
*
* @param {Skillprofile_Step1_Years1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_years1 = /** @type {((inputs?: Skillprofile_Step1_Years1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Years1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step1_years1(inputs)
	if (locale === "es") return es_skillprofile_step1_years1(inputs)
	if (locale === "fr") return fr_skillprofile_step1_years1(inputs)
	return ar_skillprofile_step1_years1(inputs)
});
export { skillprofile_step1_years1 as "skillProfile.step1.years" }