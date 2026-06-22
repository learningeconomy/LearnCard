/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs */

const en_developerportal_onboarding_datamapping_getcsvwithheaders5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get the CSV with the correct column headers`)
};

const es_developerportal_onboarding_datamapping_getcsvwithheaders5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get the CSV with the correct column headers`)
};

const fr_developerportal_onboarding_datamapping_getcsvwithheaders5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get the CSV with the correct column headers`)
};

const ar_developerportal_onboarding_datamapping_getcsvwithheaders5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get the CSV with the correct column headers`)
};

/**
* | output |
* | --- |
* | "Get the CSV with the correct column headers" |
*
* @param {Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_getcsvwithheaders5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Getcsvwithheaders5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_getcsvwithheaders5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_getcsvwithheaders5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_getcsvwithheaders5(inputs)
	return ar_developerportal_onboarding_datamapping_getcsvwithheaders5(inputs)
});
export { developerportal_onboarding_datamapping_getcsvwithheaders5 as "developerPortal.onboarding.dataMapping.getCsvWithHeaders" }