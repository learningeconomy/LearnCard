/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs */

const en_developerportal_onboarding_templatebuilder_csvhowitworkstitle6 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How this works:`)
};

const es_developerportal_onboarding_templatebuilder_csvhowitworkstitle6 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo funciona:`)
};

const fr_developerportal_onboarding_templatebuilder_csvhowitworkstitle6 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment ça marche :`)
};

const ar_developerportal_onboarding_templatebuilder_csvhowitworkstitle6 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف يعمل هذا:`)
};

/**
* | output |
* | --- |
* | "How this works:" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvhowitworkstitle6 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvhowitworkstitle6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvhowitworkstitle6(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvhowitworkstitle6(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvhowitworkstitle6(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvhowitworkstitle6(inputs)
});
export { developerportal_onboarding_templatebuilder_csvhowitworkstitle6 as "developerPortal.onboarding.templateBuilder.csvHowItWorksTitle" }