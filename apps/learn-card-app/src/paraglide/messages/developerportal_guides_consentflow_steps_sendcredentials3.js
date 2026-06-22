/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs */

const en_developerportal_guides_consentflow_steps_sendcredentials3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Credentials`)
};

const es_developerportal_guides_consentflow_steps_sendcredentials3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Credenciales`)
};

const fr_developerportal_guides_consentflow_steps_sendcredentials3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer les Certificats`)
};

const ar_developerportal_guides_consentflow_steps_sendcredentials3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال المؤهلات`)
};

/**
* | output |
* | --- |
* | "Send Credentials" |
*
* @param {Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_steps_sendcredentials3 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Steps_Sendcredentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_steps_sendcredentials3(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_steps_sendcredentials3(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_steps_sendcredentials3(inputs)
	return ar_developerportal_guides_consentflow_steps_sendcredentials3(inputs)
});
export { developerportal_guides_consentflow_steps_sendcredentials3 as "developerPortal.guides.consentFlow.steps.sendCredentials" }