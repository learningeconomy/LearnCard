/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs */

const en_developerportal_guides_consentflow_apisetupstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialize the LearnCard SDK on your backend to send credentials and query consent data.`)
};

const es_developerportal_guides_consentflow_apisetupstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicializa el SDK de LearnCard en tu backend para enviar credenciales y consultar datos de consentimiento.`)
};

const fr_developerportal_guides_consentflow_apisetupstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialisez le SDK LearnCard sur votre backend pour envoyer des certificats et interroger les données de consentement.`)
};

const ar_developerportal_guides_consentflow_apisetupstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتهيئة LearnCard SDK على الخادم الخلفي الخاص بك لإرسال المؤهلات والاستعلام عن بيانات الموافقة.`)
};

/**
* | output |
* | --- |
* | "Initialize the LearnCard SDK on your backend to send credentials and query consent data." |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_description4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_description4(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_description4(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_description4 as "developerPortal.guides.consentFlow.apiSetupStep.description" }