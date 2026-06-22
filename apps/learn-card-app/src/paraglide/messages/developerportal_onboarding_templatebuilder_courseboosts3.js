/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs */

const en_developerportal_onboarding_templatebuilder_courseboosts3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Course Boosts (${i?.count})`)
};

const es_developerportal_onboarding_templatebuilder_courseboosts3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Boosts de Cursos (${i?.count})`)
};

const fr_developerportal_onboarding_templatebuilder_courseboosts3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Boosts de Cours (${i?.count})`)
};

const ar_developerportal_onboarding_templatebuilder_courseboosts3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`معززات الدورة (${i?.count})`)
};

/**
* | output |
* | --- |
* | "Course Boosts ({count})" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_courseboosts3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Courseboosts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_courseboosts3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_courseboosts3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_courseboosts3(inputs)
	return ar_developerportal_onboarding_templatebuilder_courseboosts3(inputs)
});
export { developerportal_onboarding_templatebuilder_courseboosts3 as "developerPortal.onboarding.templateBuilder.courseBoosts" }