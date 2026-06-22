/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step3sub15 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get all consented data for your contract:`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step3sub15 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener todos los datos consentidos para tu contrato:`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step3sub15 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir toutes les données consenties pour votre contrat :`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step3sub15 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على جميع البيانات الموافق عليها لعقدك:`)
};

/**
* | output |
* | --- |
* | "Get all consented data for your contract:" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step3sub15 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step3sub15(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step3sub15(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step3sub15(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step3sub15(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step3sub15 as "developerPortal.guides.consentFlow.sendCredentialsStep.step3Sub1" }