/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step5title3Inputs */

const en_developerportal_integrationguide_consent_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Credentials to Users`)
};

const es_developerportal_integrationguide_consent_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía Credenciales a los Usuarios`)
};

const fr_developerportal_integrationguide_consent_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer des Identifiants aux Utilisateurs`)
};

const ar_developerportal_integrationguide_consent_step5title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال بيانات الاعتماد إلى المستخدمين`)
};

/**
* | output |
* | --- |
* | "Send Credentials to Users" |
*
* @param {Developerportal_Integrationguide_Consent_Step5title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step5title3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step5title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step5title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step5title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step5title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step5title3(inputs)
	return ar_developerportal_integrationguide_consent_step5title3(inputs)
});
export { developerportal_integrationguide_consent_step5title3 as "developerPortal.integrationGuide.consent.step5Title" }