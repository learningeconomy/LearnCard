/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs */

const en_developerportal_onboarding_templatebuilder_customizeboost3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize this boost`)
};

const es_developerportal_onboarding_templatebuilder_customizeboost3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizar este boost`)
};

const fr_developerportal_onboarding_templatebuilder_customizeboost3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnaliser ce boost`)
};

const ar_developerportal_onboarding_templatebuilder_customizeboost3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص هذا المعزز`)
};

/**
* | output |
* | --- |
* | "Customize this boost" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_customizeboost3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Customizeboost3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_customizeboost3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_customizeboost3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_customizeboost3(inputs)
	return ar_developerportal_onboarding_templatebuilder_customizeboost3(inputs)
});
export { developerportal_onboarding_templatebuilder_customizeboost3 as "developerPortal.onboarding.templateBuilder.customizeBoost" }