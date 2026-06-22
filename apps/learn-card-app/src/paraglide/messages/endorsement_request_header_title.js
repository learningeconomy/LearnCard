/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Header_TitleInputs */

const en_endorsement_request_header_title = /** @type {(inputs: Endorsement_Request_Header_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsement Request`)
};

const es_endorsement_request_header_title = /** @type {(inputs: Endorsement_Request_Header_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de aval`)
};

const fr_endorsement_request_header_title = /** @type {(inputs: Endorsement_Request_Header_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de recommandation`)
};

const ar_endorsement_request_header_title = /** @type {(inputs: Endorsement_Request_Header_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب توصية`)
};

/**
* | output |
* | --- |
* | "Endorsement Request" |
*
* @param {Endorsement_Request_Header_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_header_title = /** @type {((inputs?: Endorsement_Request_Header_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Header_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_header_title(inputs)
	if (locale === "es") return es_endorsement_request_header_title(inputs)
	if (locale === "fr") return fr_endorsement_request_header_title(inputs)
	return ar_endorsement_request_header_title(inputs)
});
export { endorsement_request_header_title as "endorsement.request.header.title" }