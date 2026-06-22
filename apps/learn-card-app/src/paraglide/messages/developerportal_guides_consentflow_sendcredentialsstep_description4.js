/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates that you'll issue to users who connect with your app. Templates are saved and reusable across multiple issuances.`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea plantillas de credenciales que emitirás a los usuarios que se conecten con tu aplicación. Las plantillas se guardan y son reutilizables en múltiples emisiones.`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates that you'll issue to users who connect with your app. Templates are saved and reusable across multiple issuances.`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_description4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ قوالب مؤهلات ستصدرها للمستخدمين الذين يتصلون بتطبيقك. يتم حفظ القوالب وإعادة استخدامها عبر إصدارات متعددة.`)
};

/**
* | output |
* | --- |
* | "Create credential templates that you'll issue to users who connect with your app. Templates are saved and reusable across multiple issuances." |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_description4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_description4(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_description4(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_description4 as "developerPortal.guides.consentFlow.sendCredentialsStep.description" }