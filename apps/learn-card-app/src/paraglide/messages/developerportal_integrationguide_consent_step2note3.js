/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step2note3Inputs */

const en_developerportal_integrationguide_consent_step2note3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2note3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Store the did and vp (a VP JWT containing a delegate credential) to identify and send credentials to this user later.`)
};

const es_developerportal_integrationguide_consent_step2note3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2note3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda el did y el vp (un VP JWT que contiene un credential delegado) para identificar y enviar credenciales a este usuario más tarde.`)
};

const fr_developerportal_integrationguide_consent_step2note3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2note3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stockez le did et le vp (un VP JWT contenant un identifiant délégué) pour identifier et envoyer des identifiants à cet utilisateur plus tard.`)
};

const ar_developerportal_integrationguide_consent_step2note3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2note3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتخزين did و vp (VP JWT يحتوي على بيانات اعتماد مفوضة) لتحديد وإرسال بيانات الاعتماد إلى هذا المستخدم لاحقاً.`)
};

/**
* | output |
* | --- |
* | "Store the did and vp (a VP JWT containing a delegate credential) to identify and send credentials to this user later." |
*
* @param {Developerportal_Integrationguide_Consent_Step2note3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step2note3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step2note3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step2note3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step2note3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step2note3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step2note3(inputs)
	return ar_developerportal_integrationguide_consent_step2note3(inputs)
});
export { developerportal_integrationguide_consent_step2note3 as "developerPortal.integrationGuide.consent.step2Note" }