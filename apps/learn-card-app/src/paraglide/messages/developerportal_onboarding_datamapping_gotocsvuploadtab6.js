/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs */

const en_developerportal_onboarding_datamapping_gotocsvuploadtab6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go to the CSV Upload tab in your dashboard to upload and process`)
};

const es_developerportal_onboarding_datamapping_gotocsvuploadtab6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go to the CSV Upload tab in your dashboard to upload and process`)
};

const fr_developerportal_onboarding_datamapping_gotocsvuploadtab6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go to the CSV Upload tab in your dashboard to upload and process`)
};

const ar_developerportal_onboarding_datamapping_gotocsvuploadtab6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go to the CSV Upload tab in your dashboard to upload and process`)
};

/**
* | output |
* | --- |
* | "Go to the CSV Upload tab in your dashboard to upload and process" |
*
* @param {Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_gotocsvuploadtab6 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Gotocsvuploadtab6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_gotocsvuploadtab6(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_gotocsvuploadtab6(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_gotocsvuploadtab6(inputs)
	return ar_developerportal_onboarding_datamapping_gotocsvuploadtab6(inputs)
});
export { developerportal_onboarding_datamapping_gotocsvuploadtab6 as "developerPortal.onboarding.dataMapping.goToCsvUploadTab" }