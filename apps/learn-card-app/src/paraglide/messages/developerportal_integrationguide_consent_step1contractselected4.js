/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step1contractselected4Inputs */

const en_developerportal_integrationguide_consent_step1contractselected4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1contractselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your consent flow contract URI:`)
};

const es_developerportal_integrationguide_consent_step1contractselected4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1contractselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El URI de tu contrato de flujo de consentimiento:`)
};

const fr_developerportal_integrationguide_consent_step1contractselected4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1contractselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L URI de votre contrat de flux de consentement :`)
};

const ar_developerportal_integrationguide_consent_step1contractselected4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1contractselected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI عقد تدفق الموافقة الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Your consent flow contract URI:" |
*
* @param {Developerportal_Integrationguide_Consent_Step1contractselected4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step1contractselected4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step1contractselected4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step1contractselected4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step1contractselected4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step1contractselected4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step1contractselected4(inputs)
	return ar_developerportal_integrationguide_consent_step1contractselected4(inputs)
});
export { developerportal_integrationguide_consent_step1contractselected4 as "developerPortal.integrationGuide.consent.step1ContractSelected" }