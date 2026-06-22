/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs */

const en_developerportal_onboarding_datamapping_apiboosturisdesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy individual URIs or export all as a config file for your codebase.`)
};

const es_developerportal_onboarding_datamapping_apiboosturisdesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia URIs individuales o exporta todo como archivo de configuración para tu código.`)
};

const fr_developerportal_onboarding_datamapping_apiboosturisdesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez des URI individuelles ou exportez tout comme fichier de configuration pour votre code.`)
};

const ar_developerportal_onboarding_datamapping_apiboosturisdesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ URIs فردية أو قم بتصدير الكل كملف تكوين لقاعدة الكود الخاصة بك.`)
};

/**
* | output |
* | --- |
* | "Copy individual URIs or export all as a config file for your codebase." |
*
* @param {Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apiboosturisdesc5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apiboosturisdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apiboosturisdesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apiboosturisdesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apiboosturisdesc5(inputs)
	return ar_developerportal_onboarding_datamapping_apiboosturisdesc5(inputs)
});
export { developerportal_onboarding_datamapping_apiboosturisdesc5 as "developerPortal.onboarding.dataMapping.apiBoostUrisDesc" }