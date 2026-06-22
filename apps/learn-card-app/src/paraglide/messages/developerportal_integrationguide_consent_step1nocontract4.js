/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step1nocontract4Inputs */

const en_developerportal_integrationguide_consent_step1nocontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1nocontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a consent flow contract above to see your URI here.`)
};

const es_developerportal_integrationguide_consent_step1nocontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1nocontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un contrato de flujo de consentimiento arriba para ver tu URI aquí.`)
};

const fr_developerportal_integrationguide_consent_step1nocontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1nocontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un contrat de flux de consentement ci-dessus pour voir votre URI ici.`)
};

const ar_developerportal_integrationguide_consent_step1nocontract4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1nocontract4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد عقد تدفق الموافقة أعلاه لرؤية URI الخاص بك هنا.`)
};

/**
* | output |
* | --- |
* | "Select a consent flow contract above to see your URI here." |
*
* @param {Developerportal_Integrationguide_Consent_Step1nocontract4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step1nocontract4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step1nocontract4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step1nocontract4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step1nocontract4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step1nocontract4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step1nocontract4(inputs)
	return ar_developerportal_integrationguide_consent_step1nocontract4(inputs)
});
export { developerportal_integrationguide_consent_step1nocontract4 as "developerPortal.integrationGuide.consent.step1NoContract" }