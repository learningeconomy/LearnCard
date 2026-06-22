/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs */

const en_developerportal_onboarding_templatebuilder_csvchangeimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change Image`)
};

const es_developerportal_onboarding_templatebuilder_csvchangeimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar Imagen`)
};

const fr_developerportal_onboarding_templatebuilder_csvchangeimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer d'Image`)
};

const ar_developerportal_onboarding_templatebuilder_csvchangeimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير الصورة`)
};

/**
* | output |
* | --- |
* | "Change Image" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvchangeimage4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvchangeimage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvchangeimage4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvchangeimage4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvchangeimage4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvchangeimage4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvchangeimage4 as "developerPortal.onboarding.templateBuilder.csvChangeImage" }