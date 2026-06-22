/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Sendemail1Inputs */

const en_endorsement_request_options_sendemail1 = /** @type {(inputs: Endorsement_Request_Options_Sendemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Email Request`)
};

const es_endorsement_request_options_sendemail1 = /** @type {(inputs: Endorsement_Request_Options_Sendemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar solicitud por correo`)
};

const fr_endorsement_request_options_sendemail1 = /** @type {(inputs: Endorsement_Request_Options_Sendemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la demande par e-mail`)
};

const ar_endorsement_request_options_sendemail1 = /** @type {(inputs: Endorsement_Request_Options_Sendemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الطلب عبر البريد`)
};

/**
* | output |
* | --- |
* | "Send Email Request" |
*
* @param {Endorsement_Request_Options_Sendemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_sendemail1 = /** @type {((inputs?: Endorsement_Request_Options_Sendemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Sendemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_sendemail1(inputs)
	if (locale === "es") return es_endorsement_request_options_sendemail1(inputs)
	if (locale === "fr") return fr_endorsement_request_options_sendemail1(inputs)
	return ar_endorsement_request_options_sendemail1(inputs)
});
export { endorsement_request_options_sendemail1 as "endorsement.request.options.sendEmail" }