/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs */

const en_developerportal_onboarding_templatebuilder_csvcolumns3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} columns`)
};

const es_developerportal_onboarding_templatebuilder_csvcolumns3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} columnas`)
};

const fr_developerportal_onboarding_templatebuilder_csvcolumns3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} colonnes`)
};

const ar_developerportal_onboarding_templatebuilder_csvcolumns3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} أعمدة`)
};

/**
* | output |
* | --- |
* | "{count} columns" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvcolumns3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvcolumns3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvcolumns3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvcolumns3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvcolumns3(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvcolumns3(inputs)
});
export { developerportal_onboarding_templatebuilder_csvcolumns3 as "developerPortal.onboarding.templateBuilder.csvColumns" }