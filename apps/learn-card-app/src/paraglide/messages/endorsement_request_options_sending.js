/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_SendingInputs */

const en_endorsement_request_options_sending = /** @type {(inputs: Endorsement_Request_Options_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_endorsement_request_options_sending = /** @type {(inputs: Endorsement_Request_Options_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const fr_endorsement_request_options_sending = /** @type {(inputs: Endorsement_Request_Options_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi...`)
};

const ar_endorsement_request_options_sending = /** @type {(inputs: Endorsement_Request_Options_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Endorsement_Request_Options_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_sending = /** @type {((inputs?: Endorsement_Request_Options_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_sending(inputs)
	if (locale === "es") return es_endorsement_request_options_sending(inputs)
	if (locale === "fr") return fr_endorsement_request_options_sending(inputs)
	return ar_endorsement_request_options_sending(inputs)
});
export { endorsement_request_options_sending as "endorsement.request.options.sending" }