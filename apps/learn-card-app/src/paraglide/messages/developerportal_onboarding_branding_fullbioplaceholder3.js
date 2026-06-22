/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs */

const en_developerportal_onboarding_branding_fullbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A longer description of your organization...`)
};

const es_developerportal_onboarding_branding_fullbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una descripción más larga de tu organización...`)
};

const fr_developerportal_onboarding_branding_fullbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une description plus longue de votre organisation...`)
};

const ar_developerportal_onboarding_branding_fullbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف أطول لمؤسستك...`)
};

/**
* | output |
* | --- |
* | "A longer description of your organization..." |
*
* @param {Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_fullbioplaceholder3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Fullbioplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_fullbioplaceholder3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_fullbioplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_fullbioplaceholder3(inputs)
	return ar_developerportal_onboarding_branding_fullbioplaceholder3(inputs)
});
export { developerportal_onboarding_branding_fullbioplaceholder3 as "developerPortal.onboarding.branding.fullBioPlaceholder" }