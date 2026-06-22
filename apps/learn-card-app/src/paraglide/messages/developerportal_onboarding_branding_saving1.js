/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Saving1Inputs */

const en_developerportal_onboarding_branding_saving1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_developerportal_onboarding_branding_saving1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_developerportal_onboarding_branding_saving1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_developerportal_onboarding_branding_saving1 = /** @type {(inputs: Developerportal_Onboarding_Branding_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Developerportal_Onboarding_Branding_Saving1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_saving1 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Saving1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Saving1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_saving1(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_saving1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_saving1(inputs)
	return ar_developerportal_onboarding_branding_saving1(inputs)
});
export { developerportal_onboarding_branding_saving1 as "developerPortal.onboarding.branding.saving" }