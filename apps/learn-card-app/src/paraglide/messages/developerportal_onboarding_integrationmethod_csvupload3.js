/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs */

const en_developerportal_onboarding_integrationmethod_csvupload3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSV Upload`)
};

const es_developerportal_onboarding_integrationmethod_csvupload3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subida CSV`)
};

const fr_developerportal_onboarding_integrationmethod_csvupload3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import CSV`)
};

const ar_developerportal_onboarding_integrationmethod_csvupload3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع CSV`)
};

/**
* | output |
* | --- |
* | "CSV Upload" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_csvupload3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Csvupload3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_csvupload3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_csvupload3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_csvupload3(inputs)
	return ar_developerportal_onboarding_integrationmethod_csvupload3(inputs)
});
export { developerportal_onboarding_integrationmethod_csvupload3 as "developerPortal.onboarding.integrationMethod.csvUpload" }