/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs */

const en_developerportal_integrationguide_consent_step5whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creates a credential template, issues it to the user, and writes it to your consent flow contract — all in one call.`)
};

const es_developerportal_integrationguide_consent_step5whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una plantilla de credencial, la emite al usuario y la escribe en tu contrato de flujo de consentimiento — todo en una llamada.`)
};

const fr_developerportal_integrationguide_consent_step5whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crée un modèle d'identifiant, l'émet à l'utilisateur et l'écrit dans votre contrat de flux de consentement — tout en un seul appel.`)
};

const ar_developerportal_integrationguide_consent_step5whatsthis4 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينشئ قالب بيانات اعتماد، ويصدره للمستخدم، ويكتبه في عقد تدفق الموافقة الخاص بك — كل ذلك في استدعاء واحد.`)
};

/**
* | output |
* | --- |
* | "Creates a credential template, issues it to the user, and writes it to your consent flow contract — all in one call." |
*
* @param {Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step5whatsthis4 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step5whatsthis4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step5whatsthis4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step5whatsthis4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step5whatsthis4(inputs)
	return ar_developerportal_integrationguide_consent_step5whatsthis4(inputs)
});
export { developerportal_integrationguide_consent_step5whatsthis4 as "developerPortal.integrationGuide.consent.step5WhatsThis" }