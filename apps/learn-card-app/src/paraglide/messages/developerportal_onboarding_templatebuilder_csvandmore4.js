/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs */

const en_developerportal_onboarding_templatebuilder_csvandmore4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`...and ${i?.count} more`)
};

const es_developerportal_onboarding_templatebuilder_csvandmore4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`...y ${i?.count} más`)
};

const fr_developerportal_onboarding_templatebuilder_csvandmore4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`...et ${i?.count} supplémentaires`)
};

const ar_developerportal_onboarding_templatebuilder_csvandmore4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`...و${i?.count} أخرى`)
};

/**
* | output |
* | --- |
* | "...and {count} more" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvandmore4 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvandmore4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvandmore4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvandmore4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvandmore4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvandmore4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvandmore4 as "developerPortal.onboarding.templateBuilder.csvAndMore" }