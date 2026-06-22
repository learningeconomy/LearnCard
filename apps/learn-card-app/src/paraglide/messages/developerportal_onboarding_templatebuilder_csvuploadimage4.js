/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs */

const en_developerportal_onboarding_templatebuilder_csvuploadimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Image`)
};

const es_developerportal_onboarding_templatebuilder_csvuploadimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir Imagen`)
};

const fr_developerportal_onboarding_templatebuilder_csvuploadimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger une Image`)
};

const ar_developerportal_onboarding_templatebuilder_csvuploadimage4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع صورة`)
};

/**
* | output |
* | --- |
* | "Upload Image" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvuploadimage4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvuploadimage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvuploadimage4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvuploadimage4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvuploadimage4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvuploadimage4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvuploadimage4 as "developerPortal.onboarding.templateBuilder.csvUploadImage" }