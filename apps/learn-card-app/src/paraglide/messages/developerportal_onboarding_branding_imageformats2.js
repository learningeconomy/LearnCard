/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Imageformats2Inputs */

const en_developerportal_onboarding_branding_imageformats2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imageformats2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formats: PNG, JPG, SVG`)
};

const es_developerportal_onboarding_branding_imageformats2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imageformats2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formatos: PNG, JPG, SVG`)
};

const fr_developerportal_onboarding_branding_imageformats2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imageformats2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Formats : PNG, JPG, SVG`)
};

const ar_developerportal_onboarding_branding_imageformats2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Imageformats2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنسيقات: PNG، JPG، SVG`)
};

/**
* | output |
* | --- |
* | "Formats: PNG, JPG, SVG" |
*
* @param {Developerportal_Onboarding_Branding_Imageformats2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_imageformats2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Imageformats2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Imageformats2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_imageformats2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_imageformats2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_imageformats2(inputs)
	return ar_developerportal_onboarding_branding_imageformats2(inputs)
});
export { developerportal_onboarding_branding_imageformats2 as "developerPortal.onboarding.branding.imageFormats" }