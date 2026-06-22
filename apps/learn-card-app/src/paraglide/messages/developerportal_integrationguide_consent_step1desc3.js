/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step1desc3Inputs */

const en_developerportal_integrationguide_consent_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`First, create or select a Consent Flow Contract that defines what permissions your app needs. You can do this in the Developer Portal or via the API.`)
};

const es_developerportal_integrationguide_consent_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primero, crea o selecciona un Contrato de Flujo de Consentimiento que defina qué permisos necesita tu aplicación. Puedes hacer esto en el Portal de Desarrollador o mediante la API.`)
};

const fr_developerportal_integrationguide_consent_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez ou sélectionnez d'abord un Contrat de Flux de Consentement qui définit les permissions nécessaires à votre application. Vous pouvez le faire dans le Portail Développeur ou via l'API.`)
};

const ar_developerportal_integrationguide_consent_step1desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أولاً، قم بإنشاء أو تحديد عقد تدفق الموافقة الذي يحدد الصلاحيات التي يحتاجها تطبيقك. يمكنك القيام بذلك في بوابة المطور أو عبر API.`)
};

/**
* | output |
* | --- |
* | "First, create or select a Consent Flow Contract that defines what permissions your app needs. You can do this in the Developer Portal or via the API." |
*
* @param {Developerportal_Integrationguide_Consent_Step1desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step1desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step1desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step1desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step1desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step1desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step1desc3(inputs)
	return ar_developerportal_integrationguide_consent_step1desc3(inputs)
});
export { developerportal_integrationguide_consent_step1desc3 as "developerPortal.integrationGuide.consent.step1Desc" }