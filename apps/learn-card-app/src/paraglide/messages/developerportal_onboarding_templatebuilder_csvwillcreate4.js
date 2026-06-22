/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs */

const en_developerportal_onboarding_templatebuilder_csvwillcreate4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Will create ${i?.count} course boosts`)
};

const es_developerportal_onboarding_templatebuilder_csvwillcreate4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se crearán ${i?.count} boosts de cursos`)
};

const fr_developerportal_onboarding_templatebuilder_csvwillcreate4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créera ${i?.count} boosts de cours`)
};

const ar_developerportal_onboarding_templatebuilder_csvwillcreate4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سيتم إنشاء ${i?.count} معزز دورة`)
};

/**
* | output |
* | --- |
* | "Will create {count} course boosts" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvwillcreate4 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvwillcreate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvwillcreate4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvwillcreate4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvwillcreate4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvwillcreate4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvwillcreate4 as "developerPortal.onboarding.templateBuilder.csvWillCreate" }