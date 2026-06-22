/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs */

const en_developerportal_onboarding_templatebuilder_templateremoved3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template removed`)
};

const es_developerportal_onboarding_templatebuilder_templateremoved3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla eliminada`)
};

const fr_developerportal_onboarding_templatebuilder_templateremoved3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle supprimé`)
};

const ar_developerportal_onboarding_templatebuilder_templateremoved3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إزالة القالب`)
};

/**
* | output |
* | --- |
* | "Template removed" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_templateremoved3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Templateremoved3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_templateremoved3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_templateremoved3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_templateremoved3(inputs)
	return ar_developerportal_onboarding_templatebuilder_templateremoved3(inputs)
});
export { developerportal_onboarding_templatebuilder_templateremoved3 as "developerPortal.onboarding.templateBuilder.templateRemoved" }