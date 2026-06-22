/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs */

const en_developerportal_integrationguide_consent_step1yourcontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Contract URI`)
};

const es_developerportal_integrationguide_consent_step1yourcontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu URI de Contrato`)
};

const fr_developerportal_integrationguide_consent_step1yourcontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre URI de Contrat`)
};

const ar_developerportal_integrationguide_consent_step1yourcontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI العقد الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your Contract URI" |
*
* @param {Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step1yourcontract4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step1yourcontract4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step1yourcontract4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step1yourcontract4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step1yourcontract4(inputs)
	return ar_developerportal_integrationguide_consent_step1yourcontract4(inputs)
});
export { developerportal_integrationguide_consent_step1yourcontract4 as "developerPortal.integrationGuide.consent.step1YourContract" }