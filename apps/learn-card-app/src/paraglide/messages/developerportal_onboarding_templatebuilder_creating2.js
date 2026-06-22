/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Creating2Inputs */

const en_developerportal_onboarding_templatebuilder_creating2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Creating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_developerportal_onboarding_templatebuilder_creating2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Creating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_developerportal_onboarding_templatebuilder_creating2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Creating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création...`)
};

const ar_developerportal_onboarding_templatebuilder_creating2 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Creating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Developerportal_Onboarding_Templatebuilder_Creating2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_creating2 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Creating2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Creating2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_creating2(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_creating2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_creating2(inputs)
	return ar_developerportal_onboarding_templatebuilder_creating2(inputs)
});
export { developerportal_onboarding_templatebuilder_creating2 as "developerPortal.onboarding.templateBuilder.creating" }