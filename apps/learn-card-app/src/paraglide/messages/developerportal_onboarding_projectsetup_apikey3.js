/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Apikey3Inputs */

const en_developerportal_onboarding_projectsetup_apikey3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Apikey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Key`)
};

const es_developerportal_onboarding_projectsetup_apikey3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Apikey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave API`)
};

const fr_developerportal_onboarding_projectsetup_apikey3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Apikey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé API`)
};

const ar_developerportal_onboarding_projectsetup_apikey3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Apikey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح API`)
};

/**
* | output |
* | --- |
* | "API Key" |
*
* @param {Developerportal_Onboarding_Projectsetup_Apikey3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_apikey3 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Apikey3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Apikey3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_apikey3(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_apikey3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_apikey3(inputs)
	return ar_developerportal_onboarding_projectsetup_apikey3(inputs)
});
export { developerportal_onboarding_projectsetup_apikey3 as "developerPortal.onboarding.projectSetup.apiKey" }