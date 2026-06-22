/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs */

const en_developerportal_guides_consentflow_teststep_examplecallback4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example callback URL your server will receive:`)
};

const es_developerportal_guides_consentflow_teststep_examplecallback4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejemplo de URL de devolución que recibirá tu servidor:`)
};

const fr_developerportal_guides_consentflow_teststep_examplecallback4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exemple d'URL de rappel que votre serveur recevra :`)
};

const ar_developerportal_guides_consentflow_teststep_examplecallback4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال لعنوان URL الاستدعاء الذي سيتلقاه الخادم الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Example callback URL your server will receive:" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_examplecallback4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Examplecallback4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_examplecallback4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_examplecallback4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_examplecallback4(inputs)
	return ar_developerportal_guides_consentflow_teststep_examplecallback4(inputs)
});
export { developerportal_guides_consentflow_teststep_examplecallback4 as "developerPortal.guides.consentFlow.testStep.exampleCallback" }