/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Fields2Inputs */

const en_developerportal_onboarding_templatebuilder_fields2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Fields2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} fields`)
};

const es_developerportal_onboarding_templatebuilder_fields2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Fields2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} campos`)
};

const fr_developerportal_onboarding_templatebuilder_fields2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Fields2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} champs`)
};

const ar_developerportal_onboarding_templatebuilder_fields2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Fields2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} حقول`)
};

/**
* | output |
* | --- |
* | "{count} fields" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Fields2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_fields2 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Fields2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Fields2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_fields2(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_fields2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_fields2(inputs)
	return ar_developerportal_onboarding_templatebuilder_fields2(inputs)
});
export { developerportal_onboarding_templatebuilder_fields2 as "developerPortal.onboarding.templateBuilder.fields" }