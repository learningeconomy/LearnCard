/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step3desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`As the contract owner, you can query consent data and transactions:`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step3desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Como propietario del contrato, puedes consultar datos y transacciones de consentimiento:`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step3desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En tant que propriétaire du contrat, vous pouvez interroger les données et transactions de consentement :`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step3desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بصفته مالك العقد، يمكنك الاستعلام عن بيانات ومعاملات الموافقة:`)
};

/**
* | output |
* | --- |
* | "As the contract owner, you can query consent data and transactions:" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step3desc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step3desc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step3desc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step3desc5(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step3desc5(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step3desc5 as "developerPortal.guides.consentFlow.sendCredentialsStep.step3Desc" }