/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Colorrose2Inputs */

const en_developerportal_onboarding_branding_colorrose2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorrose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rose`)
};

const es_developerportal_onboarding_branding_colorrose2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorrose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rosa`)
};

const fr_developerportal_onboarding_branding_colorrose2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorrose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rose`)
};

const ar_developerportal_onboarding_branding_colorrose2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorrose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وردي`)
};

/**
* | output |
* | --- |
* | "Rose" |
*
* @param {Developerportal_Onboarding_Branding_Colorrose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_colorrose2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Colorrose2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Colorrose2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_colorrose2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_colorrose2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_colorrose2(inputs)
	return ar_developerportal_onboarding_branding_colorrose2(inputs)
});
export { developerportal_onboarding_branding_colorrose2 as "developerPortal.onboarding.branding.colorRose" }