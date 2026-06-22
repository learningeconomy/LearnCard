/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs */

const en_developerportal_onboarding_datamapping_hideadvancedoptions4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide Advanced Options`)
};

const es_developerportal_onboarding_datamapping_hideadvancedoptions4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide Advanced Options`)
};

const fr_developerportal_onboarding_datamapping_hideadvancedoptions4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide Advanced Options`)
};

const ar_developerportal_onboarding_datamapping_hideadvancedoptions4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide Advanced Options`)
};

/**
* | output |
* | --- |
* | "Hide Advanced Options" |
*
* @param {Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_hideadvancedoptions4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Hideadvancedoptions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_hideadvancedoptions4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_hideadvancedoptions4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_hideadvancedoptions4(inputs)
	return ar_developerportal_onboarding_datamapping_hideadvancedoptions4(inputs)
});
export { developerportal_onboarding_datamapping_hideadvancedoptions4 as "developerPortal.onboarding.dataMapping.hideAdvancedOptions" }