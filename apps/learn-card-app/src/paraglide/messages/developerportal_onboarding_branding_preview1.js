/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Preview1Inputs */

const en_developerportal_onboarding_branding_preview1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Preview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview`)
};

const es_developerportal_onboarding_branding_preview1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Preview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa`)
};

const fr_developerportal_onboarding_branding_preview1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Preview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ar_developerportal_onboarding_branding_preview1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Preview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة`)
};

/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Developerportal_Onboarding_Branding_Preview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_preview1 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Preview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Preview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_preview1(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_preview1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_preview1(inputs)
	return ar_developerportal_onboarding_branding_preview1(inputs)
});
export { developerportal_onboarding_branding_preview1 as "developerPortal.onboarding.branding.preview" }