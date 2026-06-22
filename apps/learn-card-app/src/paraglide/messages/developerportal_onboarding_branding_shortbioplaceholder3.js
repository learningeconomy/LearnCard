/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs */

const en_developerportal_onboarding_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A brief tagline or description`)
};

const es_developerportal_onboarding_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un eslogan o descripción breve`)
};

const fr_developerportal_onboarding_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un slogan ou une description brève`)
};

const ar_developerportal_onboarding_branding_shortbioplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار أو وصف موجز`)
};

/**
* | output |
* | --- |
* | "A brief tagline or description" |
*
* @param {Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_shortbioplaceholder3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Shortbioplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_shortbioplaceholder3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_shortbioplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_shortbioplaceholder3(inputs)
	return ar_developerportal_onboarding_branding_shortbioplaceholder3(inputs)
});
export { developerportal_onboarding_branding_shortbioplaceholder3 as "developerPortal.onboarding.branding.shortBioPlaceholder" }