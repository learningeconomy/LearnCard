/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs */

const en_developerportal_onboarding_templatebuilder_csvdefaultimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default Credential Image`)
};

const es_developerportal_onboarding_templatebuilder_csvdefaultimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de Credencial Predeterminada`)
};

const fr_developerportal_onboarding_templatebuilder_csvdefaultimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de Credential par Défaut`)
};

const ar_developerportal_onboarding_templatebuilder_csvdefaultimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة بيانات الاعتماد الافتراضية`)
};

/**
* | output |
* | --- |
* | "Default Credential Image" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvdefaultimage4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvdefaultimage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvdefaultimage4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvdefaultimage4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvdefaultimage4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvdefaultimage4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvdefaultimage4 as "developerPortal.onboarding.templateBuilder.csvDefaultImage" }