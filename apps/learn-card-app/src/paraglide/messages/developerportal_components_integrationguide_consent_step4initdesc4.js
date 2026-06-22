/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs */

const en_developerportal_components_integrationguide_consent_step4initdesc4 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Then initialize with your API key:`)
};

const es_developerportal_components_integrationguide_consent_step4initdesc4 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Luego inicializa con tu clave de API:`)
};

const fr_developerportal_components_integrationguide_consent_step4initdesc4 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialisez ensuite avec votre clé API :`)
};

const ar_developerportal_components_integrationguide_consent_step4initdesc4 = /** @type {(inputs: Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ثم قم بالتهيئة باستخدام مفتاح API الخاص بك:`)
};

/**
* | output |
* | --- |
* | "Then initialize with your API key:" |
*
* @param {Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationguide_consent_step4initdesc4 = /** @type {((inputs?: Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationguide_Consent_Step4initdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationguide_consent_step4initdesc4(inputs)
	if (locale === "es") return es_developerportal_components_integrationguide_consent_step4initdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationguide_consent_step4initdesc4(inputs)
	return ar_developerportal_components_integrationguide_consent_step4initdesc4(inputs)
});
export { developerportal_components_integrationguide_consent_step4initdesc4 as "developerPortal.components.integrationGuide.consent.step4InitDesc" }