/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_SendingInputs */

const en_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const de_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird gesendet...`)
};

const ar_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإرسال...`)
};

const fr_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi...`)
};

const ko_recovery_sending = /** @type {(inputs: Recovery_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전송 중...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Recovery_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_sending = /** @type {((inputs?: Recovery_SendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_SendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_sending(inputs)
	if (locale === "es") return es_recovery_sending(inputs)
	if (locale === "de") return de_recovery_sending(inputs)
	if (locale === "ar") return ar_recovery_sending(inputs)
	if (locale === "fr") return fr_recovery_sending(inputs)
	return ko_recovery_sending(inputs)
});
export { recovery_sending as "recovery.sending" }