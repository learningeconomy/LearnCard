/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs */

const en_developerportal_guides_consentflow_teststep_consenturllabel5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent URL:`)
};

const es_developerportal_guides_consentflow_teststep_consenturllabel5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Consentimiento:`)
};

const fr_developerportal_guides_consentflow_teststep_consenturllabel5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Consentement :`)
};

const ar_developerportal_guides_consentflow_teststep_consenturllabel5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان URL للموافقة:`)
};

/**
* | output |
* | --- |
* | "Consent URL:" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_consenturllabel5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Consenturllabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_consenturllabel5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_consenturllabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_consenturllabel5(inputs)
	return ar_developerportal_guides_consentflow_teststep_consenturllabel5(inputs)
});
export { developerportal_guides_consentflow_teststep_consenturllabel5 as "developerPortal.guides.consentFlow.testStep.consentUrlLabel" }