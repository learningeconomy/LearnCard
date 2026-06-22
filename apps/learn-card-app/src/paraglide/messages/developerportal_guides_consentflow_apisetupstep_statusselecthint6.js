/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_statusselecthint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a token to use in your code`)
};

const es_developerportal_guides_consentflow_apisetupstep_statusselecthint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un token para usar en tu código`)
};

const fr_developerportal_guides_consentflow_apisetupstep_statusselecthint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un jeton à utiliser dans votre code`)
};

const ar_developerportal_guides_consentflow_apisetupstep_statusselecthint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر رمزاً لاستخدامه في الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "Select a token to use in your code" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_statusselecthint6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Statusselecthint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_statusselecthint6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_statusselecthint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_statusselecthint6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_statusselecthint6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_statusselecthint6 as "developerPortal.guides.consentFlow.apiSetupStep.statusSelectHint" }