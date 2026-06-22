/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Back1Inputs */

const en_developerportal_onboarding_branding_back1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_developerportal_onboarding_branding_back1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_developerportal_onboarding_branding_back1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_developerportal_onboarding_branding_back1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Developerportal_Onboarding_Branding_Back1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_back1 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Back1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Back1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_back1(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_back1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_back1(inputs)
	return ar_developerportal_onboarding_branding_back1(inputs)
});
export { developerportal_onboarding_branding_back1 as "developerPortal.onboarding.branding.back" }