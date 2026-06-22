/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step4init3Inputs */

const en_developerportal_integrationguide_consent_step4init3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4init3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Then initialize with your API key:`)
};

const es_developerportal_integrationguide_consent_step4init3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4init3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Luego inicializa con tu clave de API:`)
};

const fr_developerportal_integrationguide_consent_step4init3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4init3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialisez ensuite avec votre clé d'API :`)
};

const ar_developerportal_integrationguide_consent_step4init3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4init3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ثم قم بالتهيئة باستخدام مفتاح API الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Then initialize with your API key:" |
*
* @param {Developerportal_Integrationguide_Consent_Step4init3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step4init3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step4init3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step4init3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step4init3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step4init3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step4init3(inputs)
	return ar_developerportal_integrationguide_consent_step4init3(inputs)
});
export { developerportal_integrationguide_consent_step4init3 as "developerPortal.integrationGuide.consent.step4Init" }