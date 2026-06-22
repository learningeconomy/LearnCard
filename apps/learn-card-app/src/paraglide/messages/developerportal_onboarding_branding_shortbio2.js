/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Shortbio2Inputs */

const en_developerportal_onboarding_branding_shortbio2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbio2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Short Bio`)
};

const es_developerportal_onboarding_branding_shortbio2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbio2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Biografía Corta`)
};

const fr_developerportal_onboarding_branding_shortbio2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbio2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brève Description`)
};

const ar_developerportal_onboarding_branding_shortbio2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbio2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نبذة مختصرة`)
};

/**
* | output |
* | --- |
* | "Short Bio" |
*
* @param {Developerportal_Onboarding_Branding_Shortbio2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_shortbio2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Shortbio2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Shortbio2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_shortbio2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_shortbio2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_shortbio2(inputs)
	return ar_developerportal_onboarding_branding_shortbio2(inputs)
});
export { developerportal_onboarding_branding_shortbio2 as "developerPortal.onboarding.branding.shortBio" }