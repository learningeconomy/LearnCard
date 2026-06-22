/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs */

const en_developerportal_onboarding_templatebuilder_csvskipcolumn4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`— Skip this column —`)
};

const es_developerportal_onboarding_templatebuilder_csvskipcolumn4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`— Omitir esta columna —`)
};

const fr_developerportal_onboarding_templatebuilder_csvskipcolumn4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`— Ignorer cette colonne —`)
};

const ar_developerportal_onboarding_templatebuilder_csvskipcolumn4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`— تخطي هذا العمود —`)
};

/**
* | output |
* | --- |
* | "— Skip this column —" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvskipcolumn4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvskipcolumn4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvskipcolumn4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvskipcolumn4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvskipcolumn4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvskipcolumn4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvskipcolumn4 as "developerPortal.onboarding.templateBuilder.csvSkipColumn" }