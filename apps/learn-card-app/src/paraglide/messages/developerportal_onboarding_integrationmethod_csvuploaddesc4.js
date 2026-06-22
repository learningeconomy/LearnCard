/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs */

const en_developerportal_onboarding_integrationmethod_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload a spreadsheet of completions and we'll issue credentials in bulk.`)
};

const es_developerportal_onboarding_integrationmethod_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube una hoja de cálculo de finalizaciones y emitiremos credenciales en masa.`)
};

const fr_developerportal_onboarding_integrationmethod_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez un tableaux des achèvements et nous émettrons les credentials en masse.`)
};

const ar_developerportal_onboarding_integrationmethod_csvuploaddesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم برفع جدول بيانات الإكمال وسنقوم بإصدار بيانات الاعتماد بكميات كبيرة.`)
};

/**
* | output |
* | --- |
* | "Upload a spreadsheet of completions and we'll issue credentials in bulk." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_csvuploaddesc4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Csvuploaddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_csvuploaddesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_csvuploaddesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_csvuploaddesc4(inputs)
	return ar_developerportal_onboarding_integrationmethod_csvuploaddesc4(inputs)
});
export { developerportal_onboarding_integrationmethod_csvuploaddesc4 as "developerPortal.onboarding.integrationMethod.csvUploadDesc" }