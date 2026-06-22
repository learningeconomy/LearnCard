/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs */

const en_developerportal_guides_consentflow_apisetupstep_fetcherror5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load API tokens. Please try refreshing the page.`)
};

const es_developerportal_guides_consentflow_apisetupstep_fetcherror5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar los tokens de API. Intenta actualizar la página.`)
};

const fr_developerportal_guides_consentflow_apisetupstep_fetcherror5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des jetons API. Veuillez actualiser la page.`)
};

const ar_developerportal_guides_consentflow_apisetupstep_fetcherror5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل رموز API. يرجى تحديث الصفحة.`)
};

/**
* | output |
* | --- |
* | "Failed to load API tokens. Please try refreshing the page." |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_fetcherror5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Fetcherror5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_fetcherror5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_fetcherror5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_fetcherror5(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_fetcherror5(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_fetcherror5 as "developerPortal.guides.consentFlow.apiSetupStep.fetchError" }