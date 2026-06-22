/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Credentials via API`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Credenciales mediante API`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer les Certificats par API`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال المؤهلات عبر API`)
};

/**
* | output |
* | --- |
* | "Send Credentials via API" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step2title5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step2title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step2title5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step2title5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step2title5(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step2title5(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step2title5 as "developerPortal.guides.consentFlow.sendCredentialsStep.step2Title" }