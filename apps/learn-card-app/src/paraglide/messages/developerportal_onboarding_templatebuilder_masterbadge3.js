/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs */

const en_developerportal_onboarding_templatebuilder_masterbadge3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Master Template`)
};

const es_developerportal_onboarding_templatebuilder_masterbadge3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla Maestra`)
};

const fr_developerportal_onboarding_templatebuilder_masterbadge3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle Maître`)
};

const ar_developerportal_onboarding_templatebuilder_masterbadge3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب رئيسي`)
};

/**
* | output |
* | --- |
* | "Master Template" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_masterbadge3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Masterbadge3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_masterbadge3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_masterbadge3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_masterbadge3(inputs)
	return ar_developerportal_onboarding_templatebuilder_masterbadge3(inputs)
});
export { developerportal_onboarding_templatebuilder_masterbadge3 as "developerPortal.onboarding.templateBuilder.masterBadge" }