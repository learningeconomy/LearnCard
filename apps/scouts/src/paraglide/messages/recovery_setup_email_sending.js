/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_SendingInputs */

const en_recovery_setup_email_sending = /** @type {(inputs: Recovery_Setup_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_recovery_setup_email_sending = /** @type {(inputs: Recovery_Setup_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const fr_recovery_setup_email_sending = /** @type {(inputs: Recovery_Setup_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours...`)
};

const ar_recovery_setup_email_sending = /** @type {(inputs: Recovery_Setup_Email_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Recovery_Setup_Email_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_sending = /** @type {((inputs?: Recovery_Setup_Email_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_sending(inputs)
	if (locale === "es") return es_recovery_setup_email_sending(inputs)
	if (locale === "fr") return fr_recovery_setup_email_sending(inputs)
	return ar_recovery_setup_email_sending(inputs)
});
export { recovery_setup_email_sending as "recovery.setup.email.sending" }