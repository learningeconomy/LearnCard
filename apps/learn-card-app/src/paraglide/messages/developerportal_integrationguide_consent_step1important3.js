/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step1important3Inputs */

const en_developerportal_integrationguide_consent_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy and save your Contract URI — you will need it to send credentials later.`)
};

const es_developerportal_integrationguide_consent_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia y guarda tu URI de Contrato — la necesitarás para enviar credenciales después.`)
};

const fr_developerportal_integrationguide_consent_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez et sauvegardez votre URI de Contrat — vous en aurez besoin pour envoyer des identifiants plus tard.`)
};

const ar_developerportal_integrationguide_consent_step1important3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step1important3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ واحفظ URI العقد — ستحتاجه لإرسال بيانات الاعتماد لاحقاً.`)
};

/**
* | output |
* | --- |
* | "Copy and save your Contract URI — you will need it to send credentials later." |
*
* @param {Developerportal_Integrationguide_Consent_Step1important3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step1important3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step1important3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step1important3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step1important3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step1important3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step1important3(inputs)
	return ar_developerportal_integrationguide_consent_step1important3(inputs)
});
export { developerportal_integrationguide_consent_step1important3 as "developerPortal.integrationGuide.consent.step1Important" }