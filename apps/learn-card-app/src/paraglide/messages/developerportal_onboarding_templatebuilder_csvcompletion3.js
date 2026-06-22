/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs */

const en_developerportal_onboarding_templatebuilder_csvcompletion3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} Completion`)
};

const es_developerportal_onboarding_templatebuilder_csvcompletion3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} Finalización`)
};

const fr_developerportal_onboarding_templatebuilder_csvcompletion3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} Achèvement`)
};

const ar_developerportal_onboarding_templatebuilder_csvcompletion3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} إتمام`)
};

/**
* | output |
* | --- |
* | "{name} Completion" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcompletion3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcompletion3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcompletion3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcompletion3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcompletion3(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcompletion3(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcompletion3 as "developerPortal.onboarding.templateBuilder.csvCompletion" }