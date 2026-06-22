/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs */

const en_developerportal_onboarding_datamapping_downloadpreformattedtemplate5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download a pre-formatted template with the correct columns`)
};

const es_developerportal_onboarding_datamapping_downloadpreformattedtemplate5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download a pre-formatted template with the correct columns`)
};

const fr_developerportal_onboarding_datamapping_downloadpreformattedtemplate5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download a pre-formatted template with the correct columns`)
};

const ar_developerportal_onboarding_datamapping_downloadpreformattedtemplate5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download a pre-formatted template with the correct columns`)
};

/**
* | output |
* | --- |
* | "Download a pre-formatted template with the correct columns" |
*
* @param {Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_downloadpreformattedtemplate5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Downloadpreformattedtemplate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_downloadpreformattedtemplate5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_downloadpreformattedtemplate5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_downloadpreformattedtemplate5(inputs)
	return ar_developerportal_onboarding_datamapping_downloadpreformattedtemplate5(inputs)
});
export { developerportal_onboarding_datamapping_downloadpreformattedtemplate5 as "developerPortal.onboarding.dataMapping.downloadPreFormattedTemplate" }