/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Yourorg2Inputs */

const en_developerportal_onboarding_branding_yourorg2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Yourorg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Organization`)
};

const es_developerportal_onboarding_branding_yourorg2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Yourorg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Organización`)
};

const fr_developerportal_onboarding_branding_yourorg2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Yourorg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Organisation`)
};

const ar_developerportal_onboarding_branding_yourorg2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Yourorg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤسستك`)
};

/**
* | output |
* | --- |
* | "Your Organization" |
*
* @param {Developerportal_Onboarding_Branding_Yourorg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_yourorg2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Yourorg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Yourorg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_yourorg2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_yourorg2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_yourorg2(inputs)
	return ar_developerportal_onboarding_branding_yourorg2(inputs)
});
export { developerportal_onboarding_branding_yourorg2 as "developerPortal.onboarding.branding.yourOrg" }