/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Success_TitleInputs */

const en_endorsement_request_success_title = /** @type {(inputs: Endorsement_Request_Success_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Sent!`)
};

const es_endorsement_request_success_title = /** @type {(inputs: Endorsement_Request_Success_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Solicitud enviada!`)
};

const fr_endorsement_request_success_title = /** @type {(inputs: Endorsement_Request_Success_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande envoyée !`)
};

const ar_endorsement_request_success_title = /** @type {(inputs: Endorsement_Request_Success_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال الطلب!`)
};

/**
* | output |
* | --- |
* | "Request Sent!" |
*
* @param {Endorsement_Request_Success_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_success_title = /** @type {((inputs?: Endorsement_Request_Success_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Success_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_success_title(inputs)
	if (locale === "es") return es_endorsement_request_success_title(inputs)
	if (locale === "fr") return fr_endorsement_request_success_title(inputs)
	return ar_endorsement_request_success_title(inputs)
});
export { endorsement_request_success_title as "endorsement.request.success.title" }