/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs */

const en_developerportal_onboarding_templatebuilder_csvmapped3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} mapped`)
};

const es_developerportal_onboarding_templatebuilder_csvmapped3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} mapeados`)
};

const fr_developerportal_onboarding_templatebuilder_csvmapped3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} mappés`)
};

const ar_developerportal_onboarding_templatebuilder_csvmapped3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} تم تخطيطها`)
};

/**
* | output |
* | --- |
* | "{count} mapped" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvmapped3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvmapped3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvmapped3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvmapped3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvmapped3(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvmapped3(inputs)
});
export { developerportal_onboarding_templatebuilder_csvmapped3 as "developerPortal.onboarding.templateBuilder.csvMapped" }