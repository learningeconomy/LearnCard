/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_step2security5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Security: Store your API token in environment variables, never commit it to code.`)
};

const es_developerportal_guides_consentflow_apisetupstep_step2security5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguridad: Guarda tu token de API en variables de entorno, nunca lo subas al código.`)
};

const fr_developerportal_guides_consentflow_apisetupstep_step2security5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sécurité : Stockez votre jeton API dans des variables d'environnement, ne le commitez jamais dans le code.`)
};

const ar_developerportal_guides_consentflow_apisetupstep_step2security5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأمان: قم بتخزين رمز API الخاص بك في متغيرات البيئة، لا تقم بإضافته أبداً إلى الكود.`)
};

/**
* | output |
* | --- |
* | "Security: Store your API token in environment variables, never commit it to code." |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_step2security5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Step2security5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_step2security5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_step2security5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_step2security5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_step2security5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_step2security5 as "developerPortal.guides.consentFlow.apiSetupStep.step2Security" }