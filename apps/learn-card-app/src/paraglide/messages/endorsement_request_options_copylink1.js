/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Copylink1Inputs */

const en_endorsement_request_options_copylink1 = /** @type {(inputs: Endorsement_Request_Options_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy Link`)
};

const es_endorsement_request_options_copylink1 = /** @type {(inputs: Endorsement_Request_Options_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar enlace`)
};

const fr_endorsement_request_options_copylink1 = /** @type {(inputs: Endorsement_Request_Options_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

const ar_endorsement_request_options_copylink1 = /** @type {(inputs: Endorsement_Request_Options_Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Copy Link" |
*
* @param {Endorsement_Request_Options_Copylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_copylink1 = /** @type {((inputs?: Endorsement_Request_Options_Copylink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Copylink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_copylink1(inputs)
	if (locale === "es") return es_endorsement_request_options_copylink1(inputs)
	if (locale === "fr") return fr_endorsement_request_options_copylink1(inputs)
	return ar_endorsement_request_options_copylink1(inputs)
});
export { endorsement_request_options_copylink1 as "endorsement.request.options.copyLink" }