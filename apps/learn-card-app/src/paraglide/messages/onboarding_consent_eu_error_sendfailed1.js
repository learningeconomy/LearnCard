/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Eu_Error_Sendfailed1Inputs */

const en_onboarding_consent_eu_error_sendfailed1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Sendfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send consent request. Please try again.`)
};

const es_onboarding_consent_eu_error_sendfailed1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Sendfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo enviar la solicitud. Intenta de nuevo.`)
};

const fr_onboarding_consent_eu_error_sendfailed1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Sendfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi de la demande. Veuillez réessayer.`)
};

const ar_onboarding_consent_eu_error_sendfailed1 = /** @type {(inputs: Onboarding_Consent_Eu_Error_Sendfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إرسال طلب الموافقة. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to send consent request. Please try again." |
*
* @param {Onboarding_Consent_Eu_Error_Sendfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_error_sendfailed1 = /** @type {((inputs?: Onboarding_Consent_Eu_Error_Sendfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Error_Sendfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_eu_error_sendfailed1(inputs)
	if (locale === "es") return es_onboarding_consent_eu_error_sendfailed1(inputs)
	if (locale === "fr") return fr_onboarding_consent_eu_error_sendfailed1(inputs)
	return ar_onboarding_consent_eu_error_sendfailed1(inputs)
});
export { onboarding_consent_eu_error_sendfailed1 as "onboarding.consent.eu.error.sendFailed" }