/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ value: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs */

const en_developerportal_onboarding_templatebuilder_csvexamplevalue4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`e.g., "${i?.value}"`)
};

const es_developerportal_onboarding_templatebuilder_csvexamplevalue4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ej., "${i?.value}"`)
};

const fr_developerportal_onboarding_templatebuilder_csvexamplevalue4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ex., "${i?.value}"`)
};

const ar_developerportal_onboarding_templatebuilder_csvexamplevalue4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مثال: "${i?.value}"`)
};

/**
* | output |
* | --- |
* | "e.g., \"{value}\"" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvexamplevalue4 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvexamplevalue4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvexamplevalue4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvexamplevalue4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvexamplevalue4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvexamplevalue4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvexamplevalue4 as "developerPortal.onboarding.templateBuilder.csvExampleValue" }