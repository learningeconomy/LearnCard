/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Months1Inputs */

const en_skillprofile_step1_months1 = /** @type {(inputs: Skillprofile_Step1_Months1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`months`)
};

const es_skillprofile_step1_months1 = /** @type {(inputs: Skillprofile_Step1_Months1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`meses`)
};

const fr_skillprofile_step1_months1 = /** @type {(inputs: Skillprofile_Step1_Months1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`mois`)
};

const ar_skillprofile_step1_months1 = /** @type {(inputs: Skillprofile_Step1_Months1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أشهر`)
};

/**
* | output |
* | --- |
* | "months" |
*
* @param {Skillprofile_Step1_Months1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_months1 = /** @type {((inputs?: Skillprofile_Step1_Months1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Months1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step1_months1(inputs)
	if (locale === "es") return es_skillprofile_step1_months1(inputs)
	if (locale === "fr") return fr_skillprofile_step1_months1(inputs)
	return ar_skillprofile_step1_months1(inputs)
});
export { skillprofile_step1_months1 as "skillProfile.step1.months" }