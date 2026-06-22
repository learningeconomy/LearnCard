/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs */

const en_developerportal_onboarding_templatebuilder_csvdefaultimagealt5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default credential`)
};

const es_developerportal_onboarding_templatebuilder_csvdefaultimagealt5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial predeterminada`)
};

const fr_developerportal_onboarding_templatebuilder_csvdefaultimagealt5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential par défaut`)
};

const ar_developerportal_onboarding_templatebuilder_csvdefaultimagealt5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد الافتراضية`)
};

/**
* | output |
* | --- |
* | "Default credential" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvdefaultimagealt5 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvdefaultimagealt5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvdefaultimagealt5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvdefaultimagealt5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvdefaultimagealt5(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvdefaultimagealt5(inputs)
});
export { developerportal_onboarding_templatebuilder_csvdefaultimagealt5 as "developerPortal.onboarding.templateBuilder.csvDefaultImageAlt" }